import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'
import { ApiErrorCode } from '@/lib/api-errors'

export interface StockUpdate {
  sku: string
  stock: number
}

export async function checkAndDispatchStockNotifications(
  supabase: SupabaseClient<Database>,
  variantId: string,
  newStock: number
) {
  if (newStock <= 0) return

  try {
    const { data: pending } = await supabase
      .from('stock_notifications')
      .select('id, user_id, product_variants(name, products(name, slug))')
      .eq('variant_id', variantId)
      .eq('is_notified', false)

    if (!pending || pending.length === 0) return

    for (const item of pending) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const variantName = (item.product_variants as any)?.name || 'Varian'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const productName = (item.product_variants as any)?.products?.name || 'Produk'
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const productSlug = (item.product_variants as any)?.products?.slug || ''

      await supabase.from('notifications').insert({
        user_id: item.user_id,
        type: 'stock_restock',
        title: 'Produk Tersedia Kembali!',
        message: `${productName} (${variantName}) kini sudah restock dan tersedia kembali.`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { variant_id: variantId, product_slug: productSlug } as any,
      })

      await supabase
        .from('stock_notifications')
        .update({ is_notified: true, notified_at: new Date().toISOString() })
        .eq('id', item.id)
    }
  } catch (err) {
    console.error('Error dispatching stock notifications:', err)
  }
}

export async function bulkUpdateStock(supabase: SupabaseClient<Database>, updates: StockUpdate[]) {
  const { error } = await supabase.rpc('bulk_update_stock', {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updates: updates as any,
  })

  if (error) {
    console.error('Failed to bulk update stock via RPC:', error)
    return {
      success: false as const,
      error: { code: ApiErrorCode.INTERNAL_ERROR, message: 'Gagal mengupdate stok ke database.' },
      status: 500,
    }
  }

  // Trigger restock notification checks for updated variants
  for (const update of updates) {
    if (update.stock > 0) {
      const { data: variant } = await supabase
        .from('product_variants')
        .select('id')
        .eq('sku', update.sku)
        .maybeSingle()

      if (variant) {
        await checkAndDispatchStockNotifications(supabase, variant.id, update.stock)
      }
    }
  }

  return {
    success: true as const,
    data: { message: `Successfully updated ${updates.length} items` },
    status: 200,
  }
}
