import { DEFAULT_WEIGHT_GRAM } from '@/lib/constants'
import { shippingService } from './shipping.service'
import type { CreateOrderParams } from '@/modules/orders/types'

export type CartItemWithWeight = {
  quantity: number
  product_variants?: {
    weight_gram?: number
    products?: { weight_gram?: number } | { weight_gram?: number }[]
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function validateAndGetShippingRate(
  zoneId: any,
  totalWeight: number,
  params: CreateOrderParams
) {
  const shippingRes = await shippingService.calculateShippingRates(zoneId, totalWeight)
  if (!shippingRes.success || !shippingRes.data) return undefined
  const validRates = shippingRes.data

  return params.shippingRateId
    ? validRates.find((r) => r.id === params.shippingRateId)
    : validRates.find(
        (r) => r.courier_name === params.courierName || params.courierName?.includes(r.courier_name)
      )
}

export function calculateCartWeight(cartItems: CartItemWithWeight[]): number {
  return cartItems.reduce((acc, item) => {
    const variant = item.product_variants
    const product = Array.isArray(variant?.products) ? variant.products[0] : variant?.products

    const weight = variant?.weight_gram ?? product?.weight_gram ?? DEFAULT_WEIGHT_GRAM
    const parsedWeight = Number(weight) || DEFAULT_WEIGHT_GRAM

    return acc + parsedWeight * (item.quantity || 1)
  }, 0)
}
