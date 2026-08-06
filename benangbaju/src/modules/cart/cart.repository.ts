import { createServerClient } from '@/lib/supabase/server'

export interface CartItemDbData {
  variant_id: string
  quantity: number
}

export class CartRepository {
  async getOrCreateCartId(userId: string): Promise<string> {
    const supabase = await createServerClient()

    // 1. Try to find existing cart first
    const { data: existingCart } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existingCart?.id) {
      return existingCart.id
    }

    // 2. Try atomic UPSERT
    const { data: cart, error } = await supabase
      .from('carts')
      .upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: false })
      .select('id')
      .single()

    if (!error && cart?.id) {
      return cart.id
    }

    // 3. Fallback to INSERT if ON CONFLICT failed (e.g. Postgres 42P10 missing unique constraint on user_id)
    const { data: insertedCart, error: insertError } = await supabase
      .from('carts')
      .insert({ user_id: userId })
      .select('id')
      .single()

    if (!insertError && insertedCart?.id) {
      return insertedCart.id
    }

    // 4. Final check if inserted by race condition
    const { data: reFetched } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (reFetched?.id) {
      return reFetched.id
    }

    throw error || insertError
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
      // Fallback: Backup existing items before delete
      const { data: oldItems } = await supabase
        .from('cart_items')
        .select('variant_id, quantity')
        .eq('cart_id', cartId)

      const { error: delError } = await supabase.from('cart_items').delete().eq('cart_id', cartId)
      if (delError) throw delError

      const insertData = items.map((i) => ({
        cart_id: cartId,
        variant_id: i.variant_id,
        quantity: i.quantity,
      }))
      const { error: insError } = await supabase.from('cart_items').insert(insertData)
      if (insError) {
        // Rollback restore old items if possible
        if (oldItems && oldItems.length > 0) {
          const restoreData = oldItems.map((i) => ({
            cart_id: cartId,
            variant_id: i.variant_id,
            quantity: i.quantity,
          }))
          await supabase.from('cart_items').insert(restoreData)
        }
        throw insError
      }
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
