import { safeLogError } from '@/lib/logger'
import { insertAdminActivityLog } from '@/modules/admin-logs/services'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'
import {
  OrderItem,
  OrderShipping,
  PaymentInfo,
  Order,
  CreateOrderParams,
  OrderRpcResponse,
  AdminOrderListItem,
  AdminReturnRequestListItem,
} from './types'

export type {
  OrderItem,
  OrderShipping,
  PaymentInfo,
  Order,
  CreateOrderParams,
  OrderRpcResponse,
  AdminOrderListItem,
  AdminReturnRequestListItem,
}
import { ApiListResponse, ApiResponse, paginated, ok, fail } from '@/lib/api-response'
import { ApiErrorCode } from '@/lib/api-errors'

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val)
}

function mapOrder(
  row: Database['public']['Tables']['orders']['Row'] & {
    order_items: Database['public']['Tables']['order_items']['Row'][]
    order_shipping: Database['public']['Tables']['order_shipping']['Row'] | null
    payments?: Database['public']['Tables']['payments']['Row'][]
  }
): Order {
  const order_items: OrderItem[] = row.order_items.map((item) => {
    const rawReview = (item as any).product_reviews
    const review = Array.isArray(rawReview) ? rawReview[0] : rawReview ? rawReview : null

    return {
      id: item.id,
      order_id: item.order_id,
      variant_id: item.variant_id,
      flash_sale_item_id: item.flash_sale_item_id,
      product_name: item.product_name,
      variant_name: item.variant_name,
      sku: item.sku,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.subtotal,
      product_reviews: review
        ? {
            id: review.id,
            rating: review.rating,
            body: review.body,
          }
        : null,
    }
  })

  const rawShipping = row.order_shipping
  let order_shipping: OrderShipping | null = null
  if (rawShipping) {
    order_shipping = {
      id: rawShipping.id,
      order_id: rawShipping.order_id,
      recipient_name: rawShipping.recipient_name,
      phone: rawShipping.phone,
      full_address: rawShipping.full_address,
      province_name: rawShipping.province_name,
      city_name: rawShipping.city_name,
      district_name: rawShipping.district_name,
      postal_code: rawShipping.postal_code,
      courier_name: rawShipping.courier_name,
      tracking_number: rawShipping.tracking_number,
      shipped_at: rawShipping.shipped_at,
      delivered_at: rawShipping.delivered_at,
    }
  }

  const rawPayments = row.payments
  const paymentsList = Array.isArray(rawPayments) ? rawPayments : []
  const payments = paymentsList.map((p) => {
    const paymentStatusMap: Record<string, PaymentInfo['status']> = {
      pending: 'pending',
      success: 'success',
      failed: 'failed',
      expired: 'expired',
      refunded: 'refunded',
    }
    return {
      id: p.id,
      order_id: p.order_id,
      midtrans_order_id: p.midtrans_order_id,
      status: paymentStatusMap[p.status] || 'pending',
      amount: p.amount,
      payment_type: p.payment_type,
      va_number: p.va_number,
      biller_code: p.biller_code,
      payment_code: p.payment_code,
      qr_url: p.qr_url,
      snap_token: p.snap_token,
      created_at: p.created_at,
      updated_at: p.updated_at,
    }
  })

  const statusMap: Record<string, Order['status']> = {
    pending_payment: 'pending_payment',
    processing: 'processing',
    shipped: 'shipped',
    completed: 'completed',
    cancelled: 'cancelled',
  }

  return {
    id: row.id,
    order_number: row.order_number,
    user_id: row.user_id,
    voucher_id: row.voucher_id,
    status: statusMap[row.status] || 'pending_payment',
    subtotal: row.subtotal,
    shipping_cost: row.shipping_cost,
    discount_amount: row.discount_amount,
    total_amount: row.total_amount,
    notes: row.notes,
    cancel_reason: row.cancel_reason,
    created_at: row.created_at,
    updated_at: row.updated_at,
    order_items,
    order_shipping,
    payments,
  }
}

