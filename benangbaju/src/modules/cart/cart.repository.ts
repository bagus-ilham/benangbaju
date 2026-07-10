import { createServerClient } from '@/lib/supabase/server'

export interface CartItemDbData {
  variant_id: string
  quantity: number
}

export class CartRepository {
  async getOrCreateCartId(userId: string): Promise<string> {
    const supabase = await createServerClient()
    
    // Get existing
    const { data: cart } = await supabase
      .from('carts')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (cart) return cart.id

    // Create new
    const { data: newCart, error } = await supabase
      .from('carts')
      .insert({ user_id: userId })
      .select('id')
      .single()

    if (error) {
      // Possible race condition
      const { data: retryCart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()
        
      if (retryCart) return retryCart.id
      throw error
    }

    return newCart.id
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
    const upsertData = items.map((item) => ({
      cart_id: cartId,
      variant_id: item.variant_id,
      quantity: item.quantity,
    }))

    const { error } = await supabase
      .from('cart_items')
      .upsert(upsertData, { onConflict: 'cart_id,variant_id' })

    if (error) throw error
  }

  async replaceItems(cartId: string, items: CartItemDbData[]) {
    const supabase = await createServerClient()
    
    // Delete all
    const { error: delError } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId)

    if (delError) throw delError

    // Insert new
    if (items.length > 0) {
      const insertData = items.map((item) => ({
        cart_id: cartId,
        variant_id: item.variant_id,
        quantity: item.quantity,
      }))
      const { error: insError } = await supabase
        .from('cart_items')
        .insert(insertData)

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
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id)

      if (error) throw error
    }
  }
}

export const cartRepository = new CartRepository()
