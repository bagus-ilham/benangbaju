import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getProducts } from '@/modules/products/services'
import { ApiErrorCode } from '@/lib/api-errors'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '20', 10)
  const sortBy = (searchParams.get('sortBy') as any) || 'newest'
  const searchQuery = searchParams.get('q') || undefined
  const categorySlug = searchParams.get('category') || undefined
  const collectionSlug = searchParams.get('collection') || undefined

  try {
    const supabase = await createServerClient()
    const result = await getProducts(supabase, {
      page,
      limit,
      sortBy,
      searchQuery,
      categorySlug,
      collectionSlug,
    })

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ApiErrorCode.INTERNAL_ERROR, message: 'Gagal mengambil data produk' },
        },
        { status: 500 }
      )
    }

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('Products API error:', err)
    return NextResponse.json(
      {
        success: false,
        error: { code: ApiErrorCode.INTERNAL_ERROR, message: 'Internal Server Error' },
      },
      { status: 500 }
    )
  }
}