// 1. Get order history
export async function getOrders(
  supabase: SupabaseClient<Database>,
  userId: string,
  status?: string,
  page = 1,
  limit = 10
): Promise<ApiListResponse<Order>> {
  let query = supabase
    .from('orders')
    .select(
      'id, order_number, user_id, voucher_id, status, subtotal, shipping_cost, discount_amount, total_amount, notes, cancel_reason, created_at, updated_at, order_items(id, order_id, variant_id, flash_sale_item_id, product_name, variant_name, sku, price, quantity, subtotal, product_reviews(id, rating, body)), order_shipping(id, order_id, recipient_name, phone, full_address, province_name, city_name, district_name, postal_code, courier_name, tracking_number, shipped_at, delivered_at)',
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

  if (error) {
    safeLogError('Error fetching orders:', error)
    return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memuat pesanan')
  }

  if (!data) return paginated([], 0, page, limit)

  const orders = data.map((row) => {
    const rawItems = row.order_items
    const order_items = Array.isArray(rawItems) ? rawItems : []
    const rawShipping = row.order_shipping
    const order_shipping = Array.isArray(rawShipping) ? null : rawShipping

    return mapOrder({
      ...row,
      order_items,
      order_shipping: order_shipping || null,
    })
  })

  return paginated(orders, count || 0, page, limit)
}

// 2. Get order details by order number
export async function getOrderDetail(
  supabase: SupabaseClient<Database>,
  orderNumber: string,
  userId?: string
): Promise<ApiResponse<Order | null>> {
  // 🛡️ SENTINEL FIX
  // Vulnerability: IDOR on order details
  // Severity: Critical
  // Fix: Added userId parameter to verify order ownership. Admin skips this by passing undefined.
  // Impact: Prevents unauthenticated/unauthorized users from viewing other user's order details.
  let query = supabase
    .from('orders')
    .select('*, order_items(*, product_reviews(id, rating, body)), order_shipping(*), payments(*)')
    .eq('order_number', orderNumber)

  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    safeLogError('Error fetching order detail:', error)
    return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memuat detail pesanan')
  }

  if (!data) return ok(null)

  const rawItems = data.order_items
  const order_items = Array.isArray(rawItems) ? rawItems : []
  const rawShipping = data.order_shipping
  const order_shipping = Array.isArray(rawShipping) ? null : rawShipping
  const rawPayments = data.payments
  const payments = Array.isArray(rawPayments) ? rawPayments : []

  return ok(
    mapOrder({
      ...data,
      order_items,
      order_shipping: order_shipping || null,
      payments,
    })
  )
}

// 3. Create order (Atomic Checkout RPC)
export async function createOrder(
  supabase: SupabaseClient<Database>,
  params: CreateOrderParams
): Promise<ApiResponse<OrderRpcResponse['data']>> {
  const { data, error } = await supabase.rpc('create_order', {
    p_user_id: params.userId,
    p_address_id: params.addressId,
    p_voucher_code: params.voucherCode || undefined,
    p_courier_name: params.courierName || undefined,
    p_shipping_cost: params.shippingCost || 0,
    p_notes: params.notes || undefined,
  })

  if (error) {
    safeLogError('Error calling create_order:', error)
    return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal membuat pesanan. Silakan coba lagi.')
  }

  if (data && isObject(data)) {
    const success = typeof data['success'] === 'boolean' ? data['success'] : false
    const message = typeof data['message'] === 'string' ? data['message'] : undefined

    if (!success) return fail(ApiErrorCode.INTERNAL_ERROR, message || 'Gagal membuat pesanan')

    const rawInnerData = data['data']
    let innerData: OrderRpcResponse['data'] = undefined
    if (rawInnerData && isObject(rawInnerData)) {
      innerData = {
        order_id: typeof rawInnerData['order_id'] === 'string' ? rawInnerData['order_id'] : '',
        order_number:
          typeof rawInnerData['order_number'] === 'string' ? rawInnerData['order_number'] : '',
        subtotal: typeof rawInnerData['subtotal'] === 'number' ? rawInnerData['subtotal'] : 0,
        shipping_cost:
          typeof rawInnerData['shipping_cost'] === 'number' ? rawInnerData['shipping_cost'] : 0,
        discount_amount:
          typeof rawInnerData['discount_amount'] === 'number' ? rawInnerData['discount_amount'] : 0,
        total_amount:
          typeof rawInnerData['total_amount'] === 'number' ? rawInnerData['total_amount'] : 0,
        status: typeof rawInnerData['status'] === 'string' ? rawInnerData['status'] : '',
      }
    }

    return ok(innerData)
  }

  return fail(ApiErrorCode.INTERNAL_ERROR, 'Format respon buat pesanan tidak valid.')
}

