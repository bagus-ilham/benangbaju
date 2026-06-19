import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export interface ProductFilters {
  categorySlug?: string
  collectionSlug?: string
  searchQuery?: string
  productIds?: string[]
  minPrice?: number
  maxPrice?: number
  sortBy?: 'newest' | 'price-low' | 'price-high' | 'popular' | 'featured'
  page?: number
  limit?: number
}

// Custom types for product queries matching the required database schema joins
export interface ProductVariant {
  id: string
  sku: string
  name: string
  price: number
  compare_price: number | null
  stock: number
  weight_gram: number | null
  is_active: boolean
  product_variant_attrs?: {
    id: string
    attr_name: string
    attr_value: string
  }[]
}

export interface ProductImage {
  id: string
  url: string
  alt_text: string | null
  sort_order: number
  is_primary: boolean
  variant_id?: string | null
}

export interface ProductMarketplaceLink {
  id: string
  platform: string
  url: string
  label: string | null
}

export interface ProductRatingSummary {
  avg_rating: number
  total_reviews: number
}

export interface ProductListItem {
  id: string
  category_id: string
  name: string
  slug: string
  description: string | null
  short_description: string | null
  weight_gram: number
  is_featured: boolean
  created_at: string
  categories: {
    name: string
    slug: string
  } | null
  product_variants: ProductVariant[]
  product_images: ProductImage[]
}

