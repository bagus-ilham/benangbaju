'use server'

import { requireAuth } from '@/lib/auth-guard'
import { orderService } from '@/modules/orders/order.service'
import { shippingService } from '@/modules/shipping/shipping.service'
import type { CreateOrderParams } from '@/modules/orders/types'

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  INVALID_SHIPPING: 'INVALID_SHIPPING',
  CHECKOUT_IN_PROGRESS: 'CHECKOUT_IN_PROGRESS',
  EMPTY_CART: 'EMPTY_CART',
  CART_CHANGED: 'CART_CHANGED',
} as const

type CartItemWithWeight = {
  quantity: number
  product_variants?: {
    weight_gram?: number
    products?: { weight_gram?: number } | { weight_gram?: number }[]
  }
}

const DEFAULT_WEIGHT_GRAM = 1000

// In-memory lock to prevent double-submit in the same server instance
const activeCheckouts = new Set<string>()

export async function createSecureOrderAction(params: CreateOrderParams) {
  const { user, supabase } = await requireAuth()

  if (user.id !== params.userId) {
    return { success: false, error: { code: ERROR_CODES.UNAUTHORIZED, message: 'Unauthorized' } }
  }

  // Idempotency / Double-Submit Lock (In-Memory per Instance)
  if (activeCheckouts.has(user.id)) {
    return { success: false, error: { code: ERROR_CODES.CHECKOUT_IN_PROGRESS, message: 'Sedang memproses pesanan Anda. Silakan tunggu.' } }
  }
  activeCheckouts.add(user.id)

  try {
    // Verify shipping cost server-side
    // 1 & 2. Get address zone and cart concurrently
    const [addressRes, cartRes] = await Promise.all([
      supabase.from('user_addresses').select('zone_id').eq('id', params.addressId).single(),
      supabase
        .from('carts')
        .select('id, cart_items(quantity, product_variants(weight_gram, products(weight_gram)))')
        .eq('user_id', user.id)
        .maybeSingle(),
    ])

    const address = addressRes.data
    const userCart = cartRes.data

    if (!address || !address.zone_id) {
      return { success: false, error: { code: ERROR_CODES.INVALID_ADDRESS, message: 'Invalid address or missing shipping zone' } }
    }

    const cartItems = Array.isArray(userCart?.cart_items) ? userCart.cart_items : []
    
    if (cartItems.length === 0) {
      return { success: false, error: { code: ERROR_CODES.EMPTY_CART, message: 'Keranjang belanja kosong' } }
    }

    const totalWeight = calculateCartWeight(cartItems as CartItemWithWeight[])

    // 3 & 4. Validate and get shipping rate
    const selectedRate = await validateAndGetShippingRate(address.zone_id, totalWeight, params)

    if (!selectedRate) {
      return { success: false, error: { code: ERROR_CODES.INVALID_SHIPPING, message: 'Invalid shipping method selected' } }
    }

    // TOCTOU Mitigation: Re-verify cart state right before ordering
    // This minimizes the window for the cart to change while shipping API was being called
    const cartResCheck = await supabase
      .from('carts')
      .select('id, cart_items(quantity, product_variants(weight_gram, products(weight_gram)))')
      .eq('user_id', user.id)
      .maybeSingle()

    const newCartItems = Array.isArray(cartResCheck.data?.cart_items) ? cartResCheck.data.cart_items : []
    const newTotalWeight = calculateCartWeight(newCartItems as CartItemWithWeight[])

    if (totalWeight !== newTotalWeight || cartItems.length !== newCartItems.length) {
      return { success: false, error: { code: ERROR_CODES.CART_CHANGED, message: 'Keranjang Anda telah berubah. Silakan ulangi proses checkout.' } }
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
    activeCheckouts.delete(user.id)
  }
}

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
async function validateAndGetShippingRate(zoneId: any, totalWeight: number, params: CreateOrderParams) {
  const shippingRes = await shippingService.calculateShippingRates(zoneId, totalWeight)
  const validRates = shippingRes.data || []

  return params.shippingRateId
    ? validRates.find((r) => r.id === params.shippingRateId)
    : validRates.find(
        (r) => r.courier_name === params.courierName || params.courierName?.includes(r.courier_name)
      )
}

function calculateCartWeight(cartItems: CartItemWithWeight[]): number {
  return cartItems.reduce((acc, item) => {
    const variant = item.product_variants
    const product = Array.isArray(variant?.products) ? variant.products[0] : variant?.products
    
    const weight = variant?.weight_gram ?? product?.weight_gram ?? DEFAULT_WEIGHT_GRAM
    const parsedWeight = Number(weight) || DEFAULT_WEIGHT_GRAM
    
    return acc + (parsedWeight * (item.quantity || 1))
  }, 0)
}