// 4. Cancel unpaid order
export async function cancelOrder(
  supabase: SupabaseClient<Database>,
  orderId: string,
  reason = 'Dibatalkan oleh customer'
): Promise<ApiResponse<null>> {
  const { data, error } = await supabase.rpc('cancel_order', {
    p_order_id: orderId,
    p_cancel_reason: reason,
  })

  if (error) {
    safeLogError('Error calling cancel_order:', error)
    return fail(ApiErrorCode.INTERNAL_ERROR, 'Terjadi kesalahan saat membatalkan pesanan.')
  }

  if (data && isObject(data)) {
    const success = typeof data['success'] === 'boolean' ? data['success'] : false
    if (!success) {
      return fail(
        ApiErrorCode.INTERNAL_ERROR,
        typeof data['message'] === 'string' ? data['message'] : 'Gagal membatalkan pesanan'
      )
    }
    return ok(null)
  }

  return fail(ApiErrorCode.INTERNAL_ERROR, 'Format respon pembatalan tidak valid.')
}

// 5. Confirm delivery (complete order status)
export async function confirmDelivery(
  supabase: SupabaseClient<Database>,
  orderId: string
): Promise<ApiResponse<null>> {
  const { data, error } = await supabase.rpc('confirm_delivery', {
    p_order_id: orderId,
  })

  if (error) {
    safeLogError('Error calling confirm_delivery:', error)
    return fail(ApiErrorCode.INTERNAL_ERROR, 'Terjadi kesalahan saat mengkonfirmasi pesanan.')
  }

  if (data && isObject(data)) {
    const success = typeof data['success'] === 'boolean' ? data['success'] : false
    if (!success) {
      return fail(
        ApiErrorCode.INTERNAL_ERROR,
        typeof data['message'] === 'string' ? data['message'] : 'Gagal mengkonfirmasi pesanan'
      )
    }
    return ok(null)
  }

  return fail(ApiErrorCode.INTERNAL_ERROR, 'Format respon konfirmasi pengiriman tidak valid.')
}

