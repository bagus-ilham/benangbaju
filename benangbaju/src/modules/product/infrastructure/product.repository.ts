import { safeLogError } from '@/lib/logger'
import { insertAdminActivityLog } from '@/services/adminLogs'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { handleProductSupabaseError } from '../domain/product.errors'
import { 
  ProductFilters, ProductVariant, ProductImage, ProductMarketplaceLink, 
  ProductRatingSummary, ProductListItem, ProductDetailItem, AdminProductListItem 
} from '../domain/product.types'
import { ProductPayload } from '@/types/product'

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

  const activeVariants = product_variants.filter((v) => v.is_active)
  const prices = activeVariants.map((v) => Number(v.price))
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0

  const minPriceVariant = activeVariants.find((v) => Number(v.price) === minPrice)
  const comparePrice = minPriceVariant?.compare_price ? Number(minPriceVariant.compare_price) : null
  const discountPercent = comparePrice && comparePrice > minPrice
    ? Math.round(((comparePrice - minPrice) / comparePrice) * 100)
    : null

  const primaryImage = product_images.find((img) => img.is_primary)?.url || product_images[0]?.url || null
  const hoverImage = product_images.find((img) => !img.is_primary && img.sort_order > 0)?.url || product_images[1]?.url || primaryImage

  const colorAttributes = new Set(
    activeVariants.flatMap((v) =>
      v.product_variant_attrs
        ?.filter((a) => a.attr_name.toLowerCase().includes('warna'))
        .map((a) => a.attr_value) || []
    )
  )
  const hasMultipleColors = colorAttributes.size > 1

  const sizeVariants = activeVariants.filter((v) =>
    v.stock > 0 &&
    v.product_variant_attrs?.some((a) => a.attr_name.toLowerCase().includes('ukuran'))
  )

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
): Promise<{ products: ProductListItem[]; totalCount: number }> {
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
        id, category_id, name, slug, is_featured, created_at,
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
      return { products: [], totalCount: 0 }
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
        return { products: [], totalCount: 0 }
      }
    } else {
      return { products: [], totalCount: 0 }
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

  // 5. Apply Sorting (We order products, and will filter client prices later if needed)
  if (sortBy === 'newest') {
    query = query.order('created_at', { ascending: false })
  } else if (sortBy === 'featured') {
    query = query.order('is_featured', { ascending: false }).order('created_at', { ascending: false })
  }

  const requiresClientFiltering = minPrice !== undefined || maxPrice !== undefined || sortBy === 'price-low' || sortBy === 'price-high' || sortBy === 'popular'

  // If we don't need client-side filtering/sorting, we can paginate directly in the database
  if (!requiresClientFiltering) {
    query = query.range(offset, offset + limit - 1)
  }

  // 6. Execute Query
  const { data, count, error } = await query

  if (error) {
    safeLogError('Error fetching products:', error)
    return { products: [], totalCount: 0 }
  }

  if (!data) return { products: [], totalCount: 0 }

  let results: ProductListItem[] = data.map(mapProductListItem)

  // 7. Client-side price filters (Supabase doesn't easily allow filtering by child min/max price inside one complex query)
  if (minPrice !== undefined || maxPrice !== undefined) {
    results = results.filter((p) => {
      const matchMin = minPrice !== undefined ? p.minPrice >= minPrice : true
      const matchMax = maxPrice !== undefined ? p.maxPrice <= maxPrice : true
      return matchMin && matchMax
    })
  }

  // 8. Client-side sorting for prices
  if (sortBy === 'price-low') {
    results.sort((a, b) => a.minPrice - b.minPrice)
  } else if (sortBy === 'price-high') {
    results.sort((a, b) => b.minPrice - a.minPrice)
  } else if (sortBy === 'popular') {
    // fallback popular to featured/newest for now
    results.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0))
  }

  const totalCount = requiresClientFiltering ? results.length : (count || 0)
  const paginatedResults = requiresClientFiltering ? results.slice(offset, offset + limit) : results

  return { products: paginatedResults, totalCount }
}

