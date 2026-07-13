import { NextResponse } from 'next/server'
import { productService } from '@/modules/products/product.service'
import { safeLogError } from '@/lib/logger'
import { ApiErrorCode } from '@/lib/api-errors'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '20', 10)
  const rawSortBy = searchParams.get('sortBy') || 'newest'
  const validSortBy = ['newest', 'featured', 'price-low', 'price-high', 'popular']
  const sortBy = (validSortBy.includes(rawSortBy) ? rawSortBy : 'newest') as
    'newest' | 'featured' | 'price-low' | 'price-high' | 'popular'
  const searchQuery = searchParams.get('q') || undefined
  const categorySlug = searchParams.get('category') || undefined
  const collectionSlug = searchParams.get('collection') || undefined

  try {
    const result = await productService.getProducts({
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    safeLogError('Products API error:', err)
    return NextResponse.json(
      {
        success: false,
        error: { code: ApiErrorCode.INTERNAL_ERROR, message: 'Internal Server Error' },
      },
      { status: 500 }
    )
  }
}
