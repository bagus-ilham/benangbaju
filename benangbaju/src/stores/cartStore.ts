import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createBrowserClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'

export interface CartItem {
  id?: string
  variantId: string
  productName: string
  variantName: string
  /** @deprecated Use productName instead */
  name: string
  sku: string
  price: number
  comparePrice: number | null
  quantity: number
  imageUrl: string | null
  slug: string
  stock: number
}

interface CartState {
  items: CartItem[]
  sessionId: string
  isCartDrawerOpen: boolean
  isSyncing: boolean
  hasSynced: boolean
  setCartDrawerOpen: (open: boolean) => void
  addItem: (item: Omit<CartItem, 'quantity'>, qty?: number) => Promise<void>
  updateQuantity: (variantId: string, quantity: number) => Promise<void>
  removeItem: (variantId: string) => Promise<void>
  clearCart: () => Promise<void>
  syncCart: (userId: string | null, merge?: boolean) => Promise<void>
  resetCart: () => void
}

let syncTimeout: ReturnType<typeof setTimeout> | null = null

const debouncedSyncCart = (userId: string) => {
  if (syncTimeout) clearTimeout(syncTimeout)
  syncTimeout = setTimeout(async () => {
    await useCartStore.getState().syncCart(userId, false)
  }, 1000)
}

