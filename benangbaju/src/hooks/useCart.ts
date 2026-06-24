import { useMemo } from 'react'
import { useCartStore } from '@/stores/cartStore'

export function useCart() : { items: import("@/stores/cartStore").CartItem[]; sessionId: string; addItem: (item: Omit<import("@/stores/cartStore").CartItem, "quantity">, qty?: number) => Promise<void>; updateQuantity: (variantId: string, quantity: number) => Promise<void>; removeItem: (variantId: string) => Promise<void>; clearCart: () => Promise<void>; subtotal: number; totalQuantity: number; originalSubtotal: number; totalDiscount: number; isCartDrawerOpen: boolean; setCartDrawerOpen: (open: boolean) => void; } {
  const { items, sessionId, addItem, updateQuantity, removeItem, clearCart, isCartDrawerOpen, setCartDrawerOpen } = useCartStore()

  const { subtotal, totalQuantity, originalSubtotal, totalDiscount } = useMemo(() => {
    let sub = 0
    let qty = 0
    let origSub = 0
    for (const item of items) {
      sub += item.price * item.quantity
      qty += item.quantity
      const basePrice = item.comparePrice || item.price
      origSub += basePrice * item.quantity
    }
    return {
      subtotal: sub,
      totalQuantity: qty,
      originalSubtotal: origSub,
      totalDiscount: origSub - sub
    }
  }, [items])

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
