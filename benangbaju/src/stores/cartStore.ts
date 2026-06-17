import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createBrowserClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/authStore'

export interface CartItem {
  id?: string // cart_items row id (if synced)
  variantId: string
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
  addItem: (item: Omit<CartItem, 'quantity'>, qty?: number) => Promise<void>
  updateQuantity: (variantId: string, quantity: number) => Promise<void>
  removeItem: (variantId: string) => Promise<void>
  clearCart: () => Promise<void>
  syncCart: (userId: string | null, merge?: boolean) => Promise<void>
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

      syncCart: async (userId, merge = false) => {
        if (!userId) return

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
            
            if (createError) throw createError
            cart = newCart
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

          const dbItemsMap = new Map<string, any>()
          dbItems?.forEach((item) => dbItemsMap.set(item.variant_id, item))

          if (merge) {
            // Merge Local Items -> DB (combining quantities)
            for (const localItem of localItems) {
              const dbItem = dbItemsMap.get(localItem.variantId)
              const combinedQty = dbItem 
                ? Math.min(dbItem.quantity + localItem.quantity, localItem.stock)
                : localItem.quantity

              const { error: upsertError } = await supabase
                .from('cart_items')
                .upsert(
                  {
                    cart_id: cartId,
                    variant_id: localItem.variantId,
                    quantity: combinedQty,
                  },
                  { onConflict: 'cart_id,variant_id' }
                )

              if (upsertError) throw upsertError
            }
          } else {
            // Overwrite DB with Local Items
            // Upsert all local items with exact local quantity
            for (const localItem of localItems) {
              const { error: upsertError } = await supabase
                .from('cart_items')
                .upsert(
                  {
                    cart_id: cartId,
                    variant_id: localItem.variantId,
                    quantity: localItem.quantity,
                  },
                  { onConflict: 'cart_id,variant_id' }
                )

              if (upsertError) throw upsertError
            }

            // Delete DB items that are no longer in local items
            const localVariantIds = new Set(localItems.map(item => item.variantId))
            const dbItemsToDelete = (dbItems || []).filter(item => !localVariantIds.has(item.variant_id))
            
            if (dbItemsToDelete.length > 0) {
              const idsToDelete = dbItemsToDelete.map(item => item.id)
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
            const synchronizedItems: CartItem[] = finalDbItems.map((item: any) => {
              const pv = item.product_variants
              const prod = pv?.products
              const primaryImg = prod?.product_images?.find((img: any) => img.is_primary)?.url 
                || prod?.product_images?.[0]?.url 
                || null

              return {
                id: item.id,
                variantId: item.variant_id,
                name: pv?.name || prod?.name || 'Produk',
                sku: pv?.sku || '',
                price: Number(pv?.price || 0),
                comparePrice: pv?.compare_price ? Number(pv.compare_price) : null,
                quantity: item.quantity,
                imageUrl: primaryImg,
                slug: prod?.slug || '',
                stock: pv?.stock || 0,
              }
            })

            set({ items: synchronizedItems })
          }
        } catch (error) {
          console.error('Error syncing cart with Supabase:', error)
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
