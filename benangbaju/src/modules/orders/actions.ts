'use server'

import { requireAdmin, requireAuth } from '@/lib/auth-guard'
import { adminOrderService } from './admin-order.service'
import { orderService } from './order.service'
import type { CreateOrderParams } from '@/modules/orders/types'
import {
  validateAndGetShippingRate,
  calculateCartWeight,
  type CartItemWithWeight,
} from '@/modules/shipping/shipping.utils'
import { fail, type ApiResponse } from '@/lib/api-response'

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  INVALID_SHIPPING: 'INVALID_SHIPPING',
  CHECKOUT_IN_PROGRESS: 'CHECKOUT_IN_PROGRESS',
  EMPTY_CART: 'EMPTY_CART',
  CART_CHANGED: 'CART_CHANGED',
} as const

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

export async function adminGetOrdersAction(
  params: { status?: string; search?: string; page?: number; limit?: number } = {}
) {
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
  const { user } = await requireAuth()
  // If userId is provided, verify ownership. Otherwise use the authenticated user's ID.
  const effectiveUserId = userId || user.id
  if (user.id !== effectiveUserId) throw new Error('Unauthorized')
  return orderService.getOrderDetail(orderNumber, effectiveUserId)
}

export async function cancelOrderAction(
  orderId: string,
  reason?: string
): Promise<ApiResponse<null>> {
  const { user, supabase } = await requireAuth()

  const { data: order, error } = await supabase
    .from('orders')
    .select('user_id')
    .eq('id', orderId)
    .single()
  if (error || !order || order.user_id !== user.id) {
    throw new Error('Unauthorized')
  }

  return orderService.cancelOrder(orderId, reason)
}

export async function confirmDeliveryAction(orderId: string): Promise<ApiResponse<null>> {
  const { user, supabase } = await requireAuth()

  const { data: order, error } = await supabase
    .from('orders')
    .select('user_id')
    .eq('id', orderId)
    .single()
  if (error || !order || order.user_id !== user.id) {
    throw new Error('Unauthorized')
  }

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

export async function createSecureOrderAction(params: CreateOrderParams) {
  const { user, supabase } = await requireAuth()

  if (user.id !== params.userId) {
    return fail(ERROR_CODES.UNAUTHORIZED, 'Unauthorized')
  }

  // Idempotency / Double-Submit Lock (Database-backed)
  // Clean up any stale locks (TTL 5 mins) before trying to acquire a new one
  await supabase.rpc('cleanup_checkout_locks')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: lockError } = await supabase
    .from('checkout_locks' as any)
    .insert({ user_id: user.id })
  if (lockError) {
    return fail(ERROR_CODES.CHECKOUT_IN_PROGRESS, 'Sedang memproses pesanan Anda. Silakan tunggu.')
  }

  try {
    // Verify shipping cost server-side
    // 1 & 2. Get address zone and cart concurrently
    const [addressRes, cartRes] = await Promise.all([
      supabase.from('user_addresses').select('zone_id').eq('id', params.addressId).single(),
      supabase
        .from('carts')
        .select(
          'id, cart_items(variant_id, quantity, product_variants(weight_gram, products(weight_gram)))'
        )
        .eq('user_id', user.id)
        .maybeSingle(),
    ])

    const address = addressRes.data
    const userCart = cartRes.data

    if (!address || !address.zone_id) {
      return fail(ERROR_CODES.INVALID_ADDRESS, 'Invalid address or missing shipping zone')
    }

    const cartItems = Array.isArray(userCart?.cart_items) ? userCart.cart_items : []

    if (cartItems.length === 0) {
      return fail(ERROR_CODES.EMPTY_CART, 'Keranjang belanja kosong')
    }

    const totalWeight = calculateCartWeight(cartItems as CartItemWithWeight[])

    // 3 & 4. Validate and get shipping rate
    const selectedRate = await validateAndGetShippingRate(address.zone_id, totalWeight, params)

    if (!selectedRate) {
      return fail(ERROR_CODES.INVALID_SHIPPING, 'Invalid shipping method selected')
    }

    // TOCTOU Mitigation: Re-verify cart state right before ordering
    // This minimizes the window for the cart to change while shipping API was being called
    const cartResCheck = await supabase
      .from('carts')
      .select(
        'id, cart_items(variant_id, quantity, product_variants(weight_gram, products(weight_gram)))'
      )
      .eq('user_id', user.id)
      .maybeSingle()

    const newCartItems = Array.isArray(cartResCheck.data?.cart_items)
      ? cartResCheck.data.cart_items
      : []
    const newTotalWeight = calculateCartWeight(newCartItems as CartItemWithWeight[])

    // TOCTOU Fix: Verify item identities and quantities match
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extractSort = (items: any[]) =>
      items
        .map((i) => ({ id: i.variant_id, q: i.quantity }))
        .sort((a, b) => String(a.id).localeCompare(String(b.id)))
    const originalItemsStr = JSON.stringify(extractSort(cartItems))
    const newItemsStr = JSON.stringify(extractSort(newCartItems))

    if (totalWeight !== newTotalWeight || originalItemsStr !== newItemsStr) {
      return fail(
        ERROR_CODES.CART_CHANGED,
        'Keranjang Anda telah berubah. Silakan ulangi proses checkout.'
      )
    }

    // 5. Override the client-provided cost with the server-calculated cost
    const secureParams = {
      ...params,
      shippingCost: selectedRate.price,
    }

    // Proceed with creating the order
    return await orderService.createOrder(secureParams)
  } finally {
    // Release the lock
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase
      .from('checkout_locks' as any)
      .delete()
      .eq('user_id', user.id)
  }
}
