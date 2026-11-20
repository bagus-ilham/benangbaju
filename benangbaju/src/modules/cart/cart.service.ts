import { safeLogError } from '@/lib/logger'
import { ApiResponse, ok, fail } from '@/lib/api-response'
import { ApiErrorCode } from '@/lib/api-errors'
import { cartRepository } from './cart.repository'
import { mapDbCartItemToLocal } from './cart.mapper'

import type { LocalCartItem } from './cart.types'
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
            const maxMarketStock = Math.max(localItem.stock ?? 0, localItem.stockMy ?? 0)
            const stockCap = maxMarketStock > 0 ? maxMarketStock : 9999
            const combinedQty = dbQty
              ? Math.min(Math.max(dbQty, localItem.quantity), stockCap)
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
        synchronizedItems = finalDbItems.map((item: any) =>
          mapDbCartItemToLocal(item, item.flash_sale_price, item.flash_sale_price_myr)
        )
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
