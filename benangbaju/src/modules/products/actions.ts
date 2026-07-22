'use server'

import { requireAdmin } from '@/lib/auth-guard'
import { adminProductService } from './admin-product.service'
import { productService } from './product.service'
import { ProductFilters, ProductPayload } from './types'

export async function updateProductActiveStatusAction(productId: string, isActive: boolean) {
  await requireAdmin()
  const res = await adminProductService.updateActiveStatus(productId, isActive)
  if (!res.success) throw new Error(res.error?.message)
}

export async function updateProductFeaturedStatusAction(productId: string, isFeatured: boolean) {
  await requireAdmin()
  const res = await adminProductService.updateFeaturedStatus(productId, isFeatured)
  if (!res.success) throw new Error(res.error?.message)
}

export async function getProductsAction(filters: ProductFilters = {}) {
  return productService.getProducts(filters)
}

export async function getProductBySlugAction(slug: string) {
  return productService.getProductBySlug(slug)
}

export async function getRelatedProductsAction(productId: string, categoryId: string, limit = 4) {
  return productService.getRelatedProducts(productId, categoryId, limit)
}

export async function adminGetProductsAction(
  params: { page?: number; limit?: number; search?: string } = {}
) {
  await requireAdmin()
  return adminProductService.getProducts(params)
}

export async function adminCreateProductAction(
  productData: ProductPayload['productData'],
  variants: ProductPayload['variants'],
  images: ProductPayload['images'],
  marketplaceLinks: ProductPayload['links'],
  collectionIds: string[] = []
) {
  await requireAdmin()
  const res = await adminProductService.createProduct(
    productData,
    variants,
    images,
    marketplaceLinks,
    collectionIds
  )
  if (!res.success) throw new Error(res.error?.message)
  return res.data!
}

export async function adminUpdateProductAction(
  productId: string,
  productData: ProductPayload['productData'],
  variants: ProductPayload['variants'],
  images: ProductPayload['images'],
  marketplaceLinks: ProductPayload['links'],
  collectionIds: string[] = []
) {
  await requireAdmin()
  const res = await adminProductService.updateProduct(
    productId,
    productData,
    variants,
    images,
    marketplaceLinks,
    collectionIds
  )
  if (!res.success) throw new Error(res.error?.message)
  return res.data!
}

export async function adminDeleteProductAction(productId: string) {
  await requireAdmin()
  const res = await adminProductService.deleteProduct(productId)
  if (!res.success) throw new Error(res.error?.message)
  return res.data
}

export async function logSearchAction(query: string, resultsCount: number) {
  try {
    const { createServerClient } = await import('@/lib/supabase/server')
    const { safeLogError } = await import('@/lib/logger')
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const trimmed = query.trim()
    if (!trimmed) return

    await supabase.from('search_logs').insert({
      query: trimmed,
      results_count: resultsCount,
      user_id: user?.id || null,
    })
  } catch (error) {
    // Non-blocking search logging error
    console.error('Error logging search:', error)
  }
}

export async function toggleStockNotificationAction(variantId: string) {
  const { requireAuth } = await import('@/lib/auth-guard')
  const { user, supabase } = await requireAuth()

  const { data: existing } = await supabase
    .from('stock_notifications')
    .select('id')
    .eq('user_id', user.id)
    .eq('variant_id', variantId)
    .maybeSingle()

  if (existing) {
    await supabase.from('stock_notifications').delete().eq('id', existing.id)
    return { success: true, isSubscribed: false }
  } else {
    await supabase.from('stock_notifications').insert({
      user_id: user.id,
      variant_id: variantId,
    })
    return { success: true, isSubscribed: true }
  }
}

