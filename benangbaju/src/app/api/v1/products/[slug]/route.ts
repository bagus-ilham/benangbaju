import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getProductBySlug } from '@/modules/product/infrastructure/product.repository'
import { ApiErrorCode } from '@/lib/api-errors'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  try {
    const supabase = await createServerClient()
    const result = await getProductBySlug(supabase, slug)

    if (!result.success) {
      if (result.error?.code === ApiErrorCode.NOT_FOUND) {
        return NextResponse.json(result, { status: 404 })
      }
      return NextResponse.json(result, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('Product Detail API error:', err)
    return NextResponse.json(
      { success: false, error: { code: ApiErrorCode.INTERNAL_ERROR, message: 'Internal Server Error' } },
      { status: 500 }
    )
  }
}
