import { create } from 'zustand'
import { createBrowserClient } from '@/lib/supabase/client'

interface WishlistState {
  productIds: string[]
  setProductIds: (productIds: string[]) => void
  toggleWishlist: (productId: string, variantId?: string | null) => Promise<void>
  clearWishlist: () => void
  syncWishlist: (userId: string | null) => Promise<void>
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  productIds: [],

  setProductIds: (productIds) => set({ productIds }),

  toggleWishlist: async (productId, variantId) => {
    const { productIds } = get()
    const previousProductIds = [...productIds]
    const exists = productIds.includes(productId)
    const updatedIds = exists
      ? productIds.filter((id) => id !== productId)
      : [...productIds, productId]

    // Optimistic UI update immediately
    set({ productIds: updatedIds })

    const supabase = createBrowserClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // DB sync if authenticated
    if (user) {
      try {
        if (exists) {
          const { error } = await supabase
            .from('wishlist_items')
            .delete()
            .eq('user_id', user.id)
            .eq('product_id', productId)
          if (error) throw error
        } else {
          const { error } = await supabase.from('wishlist_items').insert({
            user_id: user.id,
            product_id: productId,
            variant_id: variantId || null,
          })
          if (error) throw error
        }
      } catch (error) {
        console.error('Error toggling DB wishlist item:', error)
        // Rollback optimistic state
        set({ productIds: previousProductIds })
      }
    }
  },

  clearWishlist: () => set({ productIds: [] }),

  syncWishlist: async (userId) => {
    if (!userId) {
      set({ productIds: [] })
      return
    }

    const supabase = createBrowserClient()
    try {
      const { data, error } = await supabase
        .from('wishlist_items')
        .select('product_id')
        .eq('user_id', userId)

      if (error) throw error

      if (data) {
        set({ productIds: data.map((item) => item.product_id) })
      }
    } catch (error) {
      console.error('Error syncing wishlist with database:', error)
    }
  },
}))
