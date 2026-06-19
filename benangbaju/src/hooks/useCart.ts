import { useCartStore } from '@/stores/cartStore'

export function useCart() : { items: import("D:/Aulia Project/benangbaju/src/stores/cartStore").CartItem[]; sessionId: string; addItem: (item: Omit<import("D:/Aulia Project/benangbaju/src/stores/cartStore").CartItem, "quantity">, qty?: number) => Promise<void>; updateQuantity: (variantId: string, quantity: number) => Promise<void>; removeItem: (variantId: string) => Promise<void>; clearCart: () => Promise<void>; subtotal: number; totalQuantity: number; originalSubtotal: number; totalDiscount: number; isCartDrawerOpen: boolean; setCartDrawerOpen: (open: boolean) => void; } {
  const { items, sessionId, addItem, updateQuantity, removeItem, clearCart, isCartDrawerOpen, setCartDrawerOpen } = useCartStore()

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
    isCartDrawerOpen,
    setCartDrawerOpen,
  }
}
