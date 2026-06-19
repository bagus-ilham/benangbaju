import { useWishlistStore } from '@/stores/wishlistStore'

export function useWishlist() : { productIds: string[]; toggleWishlist: (productId: string) => Promise<void>; clearWishlist: () => void; isLiked: (productId: string) => boolean; } {
  const { productIds, toggleWishlist, clearWishlist } = useWishlistStore()

  const isLiked = (productId: string) => productIds.includes(productId)

  return {
    productIds,
    toggleWishlist,
    clearWishlist,
    isLiked,
  }
}
