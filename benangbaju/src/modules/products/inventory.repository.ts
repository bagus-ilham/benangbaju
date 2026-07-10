import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'
import { ApiErrorCode } from '@/lib/api-errors'

export interface StockUpdate {
  sku: string
  stock: number
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

  return {
    success: true as const,
    data: { message: `Successfully updated ${updates.length} items` },
    status: 200,
  }
}
