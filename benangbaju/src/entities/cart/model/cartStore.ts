import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createBrowserClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/entities/user/model/authStore'

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
  needsResync: boolean
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
  return 'sess_' + crypto.randomUUID()
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      sessionId: generateSessionId(),
      isCartDrawerOpen: false,
      isSyncing: false,
      hasSynced: false,
      needsResync: false,
      setCartDrawerOpen: (open) => set({ isCartDrawerOpen: open }),

      addItem: async (newItem, qty = 1) => {
        set((state) => {
          const existingItem = state.items.find((item) => item.variantId === newItem.variantId)
          let updatedItems: CartItem[]
          if (existingItem) {
            const newQty = Math.min(existingItem.quantity + qty, newItem.stock)
            updatedItems = state.items.map((item) =>
              item.variantId === newItem.variantId ? { ...item, quantity: newQty } : item
            )
          } else {
            updatedItems = [...state.items, { ...newItem, quantity: Math.min(qty, newItem.stock) }]
          }
          return { items: updatedItems, needsResync: state.isSyncing }
        })

        // DB Sync if authenticated
        const user = useAuthStore.getState().user
        if (user) {
          debouncedSyncCart(user.id)
        }
      },

      updateQuantity: async (variantId, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.variantId === variantId
              ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stock)) }
              : item
          ),
          needsResync: state.isSyncing,
        }))

        // DB Sync if authenticated
        const user = useAuthStore.getState().user
        if (user) {
          debouncedSyncCart(user.id)
        }
      },

      removeItem: async (variantId) => {
        set((state) => ({
          items: state.items.filter((item) => item.variantId !== variantId),
          needsResync: state.isSyncing,
        }))

        // DB Sync if authenticated
        const user = useAuthStore.getState().user
        if (user) {
          debouncedSyncCart(user.id)
        }
      },

      clearCart: async () => {
        set((state) => ({
          items: [],
          needsResync: state.isSyncing,
        }))

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
        set({ items: [], isSyncing: false, hasSynced: false, needsResync: false })
      },

      syncCart: async (userId, merge = false) => {
        if (!userId) {
          set({ isSyncing: false, hasSynced: false, needsResync: false })
          return
        }

        if (get().isSyncing) return

        set({ isSyncing: true, needsResync: false })
        const supabase = createBrowserClient()
        let keepSyncing = true

        try {
          while (keepSyncing) {
            set({ needsResync: false })
            const localItems = get().items

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

            if (merge) {
              // MERGE = TRUE (e.g. Login sync)
              // Needs to read DB to merge quantities, then write, then read back full product details
              const { data: dbItems, error: fetchError } = await supabase
                .from('cart_items')
                .select('id, variant_id, quantity')
                .eq('cart_id', cartId)

              if (fetchError) throw fetchError

              const dbItemsMap = new Map<string, number>()
              if (dbItems) {
                dbItems.forEach((item) => dbItemsMap.set(item.variant_id, item.quantity))
              }

              if (localItems.length > 0) {
                const upsertData = localItems.map((localItem) => {
                  const dbQty = dbItemsMap.get(localItem.variantId)
                  const combinedQty = dbQty
                    ? Math.min(Math.max(dbQty, localItem.quantity), localItem.stock || 9999)
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

              // Read back the final merged cart from database to synchronize Zustand state
              const { data: finalDbItems } = await supabase
                .from('cart_items')
                .select(
                  `
                  id, variant_id, quantity,
                  product_variants (
                    id, sku, name, price, compare_price, stock,
                    products (name, slug, product_images (url, is_primary))
                  )
                `
                )
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
                  const primaryImg =
                    imagesList.find((img) => img.is_primary)?.url || imagesList[0]?.url || null

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
            } else {
              // MERGE = FALSE (Standard debounced update from Cart Drawer)
              // FAST PATH: Fire-and-forget UPSERT, no heavy SELECT needed

              // 1. Upsert all local items with exact local quantity
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

              // 2. Delete DB items that are no longer in local items
              const localVariantIds = localItems.map((item) => item.variantId)
              let deleteQuery = supabase.from('cart_items').delete().eq('cart_id', cartId)

              if (localVariantIds.length > 0) {
                deleteQuery = deleteQuery.not('variant_id', 'in', `(${localVariantIds.join(',')})`)
              }

              const { error: deleteError } = await deleteQuery
              if (deleteError) throw deleteError

              // We are done! Local state is already accurate.
              set({ hasSynced: true })
            }

            if (!get().needsResync) {
              keepSyncing = false
            }
          }
        } catch (error) {
          console.error('Error syncing cart with Supabase:', error)
        } finally {
          set({ isSyncing: false, needsResync: false })
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
