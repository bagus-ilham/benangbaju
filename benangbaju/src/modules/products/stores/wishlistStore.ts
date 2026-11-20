import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createBrowserClient } from '@/lib/supabase/client'

interface WishlistState {
  productIds: string[]
  setProductIds: (productIds: string[]) => void
  toggleWishlist: (productId: string, variantId?: string | null) => Promise<void>
  clearWishlist: () => void
  syncWishlist: (userId: string | null) => Promise<void>
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
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
          // Preserve locally persisted guest wishlist items when not logged in
          return
        }

        const supabase = createBrowserClient()
        try {
          const localIds = get().productIds
          const { data, error } = await supabase
            .from('wishlist_items')
            .select('product_id')
            .eq('user_id', userId)

          if (error) throw error

          const dbIds = (data || []).map((item) => item.product_id)
          const dbSet = new Set(dbIds)

          // Merge any guest wishlist items into database on login
          const missingInDb = localIds.filter((id) => !dbSet.has(id))
          if (missingInDb.length > 0) {
            await supabase
              .from('wishlist_items')
              .insert(
                missingInDb.map((productId) => ({
                  user_id: userId,
                  product_id: productId,
                  variant_id: null,
                }))
              )
              .then(({ error: mergeErr }) => {
                if (mergeErr) {
                  console.error('Error merging guest wishlist items:', mergeErr)
                }
              })
          }

          const mergedIds = Array.from(new Set([...dbIds, ...missingInDb]))
          set({ productIds: mergedIds })
        } catch (error) {
          console.error('Error syncing wishlist with database:', error)
        }
      },
    }),
    {
      name: 'benangbaju-wishlist',
      partialize: (state) => ({
        productIds: state.productIds,
      }),
    }
  )
)