// 6. Lazy cancel expired orders
export async function lazyCancelExpiredOrders(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<void> {
  const { error } = await supabase.rpc('lazy_cancel_expired_orders', {
    p_user_id: userId,
  })

  if (error) {
    safeLogError('Error calling lazy_cancel_expired_orders:', error)
  }
}

// 7. Request Midtrans snap token from Edge Function
export async function generatePaymentToken(
  supabase: SupabaseClient<Database>,
  orderNumber: string
): Promise<ApiResponse<{ token?: string; redirect_url?: string }>> {
  const { data, error } = await supabase.functions.invoke('generate-payment', {
    body: { order_number: orderNumber },
  })

  if (error) {
    safeLogError('Error invoking generate-payment function:', error)
    return fail(
      ApiErrorCode.INTERNAL_ERROR,
      'Gagal menghubungi server pembayaran. Silakan coba lagi.'
    )
  }

  const res = data as {
    success: boolean
    message?: string
    data?: {
      token: string
      redirect_url: string
    }
  } | null

  if (!res || !res.success || !res.data) {
    return fail(ApiErrorCode.INTERNAL_ERROR, res?.message || 'Gagal memproses pembayaran.')
  }

  return ok({
    token: res.data.token,
    redirect_url: res.data.redirect_url,
  })
}

// 8. Check payment status directly with Midtrans API (fallback for webhook)
export async function checkPaymentStatus(
  supabase: SupabaseClient<Database>,
  orderNumber: string
): Promise<ApiResponse<{ order_status?: string; payment_status?: string }>> {
  const { data, error } = await supabase.functions.invoke('check-payment-status', {
    body: { order_number: orderNumber },
  })

  if (error) {
    safeLogError('Error invoking check-payment-status function:', error)
    return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengecek status pembayaran.')
  }

  const res = data as {
    success: boolean
    message?: string
    data?: {
      order_status: string
      payment_status: string
      transaction_status?: string
    }
  } | null

  if (!res || !res.success || !res.data) {
    return fail(ApiErrorCode.INTERNAL_ERROR, res?.message || 'Gagal mengecek status pembayaran.')
  }

  return ok({
    order_status: res.data.order_status,
    payment_status: res.data.payment_status,
  })
}

export async function adminGetOrders(
  supabase: SupabaseClient<Database>,
  params: { status?: string; search?: string; page?: number; limit?: number } = {}
): Promise<ApiListResponse<AdminOrderListItem>> {
  const { status = 'all', search = '', page = 1, limit = 20 } = params
  const offset = (page - 1) * limit

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

  if (search) {
    const escapedSearch = search
      .replace(/\\/g, '\\\\')
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_')
      .replace(/,/g, '\\,')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
    query = query.or(
      `order_number.ilike.%${escapedSearch}%,order_shipping.recipient_name.ilike.%${escapedSearch}%`
    )
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    safeLogError('Error fetching admin orders:', error)
    return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengambil daftar pesanan')
  }

  if (!data) return paginated([], 0, page, limit)

  const orders: AdminOrderListItem[] = data.map((row) => {
    const rawCat = row.profiles
    let profiles: { name: string; email: string | null } | null = null
    if (rawCat && !Array.isArray(rawCat)) {
      profiles = {
        name: rawCat.name,
        email: rawCat.email,
      }
    }

    const rawItems = row.order_items
    const itemsList = Array.isArray(rawItems) ? rawItems : []
    const order_items = itemsList.map((item) => ({
      id: item.id,
      order_id: item.order_id,
      variant_id: item.variant_id,
      flash_sale_item_id: item.flash_sale_item_id,
      product_name: item.product_name,
      variant_name: item.variant_name,
      sku: item.sku,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.subtotal,
    }))

    const rawShipping = row.order_shipping
    let order_shipping: OrderShipping | null = null
    if (rawShipping && !Array.isArray(rawShipping)) {
      order_shipping = {
        id: rawShipping.id,
        order_id: rawShipping.order_id,
        recipient_name: rawShipping.recipient_name,
        phone: rawShipping.phone,
        full_address: rawShipping.full_address,
        province_name: rawShipping.province_name,
        city_name: rawShipping.city_name,
        district_name: rawShipping.district_name,
        postal_code: rawShipping.postal_code,
        courier_name: rawShipping.courier_name,
        tracking_number: rawShipping.tracking_number,
        shipped_at: rawShipping.shipped_at,
        delivered_at: rawShipping.delivered_at,
      }
    }

    return {
      id: row.id,
      order_number: row.order_number,
      user_id: row.user_id,
      voucher_id: row.voucher_id,
      status: row.status,
      subtotal: row.subtotal,
      shipping_cost: row.shipping_cost,
      discount_amount: row.discount_amount,
      total_amount: row.total_amount,
      notes: row.notes,
      cancel_reason: row.cancel_reason,
      created_at: row.created_at,
      updated_at: row.updated_at,
      order_items,
      order_shipping,
      profiles,
    }
  })

  return paginated(orders, count || 0, page, limit)
}

export async function adminUpdateOrderStatus(
  supabase: SupabaseClient<Database>,
  orderId: string,
  status: 'pending_payment' | 'processing' | 'shipped' | 'completed' | 'cancelled',
  trackingNumber?: string
): Promise<ApiResponse<null>> {
  if (status === 'cancelled') {
    return await cancelOrder(supabase, orderId, 'Dibatalkan oleh Admin')
  }
  if (status === 'completed') {
    return await confirmDelivery(supabase, orderId)
  }

  const { error: orderErr } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (orderErr) return fail('Gagal mengupdate pesanan', orderErr.message)

  if (status === 'shipped' && trackingNumber) {
    const { error: shippingErr } = await supabase
      .from('order_shipping')
      .update({
        tracking_number: trackingNumber,
        shipped_at: new Date().toISOString(),
      })
      .eq('order_id', orderId)

    if (shippingErr) return fail('Gagal menyimpan resi', shippingErr.message)
  }

  await insertAdminActivityLog(
    supabase,
    'update',
    'order',
    orderId,
    `Updated order status to ${status}`
  )

  return ok(null)
}

export async function adminGetReturnRequests(
  supabase: SupabaseClient<Database>
): Promise<ApiResponse<AdminReturnRequestListItem[]>> {
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

  if (error) {
    safeLogError('Error fetching admin return requests:', error)
    return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengambil pengajuan retur')
  }

  if (!data) return ok([])

  return ok(
    data.map((row) => {
      const rawProfile = row.profiles
      let profiles: { name: string; email: string | null } | null = null
      if (rawProfile && !Array.isArray(rawProfile)) {
        profiles = {
          name: rawProfile.name,
          email: rawProfile.email,
        }
      }

      const rawOrder = row.orders
      let orders: { order_number: string; total_amount: number } | null = null
      if (rawOrder && !Array.isArray(rawOrder)) {
        orders = {
          order_number: rawOrder.order_number,
          total_amount: rawOrder.total_amount,
        }
      }

      const rawItems = row.return_items
      const itemsList = Array.isArray(rawItems) ? rawItems : []
      const return_items = itemsList.map((item) => {
        const rawOrderItem = item.order_items
        let order_items: {
          product_name: string
          variant_name: string
          price: number
          sku: string
        } | null = null
        if (rawOrderItem && !Array.isArray(rawOrderItem)) {
          order_items = {
            product_name: rawOrderItem.product_name,
            variant_name: rawOrderItem.variant_name,
            price: rawOrderItem.price,
            sku: rawOrderItem.sku,
          }
        }
        return {
          id: item.id,
          return_request_id: item.return_request_id,
          order_item_id: item.order_item_id,
          quantity: item.quantity,
          reason: item.reason,
          order_items,
        }
      })

      const rawMedia = row.return_media
      const mediaList = Array.isArray(rawMedia) ? rawMedia : []
      const return_media = mediaList.map((m) => ({
        id: m.id,
        url: m.url,
        sort_order: m.sort_order,
      }))

      return {
        id: row.id,
        order_id: row.order_id,
        user_id: row.user_id,
        status: row.status,
        reason: row.reason,
        customer_notes: row.customer_notes,
        admin_notes: row.admin_notes,
        refund_amount: row.refund_amount,
        refund_bank_name: row.refund_bank_name,
        refund_account_number: row.refund_account_number,
        refund_account_name: row.refund_account_name,
        refund_transferred_at: row.refund_transferred_at,
        approved_at: row.approved_at,
        rejected_at: row.rejected_at,
        completed_at: row.completed_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
        profiles,
        orders,
        return_items,
        return_media,
      }
    })
  )
}

export async function adminUpdateReturnRequest(
  supabase: SupabaseClient<Database>,
  requestId: string,
  params: {
    status: 'pending' | 'approved' | 'rejected' | 'completed'
    adminNotes?: string | null
    refundAmount?: number | null
  }
): Promise<ApiResponse<null>> {
  const { status, adminNotes, refundAmount } = params
  const now = new Date().toISOString()

  const updateData: Database['public']['Tables']['return_requests']['Update'] = {
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

  if (error) {
    safeLogError('Error updating return request:', error)
    return fail('Gagal mengupdate permintaan retur', error.message)
  }

  await insertAdminActivityLog(
    supabase,
    'update',
    'return_request',
    requestId,
    `Updated return request status to ${status}`
  )

  return ok(null)
}

export async function adminUpdateTrackingNumber(
  supabase: SupabaseClient<Database>,
  orderId: string,
  trackingNumber: string
): Promise<ApiResponse<null>> {
  const { error } = await supabase
    .from('order_shipping')
    .update({ tracking_number: trackingNumber })
    .eq('order_id', orderId)

  if (error) {
    safeLogError('Error updating tracking number:', error)
    return fail('Gagal menyimpan nomor resi', error.message)
  }

  await insertAdminActivityLog(supabase, 'update', 'order', orderId, `Updated tracking number`)

  return ok(null)
}

export * from './types'
