import { safeLogError } from '@/lib/logger'
import { ApiResponse, ok, fail } from '@/lib/api-response'
import { ApiErrorCode } from '@/lib/api-errors'
import { cartRepository } from './cart.repository'

// Local CartItem type matching the store
export interface LocalCartItem {
  id?: string
  variantId: string
  productName: string
  variantName: string
  name: string
  sku: string
  price: number
  comparePrice: number | null
  quantity: number
  imageUrl: string | null
  slug: string
  stock: number
}

export class CartService {
  async syncCart(
    userId: string,
    localItems: LocalCartItem[],
    merge = false
  ): Promise<ApiResponse<LocalCartItem[]>> {
    try {
      const cartId = await cartRepository.getOrCreateCartId(userId)

      if (merge) {
        // Merge logic
        const dbItems = await cartRepository.getCartItems(cartId)
        const dbItemsMap = new Map<string, number>()
        if (dbItems) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
          dbItems.forEach((item: any) => dbItemsMap.set(item.variant_id, item.quantity))
        }

        if (localItems.length > 0) {
          const upsertData = localItems.map((localItem) => {
            const dbQty = dbItemsMap.get(localItem.variantId)
            const combinedQty = dbQty
              ? Math.min(Math.max(dbQty, localItem.quantity), localItem.stock ?? 9999)
              : localItem.quantity

            return {
              variant_id: localItem.variantId,
              quantity: combinedQty,
            }
          })
          await cartRepository.upsertItems(cartId, upsertData)
        }
      } else {
        // Replace logic
        const itemsToSave = localItems.map((i) => ({
          variant_id: i.variantId,
          quantity: i.quantity,
        }))
        await cartRepository.replaceItems(cartId, itemsToSave)
      }

      // Read back final synchronized items
      const finalDbItems = await cartRepository.getCartItems(cartId)
      
      let synchronizedItems: LocalCartItem[] = []
      if (finalDbItems) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
        synchronizedItems = finalDbItems.map((item: any) => {
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
          const pvComparePrice = pv && !Array.isArray(pv) && typeof pv.compare_price === 'number' ? pv.compare_price : null
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
        })
      }

      return ok(synchronizedItems)
    } catch (error) {
      safeLogError('Error syncing cart:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal menyinkronkan keranjang')
    }
  }

  async clearCart(userId: string): Promise<ApiResponse<null>> {
    try {
      await cartRepository.clearCart(userId)
      return ok(null)
    } catch (error) {
      safeLogError('Error clearing cart:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengosongkan keranjang')
    }
  }
}

export const cartService = new CartService()
