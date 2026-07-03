import { safeLogError } from '@/lib/logger'
import { insertAdminActivityLog } from '@/entities/adminLog/api/adminLogs'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'

import { 
  ProductFilters, ProductVariant, ProductImage,  
  ProductRatingSummary, ProductListItem, ProductDetailItem, AdminProductListItem 
} from '@/entities/product/model/product.types'
import { ProductPayload } from '@/entities/product/model/product.types'

export function mapCategory(rawCat: any): { name: string; slug: string } | null {
  if (rawCat && !Array.isArray(rawCat)) {
    return { name: rawCat.name, slug: rawCat.slug }
  }
  return null
}

export function mapVariants(rawVariants: any, includeAttrs = true): ProductVariant[] {
  const variantsList = Array.isArray(rawVariants) ? rawVariants : []
  return variantsList.map((v: any) => ({
    id: v.id,
    sku: v.sku,
    name: v.name,
    price: v.price,
    compare_price: v.compare_price,
    stock: v.stock,
    weight_gram: v.weight_gram || null,
    is_active: v.is_active,
    ...(includeAttrs && {
      product_variant_attrs: (v.product_variant_attrs || []).map((attr: any) => ({
        id: attr.id,
        attr_name: attr.attr_name,
        attr_value: attr.attr_value,
      }))
    })
  }))
}

export function mapImages(rawImages: any): ProductImage[] {
  const imagesList = Array.isArray(rawImages) ? rawImages : []
  return imagesList.map((img: any) => ({
    id: img.id,
    url: img.url,
    alt_text: img.alt_text,
    sort_order: img.sort_order,
    is_primary: img.is_primary,
    variant_id: img.variant_id,
  })).sort((a: any, b: any) => a.sort_order - b.sort_order)
}

export function mapProductListItem(p: any): ProductListItem {
  const categories = mapCategory(p.categories)
  const product_variants = mapVariants(p.product_variants)
  const product_images = mapImages(p.product_images)

  // Fast CPU paths: avoid allocating arrays in tight loops
  let minPrice = 0
  let maxPrice = 0
  let minPriceVariant = null
  let activeVariantsCount = 0

  for (let i = 0; i < product_variants.length; i++) {
    const v = product_variants[i]
    if (v.is_active) {
      activeVariantsCount++
      const price = Number(v.price)
      if (activeVariantsCount === 1) {
        minPrice = price
        maxPrice = price
        minPriceVariant = v
      } else {
        if (price < minPrice) {
          minPrice = price
          minPriceVariant = v
        }
        if (price > maxPrice) {
          maxPrice = price
        }
      }
    }
  }

  const comparePrice = minPriceVariant?.compare_price ? Number(minPriceVariant.compare_price) : null
  const discountPercent = comparePrice && comparePrice > minPrice
    ? Math.round(((comparePrice - minPrice) / comparePrice) * 100)
    : null

  let primaryImage = null
  let hoverImage = null
  let foundPrimary = false
  let foundHover = false

  for (let i = 0; i < product_images.length; i++) {
    const img = product_images[i]
    if (img.is_primary && !foundPrimary) {
      primaryImage = img.url
      foundPrimary = true
    } else if (!img.is_primary && img.sort_order > 0 && !foundHover) {
      hoverImage = img.url
      foundHover = true
    }
  }
  
  // Fallbacks
  if (!primaryImage && product_images.length > 0) primaryImage = product_images[0].url
  if (!hoverImage && product_images.length > 1) hoverImage = product_images[1].url
  if (!hoverImage) hoverImage = primaryImage

  // Check for colors and sizes without creating intermediate arrays
  let hasMultipleColors = false
  const colorSet = new Set<string>()
  const sizeVariants: any[] = []

  for (let i = 0; i < product_variants.length; i++) {
    const v = product_variants[i]
    if (!v.is_active) continue
    
    let hasSize = false
    if (v.product_variant_attrs) {
      for (let j = 0; j < v.product_variant_attrs.length; j++) {
        const attr = v.product_variant_attrs[j]
        const nameLower = attr.attr_name.toLowerCase()
        if (nameLower.includes('warna')) {
          colorSet.add(attr.attr_value)
          if (colorSet.size > 1) hasMultipleColors = true
        } else if (nameLower.includes('ukuran')) {
          hasSize = true
        }
      }
    }
    
    if (hasSize && v.stock > 0) {
      sizeVariants.push(v)
    }
  }

  return {
    id: p.id,
    category_id: p.category_id,
    name: p.name,
    slug: p.slug,
    is_featured: p.is_featured,
    created_at: p.created_at,
    categories,
    product_variants,
    product_images,
    minPrice,
    maxPrice,
    comparePrice,
    discountPercent,
    primaryImage,
    hoverImage,
    hasMultipleColors,
    sizeVariants
  }
}


