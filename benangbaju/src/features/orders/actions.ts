'use server'

import { requireAdmin } from '@/lib/auth-guard'

export async function adminUpdateOrderStatusAction(orderId: string, status: 'pending_payment' | 'processing' | 'shipped' | 'completed' | 'cancelled', trackingNumber?: string) {
  const { supabase } = await requireAdmin()
  const { adminUpdateOrderStatus } = await import('@/features/orders/infrastructure/order.repository')
  return adminUpdateOrderStatus(supabase, orderId, status, trackingNumber)
}

export async function adminUpdateTrackingNumberAction(orderId: string, trackingNumber: string) {
  const { supabase } = await requireAdmin()
  const { adminUpdateTrackingNumber } = await import('@/features/orders/infrastructure/order.repository')
  return adminUpdateTrackingNumber(supabase, orderId, trackingNumber)
}
