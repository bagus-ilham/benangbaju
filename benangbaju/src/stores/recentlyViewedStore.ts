import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface RecentlyViewedProduct {
  id: string
  name: string
  slug: string
  price: number
  imageUrl: string | null
}

export interface RecentlyViewedState {
  products: RecentlyViewedProduct[]
  addProduct: (product: RecentlyViewedProduct) => void
  clearRecentlyViewed: () => void
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      products: [],
      
      addProduct: (newProduct) => {
        const { products } = get()
        // Filter out existing occurrence of this product
        const filtered = products.filter((p) => p.id !== newProduct.id)
        // Add new product to the front, slice to max 10
        const updated = [newProduct, ...filtered].slice(0, 10)
        set({ products: updated })
      },
      
      clearRecentlyViewed: () => set({ products: [] }),
    }),
    {
      name: 'benangbaju-recently-viewed',
    }
  )
)