export async function getProductBySlug(
  supabase: SupabaseClient<Database>,
  slug: string
): Promise<ProductDetailItem | null> {
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
    return null
  }

  if (!data) return null

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

  return {
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
  }
}


export async function getRelatedProducts(
  supabase: SupabaseClient<Database>,
  productId: string,
  categoryId: string,
  limit = 4
): Promise<ProductListItem[]> {
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
    return []
  }

  if (!data) return []

  return data.map(mapProductListItem)
}

export async function adminGetProducts(
  supabase: SupabaseClient<Database>,
  params: { page?: number; limit?: number; search?: string } = {}
): Promise<{ products: AdminProductListItem[]; totalCount: number }> {
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
    throw error
  }

  if (!data) return { products: [], totalCount: 0 }

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

  return {
    products,
    totalCount: count || 0,
  }
}

export async function adminCreateProduct(
  supabase: SupabaseClient<Database>,
  productData: ProductPayload['productData'],
  variants: ProductPayload['variants'],
  images: ProductPayload['images'],
  marketplaceLinks: ProductPayload['links'],
  collectionIds: string[] = []
) : Promise<{ id: string; }> {
  const { data: product, error: productErr } = await supabase
    .from('products')
    .insert(productData)
    .select('id')
    .single()

  if (productErr) handleProductSupabaseError(productErr, 'Gagal membuat produk')
  const productId = product.id

  const idMap = new Map<string, string>()

  if (variants.length > 0) {
    const variantInserts = variants.map(v => ({
      product_id: productId,
      sku: v.sku,
      name: v.name,
      price: v.price,
      compare_price: v.compare_price,
      stock: v.stock,
      weight_gram: v.weight_gram,
      is_active: v.is_active
    }))

    const { data: insertedVariants, error: variantErr } = await supabase
      .from('product_variants')
      .insert(variantInserts)
      .select('id')

    if (variantErr) handleProductSupabaseError(variantErr, 'Gagal menyimpan varian')

    const allAttrsData: { variant_id: string; attr_name: string; attr_value: string }[] = []

    for (let i = 0; i < variants.length; i++) {
      const v = variants[i]
      const variantId = insertedVariants[i].id

      if (v.id) {
        idMap.set(v.id, variantId)
      }
      idMap.set(String(i), variantId)

      if (v.attrs && v.attrs.length > 0) {
        v.attrs.forEach(a => {
          allAttrsData.push({
            variant_id: variantId,
            attr_name: a.attr_name,
            attr_value: a.attr_value
          })
        })
      }
    }

    if (allAttrsData.length > 0) {
      const { error: attrsErr } = await supabase
        .from('product_variant_attrs')
        .insert(allAttrsData)

      if (attrsErr) handleProductSupabaseError(attrsErr, 'Gagal menyimpan atribut varian')
    }
  }

  if (images && images.length > 0) {
    const imagesData = images.map(img => {
      let resolvedVariantId: string | null = null
      if (img.variant_id) {
        resolvedVariantId = idMap.get(img.variant_id) || img.variant_id
      }
      return {
        product_id: productId,
        url: img.url,
        alt_text: img.alt_text,
        sort_order: img.sort_order,
        is_primary: img.is_primary,
        variant_id: resolvedVariantId
      }
    })
    const { error: imgErr } = await supabase
      .from('product_images')
      .insert(imagesData)
    if (imgErr) handleProductSupabaseError(imgErr, 'Gagal menyimpan gambar produk')
  }

  if (marketplaceLinks && marketplaceLinks.length > 0) {
    const linksData = marketplaceLinks.map(link => ({
      product_id: productId,
      platform: link.platform,
      url: link.url,
      label: link.label,
      sort_order: link.sort_order
    }))
    const { error: linkErr } = await supabase
      .from('product_marketplace_links')
      .insert(linksData)
    if (linkErr) handleProductSupabaseError(linkErr, 'Gagal menyimpan link marketplace')
  }

  // Save collections mapping
  if (collectionIds && collectionIds.length > 0) {
    const collData = collectionIds.map((cid, idx) => ({
      collection_id: cid,
      product_id: productId,
      sort_order: idx
    }))
    const { error: collErr } = await supabase
      .from('collection_products')
      .insert(collData)
    if (collErr) handleProductSupabaseError(collErr, 'Gagal menyematkan produk ke koleksi')
  }

  await insertAdminActivityLog(supabase, 'create', 'product', productId, `Created product ${productData.name}`)

  return { id: productId }
}

