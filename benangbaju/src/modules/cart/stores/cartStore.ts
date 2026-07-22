import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuthStore } from '@/modules/users/stores/authStore'
import { syncCartAction, clearCartAction } from '../actions'

export interface CartItem {
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

interface CartState {
  items: CartItem[]
  sessionId: string
  isCartDrawerOpen: boolean
  isSyncing: boolean
  hasSynced: boolean
  needsResync: boolean
  syncTimeoutId: ReturnType<typeof setTimeout> | null
  debouncedSyncCart: (userId: string) => void
  setCartDrawerOpen: (open: boolean) => void
  addItem: (item: Omit<CartItem, 'quantity'>, qty?: number) => Promise<void>
  updateQuantity: (variantId: string, quantity: number) => Promise<void>
  removeItem: (variantId: string) => Promise<void>
  clearCart: () => Promise<void>
  syncCart: (userId: string | null, merge?: boolean) => Promise<void>
  resetCart: () => void
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
      syncTimeoutId: null,

      debouncedSyncCart: (userId: string) => {
        const { syncTimeoutId } = get()
        if (syncTimeoutId) clearTimeout(syncTimeoutId)
        const newTimeout = setTimeout(async () => {
          await get().syncCart(userId, false)
        }, 1000)
        set({ syncTimeoutId: newTimeout })
      },
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
          get().debouncedSyncCart(user.id)
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
          get().debouncedSyncCart(user.id)
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
          get().debouncedSyncCart(user.id)
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
          try {
            await clearCartAction()
          } catch (error) {
            console.error('Failed to clear cart:', error)
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

        if (get().isSyncing) {
          set({ needsResync: true })
          while (get().isSyncing) {
            await new Promise((resolve) => setTimeout(resolve, 50))
          }
          return
        }

        set({ isSyncing: true, needsResync: false })
        let keepSyncing = true

        try {
          while (keepSyncing) {
            set({ needsResync: false })
            const localItems = get().items

            const res = await syncCartAction(localItems, merge)

            if (res.success && res.data) {
              set({ items: res.data })
            }

            if (get().needsResync) {
              keepSyncing = true
            } else {
              set({ hasSynced: true })
              keepSyncing = false
            }
          }
        } catch (error) {
          console.error('Error syncing cart:', error)
          // Don't mark as hasSynced if there's an error,
          // so it can retry later
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