// Helper to generate a random session ID for guests
const generateSessionId = () => {
  return 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      sessionId: generateSessionId(),
      isCartDrawerOpen: false,
      isSyncing: false,
      hasSynced: false,
      setCartDrawerOpen: (open) => set({ isCartDrawerOpen: open }),
      
      addItem: async (newItem, qty = 1) => {
        const { items } = get()
        const existingItem = items.find((item) => item.variantId === newItem.variantId)
        
        let updatedItems: CartItem[]
        if (existingItem) {
          const newQty = Math.min(existingItem.quantity + qty, newItem.stock)
          updatedItems = items.map((item) =>
            item.variantId === newItem.variantId
              ? { ...item, quantity: newQty }
              : item
          )
        } else {
          updatedItems = [...items, { ...newItem, quantity: Math.min(qty, newItem.stock) }]
        }
        
        set({ items: updatedItems })

        // DB Sync if authenticated
        const user = useAuthStore.getState().user
        if (user) {
          debouncedSyncCart(user.id)
        }
      },

      updateQuantity: async (variantId, quantity) => {
        const { items } = get()
        const item = items.find((i) => i.variantId === variantId)
        if (!item) return

        const targetQty = Math.max(1, Math.min(quantity, item.stock))
        const updatedItems = items.map((i) =>
          i.variantId === variantId ? { ...i, quantity: targetQty } : i
        )

        set({ items: updatedItems })

        // DB Sync if authenticated
        const user = useAuthStore.getState().user
        if (user) {
          debouncedSyncCart(user.id)
        }
      },

      removeItem: async (variantId) => {
        const { items } = get()
        const updatedItems = items.filter((i) => i.variantId !== variantId)
        set({ items: updatedItems })

        // DB Sync if authenticated
        const user = useAuthStore.getState().user
        if (user) {
          debouncedSyncCart(user.id)
        }
      },

      clearCart: async () => {
        set({ items: [] })

        // DB Sync if authenticated
        const user = useAuthStore.getState().user
        if (user) {
          const supabase = createBrowserClient()
          // Find user's cart and delete items
          const { data: cart } = await supabase
            .from('carts')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle()
          
          if (cart) {
            await supabase.from('cart_items').delete().eq('cart_id', cart.id)
          }
        }
      },

      resetCart: () => {
        set({ items: [], isSyncing: false, hasSynced: false })
      },

      syncCart: async (userId, merge = false) => {
        if (!userId) {
          set({ isSyncing: false, hasSynced: false })
          return
        }

        if (get().isSyncing) return

        set({ isSyncing: true })
        const supabase = createBrowserClient()
        const localItems = get().items

        try {
          // 1. Get or create user cart in DB
          let { data: cart } = await supabase
            .from('carts')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle()

          if (!cart) {
            const { data: newCart, error: createError } = await supabase
              .from('carts')
              .insert({ user_id: userId })
              .select('id')
              .single()
            
            if (createError) {
              const { data: retryCart } = await supabase
                .from('carts')
                .select('id')
                .eq('user_id', userId)
                .maybeSingle()
              
              if (!retryCart) throw createError
              cart = retryCart
            } else {
              cart = newCart
            }
          }

          const cartId = cart.id

          // 2. Fetch existing DB items
          const { data: dbItems, error: fetchError } = await supabase
            .from('cart_items')
            .select(`
              id, variant_id, quantity,
              product_variants (
                id, sku, name, price, compare_price, stock,
                products (name, slug, product_images (url, is_primary))
              )
            `)
            .eq('cart_id', cartId)

          if (fetchError) throw fetchError

          const dbItemsMap = new Map<string, NonNullable<typeof dbItems>[number]>()
          if (dbItems) {
            dbItems.forEach((item) => dbItemsMap.set(item.variant_id, item))
          }

          if (merge) {
            // Merge Local Items -> DB (taking maximum of both to prevent self-incrementing/accumulation)
            // ⚡ Bolt: Bulk upsert for performance improvement
            if (localItems.length > 0) {
              const upsertData = localItems.map((localItem) => {
                const dbItem = dbItemsMap.get(localItem.variantId)
                const combinedQty = dbItem
                  ? Math.min(Math.max(dbItem.quantity, localItem.quantity), localItem.stock || 9999)
                  : localItem.quantity

                return {
                  cart_id: cartId,
                  variant_id: localItem.variantId,
                  quantity: combinedQty,
                }
              })

              const { error: upsertError } = await supabase
                .from('cart_items')
                .upsert(upsertData, { onConflict: 'cart_id,variant_id' })

              if (upsertError) throw upsertError
            }
          } else {
            // Overwrite DB with Local Items
            // Upsert all local items with exact local quantity
            // ⚡ Bolt: Bulk upsert for performance improvement
            if (localItems.length > 0) {
              const upsertData = localItems.map((localItem) => ({
                cart_id: cartId,
                variant_id: localItem.variantId,
                quantity: localItem.quantity,
              }))

              const { error: upsertError } = await supabase
                .from('cart_items')
                .upsert(upsertData, { onConflict: 'cart_id,variant_id' })

              if (upsertError) throw upsertError
            }

            // Delete DB items that are no longer in local items
            const localVariantIds = new Set(localItems.map(item => item.variantId))
            const dbItemsToDelete = (dbItems || []).filter((item) => !localVariantIds.has(item.variant_id))
            
            if (dbItemsToDelete.length > 0) {
              const idsToDelete = dbItemsToDelete.map((item) => item.id)
              const { error: deleteError } = await supabase
                .from('cart_items')
                .delete()
                .in('id', idsToDelete)
              if (deleteError) throw deleteError
            }
          }

          // 4. Read back the final merged cart from database to synchronize Zustand state
          const { data: finalDbItems } = await supabase
            .from('cart_items')
            .select(`
              id, variant_id, quantity,
              product_variants (
                id, sku, name, price, compare_price, stock,
                products (name, slug, product_images (url, is_primary))
              )
            `)
            .eq('cart_id', cartId)

          if (finalDbItems) {
            const synchronizedItems: CartItem[] = finalDbItems.map((item) => {
              const pv = item.product_variants
              let prod = null
              let imagesList: Array<{ url: string; is_primary: boolean }> = []
              if (pv && !Array.isArray(pv)) {
                prod = pv.products
                if (prod && !Array.isArray(prod)) {
                  imagesList = Array.isArray(prod.product_images) ? prod.product_images : []
                }
              }
              const primaryImg = imagesList.find((img) => img.is_primary)?.url 
                || imagesList[0]?.url 
                || null

              const prodObj = prod && !Array.isArray(prod) ? prod : null
              const pvObj = pv && !Array.isArray(pv) ? pv : null

              return {
                id: item.id,
                variantId: item.variant_id,
                productName: prodObj?.name || 'Produk',
                variantName: pvObj?.name || 'Default',
                name: prodObj?.name || pvObj?.name || 'Produk',
                sku: pvObj?.sku || '',
                price: Number(pvObj?.price || 0),
                comparePrice: pvObj?.compare_price ? Number(pvObj.compare_price) : null,
                quantity: item.quantity,
                imageUrl: primaryImg,
                slug: prodObj?.slug || '',
                stock: pvObj?.stock || 0,
              }
            })

            set({ items: synchronizedItems, hasSynced: true })
          } else {
            set({ hasSynced: true })
          }
        } catch (error) {
          console.error('Error syncing cart with Supabase:', error)
        } finally {
          set({ isSyncing: false })
        }
      },
    }),
    {
      name: 'benangbaju-cart',
      partialize: (state) => ({
        items: state.items,
        sessionId: state.sessionId,
      }),
    }
  )
)
