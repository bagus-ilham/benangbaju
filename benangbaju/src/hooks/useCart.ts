import { useCartStore } from '@/stores/cartStore'

export function useCart() {
  const { items, sessionId, addItem, updateQuantity, removeItem, clearCart } = useCartStore()

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
  
  const originalSubtotal = items.reduce((sum, item) => {
    const basePrice = item.comparePrice || item.price
    return sum + basePrice * item.quantity
  }, 0)

  const totalDiscount = originalSubtotal - subtotal

  return {
    items,
    sessionId,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    totalQuantity,
    originalSubtotal,
    totalDiscount,
  }
}
