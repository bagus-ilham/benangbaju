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

export async function validateAndGetShippingRate(
  zoneId: string | null | undefined,
  totalWeight: number,
  params: CreateOrderParams
) {
  if (!zoneId) return undefined
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

    const variantWeight = Number(variant?.weight_gram)
    const productWeight = Number(product?.weight_gram)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itemWeight = Number((item as any)?.weight_gram)

    const parsedWeight =
      !isNaN(variantWeight) && variantWeight > 0
        ? variantWeight
        : !isNaN(productWeight) && productWeight > 0
        ? productWeight
        : !isNaN(itemWeight) && itemWeight > 0
        ? itemWeight
        : DEFAULT_WEIGHT_GRAM

    return acc + parsedWeight * (item.quantity || 1)
  }, 0)
}
