import { safeLogError } from '@/lib/logger'
import { ApiListResponse, ApiResponse, paginated, ok, fail } from '@/lib/api-response'
import { ApiErrorCode } from '@/lib/api-errors'
import { adminLogRepository } from '@/modules/admin-logs/admin-log.repository'
import { createServerClient } from '@/lib/supabase/server'
import { orderRepository } from './order.repository'
import { AdminOrderListItem, AdminReturnRequestListItem, Order } from './types'
import { mapOrder } from './order.mapper'
import { parseOneToMany, parseOneToOne } from '@/shared/utils/supabase-parser'

export class AdminOrderService {
  async getOrders(
    params: { status?: string; search?: string; page?: number; limit?: number; countryCode?: string } = {}
  ): Promise<ApiListResponse<AdminOrderListItem>> {
    try {
      const { page = 1, limit = 20, status = 'all', search = '', countryCode = 'all' } = params
      const offset = (page - 1) * limit

      let escapedSearch = ''
      if (search) {
        escapedSearch = search
          .replace(/\\/g, '\\\\')
          .replace(/%/g, '\\%')
          .replace(/_/g, '\\_')
      }

      const { data, count } = await orderRepository.adminFindMany({
        status,
        escapedSearch,
        offset,
        limit,
        countryCode,
      })

      if (!data) return paginated([], page, limit, 0)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orders: AdminOrderListItem[] = data.map((row: any) => {
        const rawCat = row.profiles
        const profileObj = Array.isArray(rawCat) ? rawCat[0] : rawCat
        let profiles: { name: string; email: string | null } | null = null
        if (profileObj) {
          profiles = {
            name: profileObj.name,
            email: profileObj.email,
          }
        }

        const rawItems = row.order_items
        const itemsList = Array.isArray(rawItems) ? rawItems : []
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const order_items = itemsList.map((item: any) => ({
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
        const shippingObj = Array.isArray(rawShipping) ? rawShipping[0] : rawShipping
        let order_shipping = null
        if (shippingObj) {
          order_shipping = {
            id: shippingObj.id,
            order_id: shippingObj.order_id,
            recipient_name: shippingObj.recipient_name,
            phone: shippingObj.phone,
            full_address: shippingObj.full_address,
            province_name: shippingObj.province_name,
            city_name: shippingObj.city_name,
            district_name: shippingObj.district_name,
            postal_code: shippingObj.postal_code,
            courier_name: shippingObj.courier_name,
            tracking_number: shippingObj.tracking_number,
            shipped_at: shippingObj.shipped_at,
            delivered_at: shippingObj.delivered_at,
            country_code: shippingObj.country_code || 'ID',
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
          payment_fee: Number(row.payment_fee || 0),
          payment_channel: row.payment_channel || null,
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

      return paginated(orders, page, limit, count || 0)
    } catch (error) {
      safeLogError('Error fetching admin orders:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengambil daftar pesanan')
    }
  }

  async updateOrderStatus(
    orderId: string,
    status: 'pending_payment' | 'processing' | 'shipped' | 'completed' | 'cancelled',
    trackingNumber?: string
  ): Promise<ApiResponse<null>> {
    try {
      await orderRepository.adminUpdateStatus(orderId, status, trackingNumber)

      const supabase = await createServerClient()
      await adminLogRepository.insertAdminActivityLog(
        supabase,
        'update',
        'order',
        orderId,
        `Updated order status to ${status}`
      )

      // Send notification to customer (isolated try-catch so notification failure doesn't fail status update)
      try {
        const { data: order } = await supabase
          .from('orders')
          .select('user_id, order_number, order_shipping(country_code, tracking_number)')
          .eq('id', orderId)
          .single()

        if (order?.user_id) {
          const rawShipping = order.order_shipping
          const shipping = Array.isArray(rawShipping) ? rawShipping[0] : rawShipping
          const countryCode = shipping?.country_code || 'ID'
          const effectiveTrackingNumber = trackingNumber || shipping?.tracking_number

          const { notificationService } = await import('@/modules/notifications/notification.service')
          await notificationService.sendOrderStatusNotification(
            order.user_id,
            order.order_number,
            status,
            effectiveTrackingNumber,
            countryCode
          )
        }
      } catch (notifErr) {
        safeLogError('Error sending order status notification:', notifErr)
      }

      return ok(null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      safeLogError('Error updating order status:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengupdate pesanan')
    }
  }

  async getReturnRequests(): Promise<ApiResponse<AdminReturnRequestListItem[]>> {
    try {
      const data = await orderRepository.adminGetReturnRequests()

      if (!data) return ok([])

      return ok(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.map((row: any) => {
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const return_items = itemsList.map((item: any) => {
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const return_media = mediaList.map((m: any) => ({
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
    } catch (error) {
      safeLogError('Error fetching admin return requests:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengambil pengajuan retur')
    }
  }

  async updateReturnRequest(
    requestId: string,
    params: {
      status: 'pending' | 'approved' | 'rejected' | 'completed'
      adminNotes?: string | null
      refundAmount?: number | null
    }
  ): Promise<ApiResponse<null>> {
    try {
      await orderRepository.adminUpdateReturnRequest(requestId, params)

      const supabase = await createServerClient()
      await adminLogRepository.insertAdminActivityLog(
        supabase,
        'update',
        'return_request',
        requestId,
        `Updated return request status to ${params.status}`
      )

      return ok(null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      safeLogError('Error updating return request:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengupdate permintaan retur')
    }
  }

  async updateTrackingNumber(orderId: string, trackingNumber: string): Promise<ApiResponse<null>> {
    try {
      await orderRepository.adminUpdateTrackingNumber(orderId, trackingNumber)

      const supabase = await createServerClient()
      await adminLogRepository.insertAdminActivityLog(
        supabase,
        'update',
        'order',
        orderId,
        `Updated tracking number`
      )

      // Send notification to customer if order is already shipped
      try {
        const { data: order } = await supabase
          .from('orders')
          .select('user_id, order_number, status, order_shipping(country_code)')
          .eq('id', orderId)
          .single()

        if (order?.user_id && order.status === 'shipped') {
          const rawShipping = order.order_shipping
          const shipping = Array.isArray(rawShipping) ? rawShipping[0] : rawShipping
          const countryCode = shipping?.country_code || 'ID'

          const { notificationService } = await import('@/modules/notifications/notification.service')
          await notificationService.sendOrderStatusNotification(
            order.user_id,
            order.order_number,
            'shipped',
            trackingNumber,
            countryCode
          )
        }
      } catch (notifErr) {
        safeLogError('Error sending tracking update notification:', notifErr)
      }

      return ok(null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      safeLogError('Error updating tracking number:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal menyimpan nomor resi')
    }
  }

  async getOrderDetail(orderNumber: string): Promise<ApiResponse<Order | null>> {
    try {
      const data = await orderRepository.findOneByOrderNumber(orderNumber)

      if (!data) return ok(null)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const order_items = parseOneToMany<any>(data.order_items)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const order_shipping = parseOneToOne<any>(data.order_shipping)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payments = parseOneToMany<any>(data.payments)

      return ok(
        mapOrder({
          ...data,
          order_items,
          order_shipping: order_shipping || null,
          payments,
        })
      )
    } catch (error) {
      safeLogError('Error fetching admin order detail:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memuat detail pesanan')
    }
  }
}

export const adminOrderService = new AdminOrderService()
