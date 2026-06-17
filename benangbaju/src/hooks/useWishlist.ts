import { useWishlistStore } from '@/stores/wishlistStore'

export function useWishlist() {
  const { productIds, toggleWishlist, clearWishlist } = useWishlistStore()

  const isLiked = (productId: string) => productIds.includes(productId)

  return {
    productIds,
    toggleWishlist,
    clearWishlist,
    isLiked,
  }
}