export async function getProducts(
  supabase: SupabaseClient<Database>,
  filters: ProductFilters = {}
): Promise<ApiListResponse<ProductListItem>> {
  const {
    categorySlug,
    collectionSlug,
    searchQuery,
    productIds,
    minPrice,
    maxPrice,
    sortBy = 'newest',
    page = 1,
    limit = 20,
  } = filters

  const offset = (page - 1) * limit

  // 1. Build base query
  let query = supabase
    .from('products')
    .select(
      `
        id, category_id, name, slug, is_featured, created_at, min_price, max_price,
        categories (name, slug),
        product_variants (id, sku, name, price, compare_price, stock, is_active, product_variant_attrs(id, attr_name, attr_value)),
        product_images (id, url, alt_text, sort_order, is_primary)
      `,
      { count: 'exact' }
    )
    .eq('is_active', true)
    .eq('product_variants.is_active', true)

  // 1b. Fetch categories and collections in parallel if needed
  const [categoriesRes, collectionRes] = await Promise.all([
    categorySlug ? supabase.from('categories').select('id, slug, parent_id') : Promise.resolve(null),
    collectionSlug ? supabase.from('collections').select('id').eq('slug', collectionSlug).single() : Promise.resolve(null)
  ])

  // 2. Filter by Category
  if (categorySlug && categoriesRes) {
    const { data: categories } = categoriesRes
    const category = categories?.find((c) => c.slug === categorySlug)
    if (category) {
      const categoryIds = [
        category.id,
        ...(categories?.filter((c) => c.parent_id === category.id).map((c) => c.id) || []),
      ]
      query = query.in('category_id', categoryIds)
    } else {
      return paginated([], 0, page, limit)
    }
  }

  // 3. Filter by Collection
  if (collectionSlug && collectionRes) {
    const { data: collection } = collectionRes
    if (collection) {
      // Fetch junction keys
      const { data: junction } = await supabase
        .from('collection_products')
        .select('product_id')
        .eq('collection_id', collection.id)
      
      const pIds = junction?.map((j) => j.product_id) || []
      if (pIds.length > 0) {
        query = query.in('id', pIds)
      } else {
        return paginated([], 0, page, limit)
      }
    } else {
      return paginated([], 0, page, limit)
    }
  }

  // 3b. Filter by Product IDs array
  if (productIds && productIds.length > 0) {
    query = query.in('id', productIds)
  }

  // 4. Filter by Search Query
  if (searchQuery) {
    const escapedSearch = searchQuery
      .replace(/\\/g, '\\\\')
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_')
    query = query.ilike('name', `%${escapedSearch}%`)
  }

  // Apply DB-level price filtering
  if (minPrice !== undefined) {
    query = query.gte('min_price', minPrice)
  }
  if (maxPrice !== undefined) {
    query = query.lte('min_price', maxPrice)
  }

  // 5. Apply Sorting
  if (sortBy === 'newest') {
    query = query.order('created_at', { ascending: false })
  } else if (sortBy === 'featured') {
    query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false })
  } else if (sortBy === 'price-low') {
    query = query.order('min_price', { ascending: true })
  } else if (sortBy === 'price-high') {
    query = query.order('min_price', { ascending: false })
  } else if (sortBy === 'popular') {
    query = query.order('is_featured', { ascending: false })
  }

  // Always use DB pagination now
  query = query.range(offset, offset + limit - 1)

  // 6. Execute Query
  const { data, count, error } = await query

  if (error) {
    safeLogError('Error fetching products:', error)
    return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memuat produk')
  }

  if (!data) return paginated([], 0, page, limit)

  const results: ProductListItem[] = data.map(mapProductListItem)

  return paginated(results, count || 0, page, limit)
}

