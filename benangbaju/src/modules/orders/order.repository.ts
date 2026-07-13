import { isObject } from '@/lib/utils/validation'
import { invokeWithRetry } from '@/lib/utils/retry'
import { createServerClient } from '@/lib/supabase/server'
import { CreateOrderParams } from './types'

export class OrderRepository {
  async findMany(userId: string, status?: string, page = 1, limit = 10) {
    const supabase = await createServerClient()
    let query = supabase
      .from('orders')
      .select(
        'id, order_number, user_id, voucher_id, status, subtotal, shipping_cost, discount_amount, total_amount, notes, cancel_reason, created_at, updated_at, order_items(id, order_id, variant_id, flash_sale_item_id, product_name, variant_name, sku, price, quantity, subtotal), order_shipping(id, order_id, recipient_name, phone, full_address, province_name, city_name, district_name, postal_code, courier_name, tracking_number, shipped_at, delivered_at)',
        { count: 'exact' }
      )
      .eq('user_id', userId)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Order by newest first
    query = query.order('created_at', { ascending: false })

    // Pagination bounds
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, count, error } = await query
    if (error) throw error
    return { data, count }
  }

  async findOneByOrderNumber(orderNumber: string, userId?: string) {
    const supabase = await createServerClient()
    let query = supabase
      .from('orders')
      .select(
        '*, order_items(*, product_reviews(id, rating, body)), order_shipping(*), payments(*)'
      )
      .eq('order_number', orderNumber)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await query.maybeSingle()
    if (error) throw error
    return data
  }

  async create(params: CreateOrderParams) {
    const supabase = await createServerClient()
    const { data, error } = await supabase.rpc('create_order', {
      p_user_id: params.userId,
      p_address_id: params.addressId,
      p_voucher_code: params.voucherCode || undefined,
      p_courier_name: params.courierName || undefined,
      p_shipping_cost: params.shippingCost || 0,
      p_notes: params.notes || undefined,
    })

    if (error) throw error

    if (data && isObject(data)) {
      const success = typeof data['success'] === 'boolean' ? data['success'] : false
      if (!success) {
        throw new Error(
          typeof data['message'] === 'string' ? data['message'] : 'Gagal membuat pesanan'
        )
      }
      return data['data']
    }
    throw new Error('Format respon buat pesanan tidak valid.')
  }

  async cancel(orderId: string, reason = 'Dibatalkan oleh customer') {
    const supabase = await createServerClient()
    const { data, error } = await supabase.rpc('cancel_order', {
      p_order_id: orderId,
      p_cancel_reason: reason,
    })

    if (error) throw error

    if (data && isObject(data)) {
      const success = typeof data['success'] === 'boolean' ? data['success'] : false
      if (!success) {
        throw new Error(
          typeof data['message'] === 'string' ? data['message'] : 'Gagal membatalkan pesanan'
        )
      }
      return true
    }
    throw new Error('Format respon pembatalan tidak valid.')
  }

  async confirmDelivery(orderId: string) {
    const supabase = await createServerClient()
    const { data, error } = await supabase.rpc('confirm_delivery', {
      p_order_id: orderId,
    })

    if (error) throw error

    if (data && isObject(data)) {
      const success = typeof data['success'] === 'boolean' ? data['success'] : false
      if (!success) {
        throw new Error(
          typeof data['message'] === 'string' ? data['message'] : 'Gagal mengkonfirmasi pesanan'
        )
      }
      return true
    }
    throw new Error('Format respon konfirmasi pengiriman tidak valid.')
  }

  async lazyCancelExpiredOrders(userId: string) {
    const supabase = await createServerClient()
    const { error } = await supabase.rpc('lazy_cancel_expired_orders', {
      p_user_id: userId,
    })
    if (error) throw error
  }

  async generatePaymentToken(orderNumber: string) {
    const supabase = await createServerClient()
    return await invokeWithRetry(async () => {
      const { data, error } = await supabase.functions.invoke('generate-payment', {
        body: { order_number: orderNumber },
        timeout: 15000,
        headers: {
          'Idempotency-Key': `payment_${orderNumber}`,
        },
      })
      if (error) throw error
      return data
    })
  }

  async checkPaymentStatus(orderNumber: string) {
    const supabase = await createServerClient()
    return await invokeWithRetry(async () => {
      const { data, error } = await supabase.functions.invoke('check-payment-status', {
        body: { order_number: orderNumber },
        timeout: 10000,
      })
      if (error) throw error
      return data
    })
  }

  async adminFindMany(
    params: { status?: string; escapedSearch?: string; offset?: number; limit?: number } = {}
  ) {
    const supabase = await createServerClient()
    const { status = 'all', escapedSearch = '', offset = 0, limit = 20 } = params

    let query = supabase.from('orders').select(
      `
        id, order_number, user_id, voucher_id, status, subtotal, shipping_cost, discount_amount, total_amount, notes, cancel_reason, created_at, updated_at,
        order_items (id, order_id, variant_id, flash_sale_item_id, product_name, variant_name, sku, price, quantity, subtotal),
        order_shipping (id, order_id, recipient_name, phone, full_address, province_name, city_name, district_name, postal_code, courier_name, tracking_number, shipped_at, delivered_at),
        profiles (name, email)
      `,
      { count: 'exact' }
    )

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (escapedSearch) {
      query = query.or(
        `order_number.ilike.%${escapedSearch}%,order_shipping.recipient_name.ilike.%${escapedSearch}%`
      )
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return { data, count }
  }

  async adminUpdateStatus(
    orderId: string,
    status: 'pending_payment' | 'processing' | 'shipped' | 'completed' | 'cancelled',
    trackingNumber?: string
  ) {
    const supabase = await createServerClient()

    // State machine validation
    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single()

    if (fetchErr) throw fetchErr

    const terminalStates = ['cancelled', 'completed', 'refunded']
    if (terminalStates.includes(order.status)) {
      throw new Error(
        `Invalid state transition: Cannot change status from ${order.status} to ${status}`
      )
    }

    if (status === 'cancelled') {
      return this.cancel(orderId, 'Dibatalkan oleh Admin')
    }
    if (status === 'completed') {
      return this.confirmDelivery(orderId)
    }

    const { error: orderErr } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)

    if (orderErr) throw orderErr

    if (status === 'shipped' && trackingNumber) {
      const { error: shippingErr } = await supabase
        .from('order_shipping')
        .update({
          tracking_number: trackingNumber,
          shipped_at: new Date().toISOString(),
        })
        .eq('order_id', orderId)

      if (shippingErr) throw shippingErr
    }
  }

  async adminGetReturnRequests() {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('return_requests')
      .select(
        `
        id, order_id, user_id, status, reason, customer_notes, admin_notes,
        refund_amount, refund_bank_name, refund_account_number, refund_account_name,
        refund_transferred_at, approved_at, rejected_at, completed_at, created_at, updated_at,
        profiles (name, email),
        orders (order_number, total_amount),
        return_items (
          id, return_request_id, order_item_id, quantity, reason,
          order_items (product_name, variant_name, price, sku)
        ),
        return_media (
          id, url, sort_order
        )
      `
      )
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async adminUpdateReturnRequest(
    requestId: string,
    params: {
      status: 'pending' | 'approved' | 'rejected' | 'completed'
      adminNotes?: string | null
      refundAmount?: number | null
    }
  ) {
    const supabase = await createServerClient()
    const { status, adminNotes, refundAmount } = params
    const now = new Date().toISOString()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      status,
      admin_notes: adminNotes,
      refund_amount: refundAmount,
      updated_at: now,
    }

    if (status === 'approved') {
      updateData.approved_at = now
    } else if (status === 'rejected') {
      updateData.rejected_at = now
    } else if (status === 'completed') {
      updateData.completed_at = now
      updateData.refund_transferred_at = now
    }

    const { error } = await supabase.from('return_requests').update(updateData).eq('id', requestId)
    if (error) throw error
  }

  async adminUpdateTrackingNumber(orderId: string, trackingNumber: string) {
    const supabase = await createServerClient()
    const { error } = await supabase
      .from('order_shipping')
      .update({ tracking_number: trackingNumber })
      .eq('order_id', orderId)

    if (error) throw error
  }
}

export const orderRepository = new OrderRepository()
