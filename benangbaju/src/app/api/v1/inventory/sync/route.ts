import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { ApiErrorCode } from '@/lib/api-errors'

// This endpoint receives bulk stock updates from the ERP system.
// It is protected by an API Key check in middleware.ts.
export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    
    const body = await req.json()
    const { updates } = body

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: ApiErrorCode.VALIDATION_ERROR, message: 'Invalid payload: updates array is required' } },
        { status: 400 }
      )
    }

    // Validate update structure: { sku: string, stock: number }
    for (const update of updates) {
      if (!update.sku || typeof update.stock !== 'number') {
        return NextResponse.json(
          { success: false, error: { code: ApiErrorCode.VALIDATION_ERROR, message: 'Invalid payload: each update must have sku (string) and stock (number)' } },
          { status: 400 }
        )
      }
    }

    // Process updates using the optimized bulk_update_stock RPC
    const { error } = await supabase.rpc('bulk_update_stock', {
      updates: updates
    })

    if (error) {
      console.error('Failed to bulk update stock via RPC:', error)
      return NextResponse.json(
        { success: false, error: { code: ApiErrorCode.INTERNAL_ERROR, message: 'Gagal mengupdate stok ke database.' } },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: { message: `Successfully updated ${updates.length} items` } }, { status: 200 })
  } catch (err: any) {
    console.error('Inventory Sync API error:', err)
    return NextResponse.json(
      { success: false, error: { code: ApiErrorCode.INTERNAL_ERROR, message: 'Internal Server Error' } },
      { status: 500 }
    )
  }
}