export async function getProductBySlug(
  supabase: SupabaseClient<Database>,
  slug: string
): Promise<ApiResponse<ProductDetailItem | null>> {
  const { data, error } = await supabase
    .from('products')
    .select(
      `
        id, category_id, name, slug, description, short_description, weight_gram, is_featured, created_at, size_guide, care_guide, meta_title, meta_description,
        categories (name, slug),
        product_variants (*, product_variant_attrs(*)),
        product_images (*),
        product_marketplace_links (*),
        product_rating_summary (*)
      `
    )
    .eq('slug', slug)
    .eq('is_active', true)
    .eq('product_variants.is_active', true)
    .single()

  if (error) {
    safeLogError(`Error fetching product details for slug ${slug}:`, error)
    return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memuat detail produk')
  }

  if (!data) return ok(null)

  const categories = mapCategory(data.categories)
  const product_variants = mapVariants(data.product_variants)
  const sortedImages = mapImages(data.product_images)

  const rawLinks = data.product_marketplace_links
  const linksList = Array.isArray(rawLinks) ? rawLinks : []
  const product_marketplace_links = linksList.map(link => ({
    id: link.id,
    platform: link.platform,
    url: link.url,
    label: link.label,
  }))

  const rawSummary = data.product_rating_summary
  const summaryList = Array.isArray(rawSummary) ? rawSummary : []
  const firstSummary = summaryList[0] || null
  const product_rating_summary = firstSummary ? {
    avg_rating: firstSummary.avg_rating,
    total_reviews: firstSummary.total_reviews,
  } : null

  return ok({
    id: data.id,
    category_id: data.category_id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    short_description: data.short_description,
    meta_title: data.meta_title,
    meta_description: data.meta_description,
    weight_gram: data.weight_gram,
    is_featured: data.is_featured,
    created_at: data.created_at,
    categories,
    product_variants,
    product_images: sortedImages,
    product_marketplace_links,
    product_rating_summary,
    size_guide: data.size_guide,
    care_guide: data.care_guide,
  })
}


export async function getRelatedProducts(
  supabase: SupabaseClient<Database>,
  productId: string,
  categoryId: string,
  limit = 4
): Promise<ApiListResponse<ProductListItem>> {
  const { data, error } = await supabase
    .from('products')
    .select(
      `
        id, category_id, name, slug, is_featured, created_at,
        categories (name, slug),
        product_variants (id, sku, name, price, compare_price, stock, is_active, product_variant_attrs(id, attr_name, attr_value)),
        product_images (id, url, alt_text, sort_order, is_primary)
      `
    )
    .eq('is_active', true)
    .eq('category_id', categoryId)
    .neq('id', productId)
    .eq('product_variants.is_active', true)
    .limit(limit)

  if (error) {
    safeLogError('Error fetching related products:', error)
    return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memuat produk terkait')
  }

  if (!data) return paginated([], 0, 1, limit)

  return paginated(data.map(mapProductListItem), data.length, 1, limit)
}

import { ApiListResponse, ApiResponse, paginated, ok, fail } from '@/lib/api-response'
import { ApiErrorCode } from '@/lib/api-errors'

export async function adminGetProducts(
  supabase: SupabaseClient<Database>,
  params: { page?: number; limit?: number; search?: string } = {}
): Promise<ApiListResponse<AdminProductListItem>> {
  const { page = 1, limit = 20, search = '' } = params
  const offset = (page - 1) * limit

  let query = supabase
    .from('products')
    .select(
      `
        id, name, slug, description, short_description, weight_gram, is_featured, is_active, created_at,
        categories (name, slug),
        product_variants (id, sku, name, price, compare_price, stock, is_active)
      `,
      { count: 'exact' }
    )

  if (search) {
    const escapedSearch = search
      .replace(/\\/g, '\\\\')
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_')
    query = query.ilike('name', `%${escapedSearch}%`)
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    safeLogError('Error in adminGetProducts:', error)
    return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memuat daftar produk')
  }

  if (!data) return paginated([], 0, page, limit)

  const products: AdminProductListItem[] = data.map(p => {
    const categories = mapCategory(p.categories)
    const product_variants = mapVariants(p.product_variants, false)

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      short_description: p.short_description,
      weight_gram: p.weight_gram,
      is_featured: p.is_featured,
      is_active: p.is_active,
      created_at: p.created_at,
      categories,
      product_variants,
    }
  })

  return paginated(products, count || 0, page, limit)
}

export async function adminCreateProduct(
  supabase: SupabaseClient<Database>,
  productData: ProductPayload['productData'],
  variants: ProductPayload['variants'],
  images: ProductPayload['images'],
  marketplaceLinks: ProductPayload['links'],
  collectionIds: string[] = []
) : Promise<ApiResponse<{ id: string; }>> {
  const { data: result, error: rpcErr } = await supabase.rpc('admin_create_product', {
    p_product: productData as any,
    p_variants: variants as any,
    p_images: images as any,
    p_links: marketplaceLinks as any,
    p_collections: collectionIds
  })

  if (rpcErr) {
    safeLogError('Gagal membuat produk (RPC)', rpcErr)
    return fail('Gagal membuat produk', rpcErr.message)
  }
  
  const res = result as any
  if (res && res.success === false) {
    safeLogError('Gagal membuat produk (RPC transaction)', res.error)
    return fail('Gagal membuat produk', res.error?.message || 'Transaction failed')
  }

  const productId = res?.data?.id

  await insertAdminActivityLog(supabase, 'create', 'product', productId, `Created product ${productData.name}`)

  return ok({ id: productId })
}

