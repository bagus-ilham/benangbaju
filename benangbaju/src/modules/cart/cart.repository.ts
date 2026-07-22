import { createServerClient } from '@/lib/supabase/server'

export interface CartItemDbData {
  variant_id: string
  quantity: number
}

export class CartRepository {
  async getOrCreateCartId(userId: string): Promise<string> {
    const supabase = await createServerClient()

    // Atomic UPSERT prevents race conditions
    const { data: cart, error } = await supabase
      .from('carts')
      .upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: false })
      .select('id')
      .single()

    if (error) throw error
    return cart.id
  }

  async getCartItems(cartId: string) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
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

    if (error) throw error
    return data
  }

  async upsertItems(cartId: string, items: CartItemDbData[]) {
    if (!items.length) return
    const supabase = await createServerClient()

    // 1. Fetch existing cart items for this cart
    const { data: existingItems, error: fetchErr } = await supabase
      .from('cart_items')
      .select('id, variant_id, quantity')
      .eq('cart_id', cartId)

    if (fetchErr) throw fetchErr

    const existingMap = new Map((existingItems || []).map((i) => [i.variant_id, i]))

    const toUpdate: { id: string; quantity: number }[] = []
    const toInsert: { cart_id: string; variant_id: string; quantity: number }[] = []

    for (const item of items) {
      const existing = existingMap.get(item.variant_id)
      if (existing) {
        toUpdate.push({ id: existing.id, quantity: item.quantity })
      } else {
        toInsert.push({ cart_id: cartId, variant_id: item.variant_id, quantity: item.quantity })
      }
    }

    // 2. Perform updates for existing items
    if (toUpdate.length > 0) {
      await Promise.all(
        toUpdate.map((u) =>
          supabase.from('cart_items').update({ quantity: u.quantity }).eq('id', u.id)
        )
      )
    }

    // 3. Perform inserts for new items
    if (toInsert.length > 0) {
      const { error: insErr } = await supabase.from('cart_items').insert(toInsert)
      if (insErr) throw insErr
    }
  }

  async replaceItems(cartId: string, items: CartItemDbData[]) {
    const supabase = await createServerClient()

    if (items.length === 0) {
      // Just delete all if items array is empty
      const { error: delError } = await supabase.from('cart_items').delete().eq('cart_id', cartId)
      if (delError) throw delError
      return
    }

    // Try RPC first, fallback to delete + insert if RPC is missing or fails
    const { error: rpcError } = await supabase.rpc('replace_cart_items', {
      p_cart_id: cartId,
      p_items: items as any,
    })

    if (rpcError) {
      // Fallback: Delete existing items for this cart and insert new items
      const { error: delError } = await supabase.from('cart_items').delete().eq('cart_id', cartId)
      if (delError) throw delError

      const insertData = items.map((i) => ({
        cart_id: cartId,
        variant_id: i.variant_id,
        quantity: i.quantity,
      }))
      const { error: insError } = await supabase.from('cart_items').insert(insertData)
      if (insError) throw insError
    }
  }

  async clearCart(userId: string) {
    const supabase = await createServerClient()
    const { data: cart } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (cart) {
      const { error } = await supabase.from('cart_items').delete().eq('cart_id', cart.id)

      if (error) throw error
    }
  }
}

export const cartRepository = new CartRepository()
