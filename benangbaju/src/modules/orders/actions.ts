'use server'

import { requireAdmin, requireAuth } from '@/lib/auth-guard'
import { adminOrderService } from './admin-order.service'
import { orderService } from './order.service'

export async function adminUpdateOrderStatusAction(
  orderId: string,
  status: 'pending_payment' | 'processing' | 'shipped' | 'completed' | 'cancelled',
  trackingNumber?: string
) {
  await requireAdmin()
  return adminOrderService.updateOrderStatus(orderId, status, trackingNumber)
}

export async function adminUpdateTrackingNumberAction(orderId: string, trackingNumber: string) {
  await requireAdmin()
  return adminOrderService.updateTrackingNumber(orderId, trackingNumber)
}

export async function adminUpdateReturnRequestAction(
  requestId: string,
  params: {
    status: 'pending' | 'approved' | 'rejected' | 'completed'
    adminNotes?: string | null
    refundAmount?: number | null
  }
) {
  await requireAdmin()
  return adminOrderService.updateReturnRequest(requestId, params)
}

export async function adminGetOrdersAction(params: { status?: string; search?: string; page?: number; limit?: number } = {}) {
  await requireAdmin()
  return adminOrderService.getOrders(params)
}

export async function adminGetReturnRequestsAction() {
  await requireAdmin()
  return adminOrderService.getReturnRequests()
}

export async function getOrdersAction(userId: string, status?: string, page = 1, limit = 10) {
  const { user } = await requireAuth()
  if (user.id !== userId) throw new Error('Unauthorized')
  return orderService.getOrders(userId, status, page, limit)
}

export async function getOrderDetailAction(orderNumber: string, userId?: string) {
  if (userId) {
    const { user } = await requireAuth()
    if (user.id !== userId) throw new Error('Unauthorized')
  }
  return orderService.getOrderDetail(orderNumber, userId)
}

export async function cancelOrderAction(orderId: string, reason?: string) {
  await requireAuth()
  return orderService.cancelOrder(orderId, reason)
}

export async function confirmDeliveryAction(orderId: string) {
  await requireAuth()
  return orderService.confirmDelivery(orderId)
}

export async function generatePaymentTokenAction(orderNumber: string) {
  await requireAuth()
  return orderService.generatePaymentToken(orderNumber)
}

export async function checkPaymentStatusAction(orderNumber: string) {
  await requireAuth()
  return orderService.checkPaymentStatus(orderNumber)
}

export async function lazyCancelExpiredOrdersAction() {
  const { user } = await requireAuth()
  return orderService.lazyCancelExpiredOrders(user.id)
}