export async function adminUpdateProduct(
  supabase: SupabaseClient<Database>,
  productId: string,
  productData: ProductPayload['productData'],
  variants: ProductPayload['variants'],
  images: ProductPayload['images'],
  marketplaceLinks: ProductPayload['links'],
  collectionIds: string[] = []
) : Promise<ApiResponse<{ id: string; }>> {

  // We need to determine which variants/images/links to delete vs upsert
  // The RPC handles this by receiving the items to upsert and the IDs to delete.
  
  // Variants
  const variantsToUpsert = variants.map(v => ({
    ...v,
    id: v.id?.startsWith('temp-') ? null : v.id
  }))

  const { data: dbVariants } = await supabase.from('product_variants').select('id').eq('product_id', productId)
  const dbVariantIds = (dbVariants || []).map(v => v.id)
  const incomingVariantIds = variantsToUpsert.map(v => v.id).filter(id => id) as string[]
  const variantIdsToDelete = dbVariantIds.filter(id => !incomingVariantIds.includes(id))

  // Images
  const imagesToUpsert = images.map(img => ({
    ...img,
    id: (img as any).id?.startsWith('temp-') ? null : (img as any).id
  }))

  const { data: dbImages } = await supabase.from('product_images').select('id').eq('product_id', productId)
  const dbImageIds = (dbImages || []).map(i => i.id)
  const incomingImageIds = imagesToUpsert.map(i => (i as any).id).filter(id => id) as string[]
  const imageIdsToDelete = dbImageIds.filter(id => !incomingImageIds.includes(id))

  // Links
  const linksToUpsert = marketplaceLinks.map(link => ({
    ...link,
    id: (link as any).id?.startsWith('temp-') ? null : (link as any).id
  }))

  const { data: dbLinks } = await supabase.from('product_marketplace_links').select('id').eq('product_id', productId)
  const dbLinkIds = (dbLinks || []).map(l => l.id)
  const incomingLinkIds = linksToUpsert.map(l => (l as any).id).filter(id => id) as string[]
  const linkIdsToDelete = dbLinkIds.filter(id => !incomingLinkIds.includes(id))

  const { data: result, error: rpcErr } = await supabase.rpc('admin_update_product', {
    p_product_id: productId as any,
    p_product: productData as any,
    p_variants_to_upsert: variantsToUpsert as any,
    p_variant_ids_to_delete: variantIdsToDelete,
    p_images_to_upsert: imagesToUpsert as any,
    p_image_ids_to_delete: imageIdsToDelete,
    p_links_to_upsert: linksToUpsert as any,
    p_link_ids_to_delete: linkIdsToDelete,
    p_collections: collectionIds
  })

  if (rpcErr) {
    safeLogError('Gagal memperbarui produk (RPC)', rpcErr)
    return fail('Gagal memperbarui produk', rpcErr.message)
  }
  
  const res = result as any
  if (res && res.success === false) {
    safeLogError('Gagal memperbarui produk (RPC transaction)', res.error)
    return fail('Gagal memperbarui produk', res.error?.message || 'Transaction failed')
  }

  await insertAdminActivityLog(supabase, 'update', 'product', productId, `Updated product ${productData.name}`)

  return ok({ id: productId })
}

export async function adminDeleteProduct(
  supabase: SupabaseClient<Database>,
  productId: string
) : Promise<ApiResponse<null>> {
  // 1. Fetch images associated with this product to clean up storage
  const { data: images } = await supabase
    .from('product_images')
    .select('url')
    .eq('product_id', productId)

  // 2. Delete the physical images from Supabase Storage
  if (images && images.length > 0) {
    const { deleteImageByUrl } = await import('@/lib/supabase/storage')
    await Promise.all(
      images.map(img => deleteImageByUrl(supabase, img.url, 'products'))
    )
  }

  // 3. Hard delete from database
  // Bergantung pada konfigurasi ON DELETE CASCADE di database untuk menghapus relasi (variants, images, dll)
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)

  if (error) {
    safeLogError('Delete error:', error)
    return fail('Gagal menghapus produk', error.message)
  }
  
  await insertAdminActivityLog(supabase, 'delete', 'product', productId, `Deleted product ${productId}`)
  
  return ok(null)
}




