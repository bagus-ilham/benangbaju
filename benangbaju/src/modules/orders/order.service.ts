import { safeLogError } from '@/lib/logger'
import { ApiListResponse, ApiResponse, paginated, ok, fail } from '@/lib/api-response'
import { ApiErrorCode } from '@/lib/api-errors'
import { orderRepository } from './order.repository'
import { mapOrder } from './order.mapper'
import { Order, CreateOrderParams, OrderRpcResponse } from './types'
import { parseOneToMany, parseOneToOne } from '@/shared/utils/supabase-parser'

export class OrderService {
  async getOrders(
    userId: string,
    status?: string,
    page = 1,
    limit = 10
  ): Promise<ApiListResponse<Order>> {
    try {
      const { data, count } = await orderRepository.findMany(userId, status, page, limit)

      if (!data) return paginated([], page, limit, 0)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orders = data.map((row: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const order_items = parseOneToMany<any>(row.order_items)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const order_shipping = parseOneToOne<any>(row.order_shipping)

        return mapOrder({
          ...row,
          order_items,
          order_shipping: order_shipping || null,
        })
      })

      return paginated(orders, page, limit, count || 0)
    } catch (error) {
      safeLogError('Error fetching orders:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memuat pesanan')
    }
  }

  async getOrderDetail(orderNumber: string, userId?: string): Promise<ApiResponse<Order | null>> {
    try {
      const data = await orderRepository.findOneByOrderNumber(orderNumber, userId)

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
      safeLogError('Error fetching order detail:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memuat detail pesanan')
    }
  }

  async createOrder(
    params: CreateOrderParams
  ): Promise<ApiResponse<NonNullable<OrderRpcResponse['data']>>> {
    try {
      const innerData = await orderRepository.create(params)

      if (!innerData || typeof innerData !== 'object' || !('order_id' in innerData)) {
        throw new Error('Invalid response format from database')
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inner = innerData as Record<string, any>
      const parsedData: OrderRpcResponse['data'] = {
        order_id: String(inner.order_id || ''),
        order_number: String(inner.order_number || ''),
        subtotal: Number(inner.subtotal || 0),
        shipping_cost: Number(inner.shipping_cost || 0),
        discount_amount: Number(inner.discount_amount || 0),
        total_amount: Number(inner.total_amount || 0),
        status: String(inner.status || ''),
      }

      return ok(parsedData)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      safeLogError('Error creating order:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, error.message || 'Gagal membuat pesanan')
    }
  }

  async cancelOrder(
    orderId: string,
    reason = 'Dibatalkan oleh customer'
  ): Promise<ApiResponse<null>> {
    try {
      await orderRepository.cancel(orderId, reason)
      return ok(null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      safeLogError('Error cancelling order:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, error.message || 'Gagal membatalkan pesanan')
    }
  }

  async confirmDelivery(orderId: string): Promise<ApiResponse<null>> {
    try {
      await orderRepository.confirmDelivery(orderId)
      return ok(null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      safeLogError('Error confirming delivery:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, error.message || 'Gagal mengkonfirmasi pesanan')
    }
  }

  async lazyCancelExpiredOrders(userId: string): Promise<void> {
    try {
      await orderRepository.lazyCancelExpiredOrders(userId)
    } catch (error) {
      safeLogError('Error calling lazy_cancel_expired_orders:', error)
    }
  }

  async generatePaymentToken(
    orderNumber: string
  ): Promise<ApiResponse<{ token?: string; redirect_url?: string }>> {
    try {
      const data = await orderRepository.generatePaymentToken(orderNumber)

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      safeLogError('Error generating payment token:', error)
      return fail(
        ApiErrorCode.INTERNAL_ERROR,
        'Gagal menghubungi server pembayaran. Silakan coba lagi.'
      )
    }
  }

  async checkPaymentStatus(
    orderNumber: string
  ): Promise<ApiResponse<{ order_status?: string; payment_status?: string }>> {
    try {
      const data = await orderRepository.checkPaymentStatus(orderNumber)

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
        return fail(
          ApiErrorCode.INTERNAL_ERROR,
          res?.message || 'Gagal mengecek status pembayaran.'
        )
      }

      return ok({
        order_status: res.data.order_status,
        payment_status: res.data.payment_status,
      })
    } catch (error) {
      safeLogError('Error checking payment status:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengecek status pembayaran.')
    }
  }
}

export const orderService = new OrderService()
