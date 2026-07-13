'use server'

import { requireAuth } from '@/lib/auth-guard'
import { cartService } from './cart.service'
import type { LocalCartItem } from './cart.types'

export async function syncCartAction(localItems: LocalCartItem[], merge = false) {
  const { user } = await requireAuth()
  return cartService.syncCart(user.id, localItems, merge)
}

export async function clearCartAction() {
  const { user } = await requireAuth()
  return cartService.clearCart(user.id)
}
