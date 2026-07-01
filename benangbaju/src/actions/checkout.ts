'use server'

import { requireAuth } from '@/lib/auth-guard'
import { createOrder } from '@/services/orders'
import { calculateShippingRates } from '@/services/shipping'
import type { CreateOrderParams } from '@/services/orders'

export async function createSecureOrderAction(params: CreateOrderParams) {
  const { user, supabase } = await requireAuth()

  if (user.id !== params.userId) {
    throw new Error('Unauthorized')
  }

  // Verify shipping cost server-side
  // 1. Get address zone
  const { data: address } = await supabase
    .from('user_addresses')
    .select('zone_id')
    .eq('id', params.addressId)
    .single()

  if (!address || !address.zone_id) {
    throw new Error('Invalid address or missing shipping zone')
  }

  // 2. Calculate total weight from user's cart
  const { data: userCart } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', user.id)
    .single()

  let totalWeight = 0
  if (userCart) {
    const { data: cartItems } = await supabase
      .from('cart_items')
      .select('quantity, product_variants(weight_gram, products(weight_gram))')
      .eq('cart_id', userCart.id)

    if (cartItems) {
      totalWeight = cartItems.reduce((acc, item) => {
        let weight = 1000 // default 1kg
        // Using any here because of complex join typing in supabase which might cause TS errors
        const variant = item.product_variants as any
        if (variant) {
          if (typeof variant.weight_gram === 'number') {
            weight = variant.weight_gram
          } else {
            // Use product weight
            const product = Array.isArray(variant.products) ? variant.products[0] : variant.products
            if (product && typeof product === 'object' && 'weight_gram' in product && typeof product.weight_gram === 'number') {
              weight = product.weight_gram
            }
          }
        }
        return acc + weight * item.quantity
      }, 0)
    }
  }

  // 3. Fetch valid shipping rates
  const shippingRes = await calculateShippingRates(supabase, address.zone_id, totalWeight)
  const validRates = shippingRes.data || []

  // 4. Validate the requested courier matches a valid rate
  const selectedRate = validRates.find(r => params.courierName?.includes(r.courier_name))
  
  if (!selectedRate) {
    throw new Error('Invalid shipping method selected')
  }

  // 5. Override the client-provided cost with the server-calculated cost
  const secureParams = {
    ...params,
    shippingCost: selectedRate.price
  }

  // Proceed with creating the order
  return createOrder(supabase, secureParams)
}
