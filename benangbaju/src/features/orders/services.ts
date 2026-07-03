import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'
import { OrderService } from '@/features/orders/application/order.service'
import * as types from '@/features/orders/domain/order.types'

export type {
  OrderItem,
  OrderShipping,
  PaymentInfo,
  Order,
  CreateOrderParams,
  OrderRpcResponse,
  AdminOrderListItem,
  AdminReturnRequestListItem,
} from '@/features/orders/domain/order.types'

export async function getOrders(
  supabase: SupabaseClient<Database>,
  userId: string,
  status?: string,
  page = 1,
  limit = 10
) {
  return new OrderService(supabase).getOrders(userId, status, page, limit)
}

export async function getOrderDetail(
  supabase: SupabaseClient<Database>,
  orderNumber: string,
  userId?: string
) {
  return new OrderService(supabase).getOrderDetail(orderNumber, userId)
}

export async function createOrder(
  supabase: SupabaseClient<Database>,
  params: types.CreateOrderParams
) {
  return new OrderService(supabase).createOrder(params)
}

export async function cancelOrder(
  supabase: SupabaseClient<Database>,
  orderId: string,
  reason = 'Dibatalkan oleh customer'
) {
  return new OrderService(supabase).cancelOrder(orderId, reason)
}

export async function confirmDelivery(supabase: SupabaseClient<Database>, orderId: string) {
  return new OrderService(supabase).confirmDelivery(orderId)
}

export async function lazyCancelExpiredOrders(supabase: SupabaseClient<Database>, userId: string) {
  return new OrderService(supabase).lazyCancelExpiredOrders(userId)
}

export async function generatePaymentToken(
  supabase: SupabaseClient<Database>,
  orderNumber: string
) {
  return new OrderService(supabase).generatePaymentToken(orderNumber)
}

export async function checkPaymentStatus(supabase: SupabaseClient<Database>, orderNumber: string) {
  return new OrderService(supabase).checkPaymentStatus(orderNumber)
}

export async function adminGetOrders(
  supabase: SupabaseClient<Database>,
  params: { status?: string; search?: string; page?: number; limit?: number } = {}
) {
  return new OrderService(supabase).adminGetOrders(params)
}

export async function adminUpdateOrderStatus(
  supabase: SupabaseClient<Database>,
  orderId: string,
  status: 'pending_payment' | 'processing' | 'shipped' | 'completed' | 'cancelled',
  trackingNumber?: string
) {
  return new OrderService(supabase).adminUpdateOrderStatus(orderId, status, trackingNumber)
}

export async function adminGetReturnRequests(supabase: SupabaseClient<Database>) {
  return new OrderService(supabase).adminGetReturnRequests()
}

export async function adminUpdateReturnRequest(
  supabase: SupabaseClient<Database>,
  requestId: string,
  params: {
    status: 'pending' | 'approved' | 'rejected' | 'completed'
    adminNotes?: string | null
    refundAmount?: number | null
  }
) {
  return new OrderService(supabase).adminUpdateReturnRequest(requestId, params)
}

export async function adminUpdateTrackingNumber(
  supabase: SupabaseClient<Database>,
  orderId: string,
  trackingNumber: string
) {
  return new OrderService(supabase).adminUpdateTrackingNumber(orderId, trackingNumber)
}