export interface ProductDetailItem extends ProductListItem {
  product_marketplace_links: ProductMarketplaceLink[]
  product_rating_summary: ProductRatingSummary | null
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
        id, category_id, name, slug, description, short_description, weight_gram, is_featured, created_at,
        categories (name, slug),
        product_variants (id, sku, name, price, compare_price, stock, is_active),
        product_images (id, url, alt_text, sort_order, is_primary)
      `,
      { count: 'exact' }
    )
    .eq('is_active', true)
    .eq('product_variants.is_active', true)

  // 2. Filter by Category
  if (categorySlug) {
    // We filter using an inner join simulation
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single()
    
    if (category) {
      query = query.eq('category_id', category.id)
    } else {
      return { products: [], totalCount: 0 }
    }
  }

  // 3. Filter by Collection
  if (collectionSlug) {
    const { data: collection } = await supabase
      .from('collections')
      .select('id')
      .eq('slug', collectionSlug)
      .single()

    if (collection) {
      // Fetch junction keys
      const { data: junction } = await supabase
        .from('collection_products')
        .select('product_id')
        .eq('collection_id', collection.id)
      
      const productIds = junction?.map((j) => j.product_id) || []
      if (productIds.length > 0) {
        query = query.in('id', productIds)
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

  // 6. Execute Query
  const { data, error } = await query

  if (error) {
    console.error('Error fetching products:', error)
    return { products: [], totalCount: 0 }
  }

  if (!data) return { products: [], totalCount: 0 }

  let results: ProductListItem[] = data.map((p) => {
    const rawCat = p.categories
    let categories: { name: string; slug: string } | null = null
    if (rawCat && !Array.isArray(rawCat)) {
      categories = {
        name: rawCat.name,
        slug: rawCat.slug,
      }
    }

    const rawVariants = p.product_variants
    const variantsList = Array.isArray(rawVariants) ? rawVariants : []
    const product_variants: ProductVariant[] = variantsList.map(v => ({
      id: v.id,
      sku: v.sku,
      name: v.name,
      price: v.price,
      compare_price: v.compare_price,
      stock: v.stock,
      weight_gram: null,
      is_active: v.is_active,
    }))

    const rawImages = p.product_images
    const imagesList = Array.isArray(rawImages) ? rawImages : []
    const sortedImages = imagesList.map(img => ({
      id: img.id,
      url: img.url,
      alt_text: img.alt_text,
      sort_order: img.sort_order,
      is_primary: img.is_primary,
    })).sort((a, b) => a.sort_order - b.sort_order)

    return {
      id: p.id,
      category_id: p.category_id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      short_description: p.short_description,
      weight_gram: p.weight_gram,
      is_featured: p.is_featured,
      created_at: p.created_at,
      categories,
      product_variants,
      product_images: sortedImages,
    }
  })

  // 7. Client-side price filters (Supabase doesn't easily allow filtering by child min/max price inside one complex query)
  if (minPrice !== undefined || maxPrice !== undefined) {
    results = results.filter((p) => {
      const prices = p.product_variants.map((v) => Number(v.price))
      if (prices.length === 0) return false
      const minVal = Math.min(...prices)
      const maxVal = Math.max(...prices)
      
      const matchMin = minPrice !== undefined ? minVal >= minPrice : true
      const matchMax = maxPrice !== undefined ? maxVal <= maxPrice : true
      return matchMin && matchMax
    })
  }

  // 8. Client-side sorting for prices
  if (sortBy === 'price-low') {
    results.sort((a, b) => {
      const minA = a.product_variants.length > 0
        ? Math.min(...a.product_variants.map((v) => Number(v.price)))
        : 0
      const minB = b.product_variants.length > 0
        ? Math.min(...b.product_variants.map((v) => Number(v.price)))
        : 0
      return minA - minB
    })
  } else if (sortBy === 'price-high') {
    results.sort((a, b) => {
      const minA = a.product_variants.length > 0
        ? Math.min(...a.product_variants.map((v) => Number(v.price)))
        : 0
      const minB = b.product_variants.length > 0
        ? Math.min(...b.product_variants.map((v) => Number(v.price)))
        : 0
      return minB - minA
    })
  } else if (sortBy === 'popular') {
    // fallback popular to featured/newest for now
    results.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0))
  }

  const paginatedResults = results.slice(offset, offset + limit)
  return { products: paginatedResults, totalCount: results.length }
}

export async function getProductBySlug(
  supabase: SupabaseClient<Database>,
  slug: string
): Promise<ProductDetailItem | null> {
  const { data, error } = await supabase
    .from('products')
    .select(
      `
        id, category_id, name, slug, description, short_description, weight_gram, is_featured, created_at,
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
    console.error(`Error fetching product details for slug ${slug}:`, error)
    return null
  }

  if (!data) return null

  const rawCat = data.categories
  let categories: { name: string; slug: string } | null = null
  if (rawCat && !Array.isArray(rawCat)) {
    categories = {
      name: rawCat.name,
      slug: rawCat.slug,
    }
  }

  const rawVariants = data.product_variants
  const variantsList = Array.isArray(rawVariants) ? rawVariants : []
  const product_variants: ProductVariant[] = variantsList.map(v => {
    const rawAttrs = v.product_variant_attrs
    const attrsList = Array.isArray(rawAttrs) ? rawAttrs : []
    const product_variant_attrs = attrsList.map(attr => ({
      id: attr.id,
      attr_name: attr.attr_name,
      attr_value: attr.attr_value,
    }))
    return {
      id: v.id,
      sku: v.sku,
      name: v.name,
      price: v.price,
      compare_price: v.compare_price,
      stock: v.stock,
      weight_gram: v.weight_gram,
      is_active: v.is_active,
      product_variant_attrs,
    }
  })

  const rawImages = data.product_images
  const imagesList = Array.isArray(rawImages) ? rawImages : []
  const sortedImages = imagesList.map(img => ({
    id: img.id,
    url: img.url,
    alt_text: img.alt_text,
    sort_order: img.sort_order,
    is_primary: img.is_primary,
    variant_id: img.variant_id,
  })).sort((a, b) => a.sort_order - b.sort_order)

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
    weight_gram: data.weight_gram,
    is_featured: data.is_featured,
    created_at: data.created_at,
    categories,
    product_variants,
    product_images: sortedImages,
    product_marketplace_links,
    product_rating_summary,
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
        id, category_id, name, slug, description, short_description, weight_gram, is_featured, created_at,
        categories (name, slug),
        product_variants (id, sku, name, price, compare_price, stock, is_active),
        product_images (id, url, alt_text, sort_order, is_primary)
      `
    )
    .eq('is_active', true)
    .eq('category_id', categoryId)
    .neq('id', productId)
    .eq('product_variants.is_active', true)
    .limit(limit)

  if (error) {
    console.error('Error fetching related products:', error)
    return []
  }

  if (!data) return []

  return data.map((p) => {
    const rawCat = p.categories
    let categories: { name: string; slug: string } | null = null
    if (rawCat && !Array.isArray(rawCat)) {
      categories = {
        name: rawCat.name,
        slug: rawCat.slug,
      }
    }

    const rawVariants = p.product_variants
    const variantsList = Array.isArray(rawVariants) ? rawVariants : []
    const product_variants: ProductVariant[] = variantsList.map(v => ({
      id: v.id,
      sku: v.sku,
      name: v.name,
      price: v.price,
      compare_price: v.compare_price,
      stock: v.stock,
      weight_gram: null,
      is_active: v.is_active,
    }))

    const rawImages = p.product_images
    const imagesList = Array.isArray(rawImages) ? rawImages : []
    const sortedImages = imagesList.map(img => ({
      id: img.id,
      url: img.url,
      alt_text: img.alt_text,
      sort_order: img.sort_order,
      is_primary: img.is_primary,
    })).sort((a, b) => a.sort_order - b.sort_order)

    return {
      id: p.id,
      category_id: p.category_id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      short_description: p.short_description,
      weight_gram: p.weight_gram,
      is_featured: p.is_featured,
      created_at: p.created_at,
      categories,
      product_variants,
      product_images: sortedImages,
    }
  })
}

export interface AdminProductListItem {
  id: string
  name: string
  slug: string
  description: string | null
  short_description: string | null
  weight_gram: number
  is_featured: boolean
  is_active: boolean
  created_at: string
  categories: {
    name: string
    slug: string
  } | null
  product_variants: Array<{
    id: string
    sku: string
    name: string
    price: number
    compare_price: number | null
    stock: number
    is_active: boolean
  }>
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
    console.error('Error in adminGetProducts:', error)
    throw error
  }

  if (!data) return { products: [], totalCount: 0 }

  const products: AdminProductListItem[] = data.map(p => {
    const rawCat = p.categories
    let categories: { name: string; slug: string } | null = null
    if (rawCat && !Array.isArray(rawCat)) {
      categories = {
        name: rawCat.name,
        slug: rawCat.slug,
      }
    }

    const rawVariants = p.product_variants
    const variantsList = Array.isArray(rawVariants) ? rawVariants : []
    const product_variants = variantsList.map(v => ({
      id: v.id,
      sku: v.sku,
      name: v.name,
      price: v.price,
      compare_price: v.compare_price,
      stock: v.stock,
      is_active: v.is_active,
    }))

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
  productData: {
    category_id: string
    name: string
    slug: string
    description: string | null
    short_description: string | null
    weight_gram: number
    is_featured: boolean
    is_active: boolean
    meta_title?: string | null
    meta_description?: string | null
  },
  variants: {
    id?: string
    sku: string
    name: string
    price: number
    compare_price: number | null
    stock: number
    weight_gram: number | null
    is_active: boolean
    attrs: { attr_name: string; attr_value: string }[]
  }[],
  images: { url: string; alt_text: string | null; sort_order: number; is_primary: boolean; variant_id?: string | null }[],
  marketplaceLinks: { platform: string; url: string; label: string | null; sort_order: number }[],
  collectionIds: string[] = []
) : Promise<{ id: string; }> {
  const { data: product, error: productErr } = await supabase
    .from('products')
    .insert(productData)
    .select('id')
    .single()

  if (productErr) throw productErr
  const productId = product.id

  const idMap = new Map<string, string>()

  for (let i = 0; i < variants.length; i++) {
    const v = variants[i]
    const { data: variant, error: variantErr } = await supabase
      .from('product_variants')
      .insert({
        product_id: productId,
        sku: v.sku,
        name: v.name,
        price: v.price,
        compare_price: v.compare_price,
        stock: v.stock,
        weight_gram: v.weight_gram,
        is_active: v.is_active
      })
      .select('id')
      .single()

    if (variantErr) throw variantErr

    if (v.id) {
      idMap.set(v.id, variant.id)
    }
    idMap.set(String(i), variant.id)

    if (v.attrs && v.attrs.length > 0) {
      const attrsData = v.attrs.map(a => ({
        variant_id: variant.id,
        attr_name: a.attr_name,
        attr_value: a.attr_value
      }))
      const { error: attrsErr } = await supabase
        .from('product_variant_attrs')
        .insert(attrsData)

      if (attrsErr) throw attrsErr
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
    if (imgErr) throw imgErr
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
    if (linkErr) throw linkErr
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
    if (collErr) throw collErr
  }

  return { id: productId }
}

export async function adminUpdateProduct(
  supabase: SupabaseClient<Database>,
  productId: string,
  productData: {
    category_id: string
    name: string
    slug: string
    description: string | null
    short_description: string | null
    weight_gram: number
    is_featured: boolean
    is_active: boolean
    meta_title?: string | null
    meta_description?: string | null
  },
  variants: {
    id?: string
    sku: string
    name: string
    price: number
    compare_price: number | null
    stock: number
    weight_gram: number | null
    is_active: boolean
    attrs: { attr_name: string; attr_value: string }[]
  }[],
  images: { url: string; alt_text: string | null; sort_order: number; is_primary: boolean; variant_id?: string | null }[],
  marketplaceLinks: { platform: string; url: string; label: string | null; sort_order: number }[],
  collectionIds: string[] = []
) : Promise<{ id: string; }> {
  const { error: productErr } = await supabase
    .from('products')
    .update(productData)
    .eq('id', productId)

  if (productErr) throw productErr

  const { data: dbVariants, error: dbVariantsErr } = await supabase
    .from('product_variants')
    .select('id')
    .eq('product_id', productId)

  if (dbVariantsErr) throw dbVariantsErr
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
      if (deacErr) throw deacErr
    }
  }

  const idMap = new Map<string, string>()

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

      if (variantErr) throw variantErr
      idMap.set(v.id, v.id)

      const { error: deleteAttrsErr } = await supabase
        .from('product_variant_attrs')
        .delete()
        .eq('variant_id', v.id)
      if (deleteAttrsErr) throw deleteAttrsErr

      if (v.attrs && v.attrs.length > 0) {
        const attrsData = v.attrs.map(a => ({
          variant_id: v.id!,
          attr_name: a.attr_name,
          attr_value: a.attr_value
        }))
        const { error: attrsErr } = await supabase
          .from('product_variant_attrs')
          .insert(attrsData)
        if (attrsErr) throw attrsErr
      }
    } else {
      const { data: newVariant, error: variantErr } = await supabase
        .from('product_variants')
        .insert({
          product_id: productId,
          sku: v.sku,
          name: v.name,
          price: v.price,
          compare_price: v.compare_price,
          stock: v.stock,
          weight_gram: v.weight_gram,
          is_active: v.is_active
        })
        .select('id')
        .single()

      if (variantErr) throw variantErr
      if (v.id) {
        idMap.set(v.id, newVariant.id)
      }
      idMap.set(String(i), newVariant.id)

      if (v.attrs && v.attrs.length > 0) {
        const attrsData = v.attrs.map(a => ({
          variant_id: newVariant.id,
          attr_name: a.attr_name,
          attr_value: a.attr_value
        }))
        const { error: attrsErr } = await supabase
          .from('product_variant_attrs')
          .insert(attrsData)
        if (attrsErr) throw attrsErr
      }
    }
  }

  const { error: deleteImgErr } = await supabase
    .from('product_images')
    .delete()
    .eq('product_id', productId)
  if (deleteImgErr) throw deleteImgErr

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
    if (imgErr) throw imgErr
  }

  const { error: deleteLinksErr } = await supabase
    .from('product_marketplace_links')
    .delete()
    .eq('product_id', productId)
  if (deleteLinksErr) throw deleteLinksErr

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
    if (linkErr) throw linkErr
  }

  // Update collections mapping: delete first then insert new ones
  const { error: delCollErr } = await supabase
    .from('collection_products')
    .delete()
    .eq('product_id', productId)
  if (delCollErr) throw delCollErr

  if (collectionIds && collectionIds.length > 0) {
    const collData = collectionIds.map((cid, idx) => ({
      collection_id: cid,
      product_id: productId,
      sort_order: idx
    }))
    const { error: collErr } = await supabase
      .from('collection_products')
      .insert(collData)
    if (collErr) throw collErr
  }

  return { id: productId }
}

export async function adminDeleteProduct(
  supabase: SupabaseClient<Database>,
  productId: string
) : Promise<{ success: boolean; }> {
  const { error } = await supabase
    .from('products')
    .update({ is_active: false })
    .eq('id', productId)

  if (error) throw error
  return { success: true }
}
