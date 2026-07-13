import { LocalCartItem } from './cart.types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapDbCartItemToLocal(item: any): LocalCartItem {
  const pv = item.product_variants
  let prod = null
  let imagesList: Array<{ url: string; is_primary: boolean }> = []

  if (pv && !Array.isArray(pv)) {
    prod = pv.products
    if (prod && !Array.isArray(prod)) {
      imagesList = Array.isArray(prod.product_images) ? prod.product_images : []
    }
  }

  const primaryImg =
    imagesList.find((img) => img.is_primary) || (imagesList.length > 0 ? imagesList[0] : null)

  const pvStock = pv && !Array.isArray(pv) && typeof pv.stock === 'number' ? pv.stock : 0
  const pvSku = pv && !Array.isArray(pv) && typeof pv.sku === 'string' ? pv.sku : ''
  const pvPrice = pv && !Array.isArray(pv) && typeof pv.price === 'number' ? pv.price : 0
  const pvComparePrice =
    pv && !Array.isArray(pv) && typeof pv.compare_price === 'number' ? pv.compare_price : null
  const pvName = pv && !Array.isArray(pv) && typeof pv.name === 'string' ? pv.name : ''

  const prodName = prod && typeof prod.name === 'string' ? prod.name : ''
  const prodSlug = prod && typeof prod.slug === 'string' ? prod.slug : ''

  return {
    id: item.id,
    variantId: item.variant_id,
    productName: prodName,
    variantName: pvName,
    name: `${prodName} - ${pvName}`, // Keep for backward compatibility
    sku: pvSku,
    price: pvPrice,
    comparePrice: pvComparePrice,
    quantity: Math.min(item.quantity, pvStock), // Cap to max stock available
    imageUrl: primaryImg ? primaryImg.url : null,
    slug: prodSlug,
    stock: pvStock,
  }
}