export async function adminUpdateProduct(
  supabase: SupabaseClient<Database>,
  productId: string,
  productData: ProductPayload['productData'],
  variants: ProductPayload['variants'],
  images: ProductPayload['images'],
  marketplaceLinks: ProductPayload['links'],
  collectionIds: string[] = []
) : Promise<{ id: string; }> {
  const { error: productErr } = await supabase
    .from('products')
    .update(productData)
    .eq('id', productId)

  if (productErr) handleProductSupabaseError(productErr, 'Gagal memperbarui produk')

  const { data: dbVariants, error: dbVariantsErr } = await supabase
    .from('product_variants')
    .select('id')
    .eq('product_id', productId)

  if (dbVariantsErr) throw new Error(`DB variants error: ${JSON.stringify(dbVariantsErr)}`)
  const dbVariantIds = dbVariants.map(v => v.id)

  const updatedVariantIds: string[] = []
  variants.forEach(v => {
    if (v.id && !v.id.startsWith('temp-')) {
      updatedVariantIds.push(v.id)
    }
  })

  const idsToDelete = dbVariantIds.filter(id => !updatedVariantIds.includes(id))
  if (idsToDelete.length > 0) {
    // 1. Delete attributes first to avoid constraint issues
    await supabase
      .from('product_variant_attrs')
      .delete()
      .in('variant_id', idsToDelete)

    // 2. Try to hard delete the variants
    const { error: deleteErr } = await supabase
      .from('product_variants')
      .delete()
      .in('id', idsToDelete)

    if (deleteErr) {
      // 3. Fallback to soft-deactivate if they are referenced in other tables (e.g. order items)
      const { error: deacErr } = await supabase
        .from('product_variants')
        .update({ is_active: false })
        .in('id', idsToDelete)
      if (deacErr) handleProductSupabaseError(deacErr, 'Gagal menonaktifkan varian')
    }
  }

  const idMap = new Map<string, string>()

  const allAttrsData: { variant_id: string; attr_name: string; attr_value: string }[] = []
  const newVariantsToInsert: { product_id: string; sku: string; name: string; price: number; compare_price: number | null; stock: number; weight_gram: number | null; is_active: boolean }[] = []
  const newVariantsIndices: number[] = []

  // 1. Process existing variants (Updates & Delete old attrs)
  for (let i = 0; i < variants.length; i++) {
    const v = variants[i]
    if (v.id && !v.id.startsWith('temp-')) {
      const { error: variantErr } = await supabase
        .from('product_variants')
        .update({
          sku: v.sku,
          name: v.name,
          price: v.price,
          compare_price: v.compare_price,
          stock: v.stock,
          weight_gram: v.weight_gram,
          is_active: v.is_active
        })
        .eq('id', v.id)

      if (variantErr) handleProductSupabaseError(variantErr, 'Gagal memperbarui varian')
      idMap.set(v.id, v.id)
      idMap.set(String(i), v.id)

      const { error: deleteAttrsErr } = await supabase
        .from('product_variant_attrs')
        .delete()
        .eq('variant_id', v.id)
      if (deleteAttrsErr) handleProductSupabaseError(deleteAttrsErr, 'Gagal menghapus atribut varian')

      if (v.attrs && v.attrs.length > 0) {
        v.attrs.forEach(a => {
          allAttrsData.push({
            variant_id: v.id!,
            attr_name: a.attr_name,
            attr_value: a.attr_value
          })
        })
      }
    } else {
      // Collect new variants to insert
      newVariantsToInsert.push({
        product_id: productId,
        sku: v.sku,
        name: v.name,
        price: v.price,
        compare_price: v.compare_price,
        stock: v.stock,
        weight_gram: v.weight_gram,
        is_active: v.is_active
      })
      newVariantsIndices.push(i)
    }
  }

  // 2. Process new variants (Bulk Insert)
  if (newVariantsToInsert.length > 0) {
    const { data: insertedVariants, error: variantErr } = await supabase
      .from('product_variants')
      .insert(newVariantsToInsert)
      .select('id')

    if (variantErr) handleProductSupabaseError(variantErr, 'Gagal menambah varian baru')

    for (let k = 0; k < insertedVariants.length; k++) {
      const originalIndex = newVariantsIndices[k]
      const v = variants[originalIndex]
      const variantId = insertedVariants[k].id

      if (v.id) {
        idMap.set(v.id, variantId)
      }
      idMap.set(String(originalIndex), variantId)

      if (v.attrs && v.attrs.length > 0) {
        v.attrs.forEach(a => {
          allAttrsData.push({
            variant_id: variantId,
            attr_name: a.attr_name,
            attr_value: a.attr_value
          })
        })
      }
    }
  }

  // 3. Bulk insert all new attrs (for both updated existing and newly created variants)
  if (allAttrsData.length > 0) {
    const { error: attrsErr } = await supabase
      .from('product_variant_attrs')
      .insert(allAttrsData)
    if (attrsErr) handleProductSupabaseError(attrsErr, 'Gagal menyisipkan atribut varian baru')
  }

  const { error: deleteImgErr } = await supabase
    .from('product_images')
    .delete()
    .eq('product_id', productId)
  if (deleteImgErr) handleProductSupabaseError(deleteImgErr, 'Gagal mereset gambar produk')

  if (images && images.length > 0) {
    const imagesData = images.map(img => {
      let resolvedVariantId: string | null = null
      if (img.variant_id) {
        resolvedVariantId = idMap.get(img.variant_id) || img.variant_id
      }
      return {
        product_id: productId,
        url: img.url,
        alt_text: img.alt_text,
        sort_order: img.sort_order,
        is_primary: img.is_primary,
        variant_id: resolvedVariantId
      }
    })
    const { error: imgErr } = await supabase
      .from('product_images')
      .insert(imagesData)
    if (imgErr) handleProductSupabaseError(imgErr, 'Gagal menyimpan gambar')
  }

  const { error: deleteLinksErr } = await supabase
    .from('product_marketplace_links')
    .delete()
    .eq('product_id', productId)
  if (deleteLinksErr) handleProductSupabaseError(deleteLinksErr, 'Gagal mereset link marketplace')

  if (marketplaceLinks && marketplaceLinks.length > 0) {
    const linksData = marketplaceLinks.map(link => ({
      product_id: productId,
      platform: link.platform,
      url: link.url,
      label: link.label,
      sort_order: link.sort_order
    }))
    const { error: linkErr } = await supabase
      .from('product_marketplace_links')
      .insert(linksData)
    if (linkErr) handleProductSupabaseError(linkErr, 'Gagal menyimpan link')
  }

  // Update collections mapping: delete first then insert new ones
  const { error: delCollErr } = await supabase
    .from('collection_products')
    .delete()
    .eq('product_id', productId)
  if (delCollErr) handleProductSupabaseError(delCollErr, 'Gagal mereset koleksi')

  if (collectionIds && collectionIds.length > 0) {
    const collData = collectionIds.map((cid, idx) => ({
      collection_id: cid,
      product_id: productId,
      sort_order: idx
    }))
    const { error: collErr } = await supabase
      .from('collection_products')
      .insert(collData)
    if (collErr) handleProductSupabaseError(collErr, 'Gagal menautkan koleksi')
  }

  await insertAdminActivityLog(supabase, 'update', 'product', productId, `Updated product ${productData.name}`)

  return { id: productId }
}

export async function adminDeleteProduct(
  supabase: SupabaseClient<Database>,
  productId: string
) : Promise<{ success: boolean; }> {
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

  if (error) throw new Error(`Delete error: ${JSON.stringify(error)}`)
  
  await insertAdminActivityLog(supabase, 'delete', 'product', productId, `Deleted product ${productId}`)
  
  return { success: true }
}




