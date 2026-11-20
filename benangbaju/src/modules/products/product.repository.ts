import { createStaticClient } from '@/lib/supabase/static'
import type { ProductFilters, ProductPayload } from './types'
import { scoreProduct, type SearchCandidateProduct } from './product-search'
import {
  adminProductRepository,
  type AdminFindVariantsParams,
  type AdminVariantBatchUpdateItem,
  type AdminVariantUpdateInput,
} from './admin-product.repository'

type StaticSupabase = ReturnType<typeof createStaticClient>

interface ResolvedPublicFilters {
  empty: boolean
  categoryIds?: string[]
  collectionProductIds?: string[]
}

const PUBLIC_VARIANT_IMAGE_RELATIONS = `
  product_variants (id, sku, name, price, compare_price, price_myr, compare_price_myr, stock, stock_my, is_active, product_variant_attrs(id, attr_name, attr_value)),
  product_images (id, url, alt_text, sort_order, is_primary)
`

async function resolvePublicFilterConstraints(
  supabase: StaticSupabase,
  filters: Pick<ProductFilters, 'categorySlug' | 'collectionSlug'>
): Promise<ResolvedPublicFilters> {
  let categoryIds: string[] | undefined
  let collectionProductIds: string[] | undefined

  if (filters.categorySlug) {
    const { data: categories } = await supabase.from('categories').select('id, slug, parent_id')
    const category = categories?.find((c) => c.slug === filters.categorySlug)
    if (!category) return { empty: true }

    categoryIds = [
      category.id,
      ...(categories?.filter((c) => c.parent_id === category.id).map((c) => c.id) || []),
    ]
  }

  if (filters.collectionSlug) {
    const { data: junction } = await supabase
      .from('collection_products')
      .select('product_id, collections!inner(id, slug)')
      .eq('collections.slug', filters.collectionSlug)

    const pIds = junction?.map((j) => j.product_id) || []
    if (pIds.length === 0) return { empty: true }
    collectionProductIds = pIds
  }

  return { empty: false, categoryIds, collectionProductIds }
}

interface FilterableQuery<T> {
  in(column: string, values: string[]): T
  gt(column: string, value: number): T
  gte(column: string, value: number): T
  lte(column: string, value: number): T
}

function applyPublicProductConstraints<T extends FilterableQuery<T>>(
  query: T,
  resolved: ResolvedPublicFilters,
  filters: Pick<ProductFilters, 'productIds' | 'market' | 'minPrice' | 'maxPrice'>
): T {
  let q = query
  if (resolved.categoryIds) {
    q = q.in('category_id', resolved.categoryIds)
  }
  if (resolved.collectionProductIds) {
    q = q.in('id', resolved.collectionProductIds)
  }
  if (filters.productIds && filters.productIds.length > 0) {
    q = q.in('id', filters.productIds)
  }
  if (filters.market === 'MY') {
    q = q.gt('min_price_myr', 0)
  }

  const minCol = filters.market === 'MY' ? 'min_price_myr' : 'min_price'
  const maxCol = filters.market === 'MY' ? 'max_price_myr' : 'max_price'
  if (filters.minPrice !== undefined) {
    q = q.gte(minCol, filters.minPrice)
  }
  if (filters.maxPrice !== undefined) {
    q = q.lte(maxCol, filters.maxPrice)
  }
  return q
}

export class ProductRepository {
  /**
   * Mendapatkan daftar produk untuk publik dengan filter dan pagination.
   */
  async findMany(filters: ProductFilters = {}) {
    const supabase = createStaticClient()
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
      market,
    } = filters

    const offset = (page - 1) * limit
    const resolved = await resolvePublicFilterConstraints(supabase, {
      categorySlug,
      collectionSlug,
    })
    if (resolved.empty) {
      return { data: [], count: 0 }
    }

    // JIKA ADA SEARCH QUERY: Gunakan pencarian cerdas multi-token + sinonim busana + relevance scoring
    if (searchQuery && searchQuery.trim().length > 0) {
      const baseSearchQuery = applyPublicProductConstraints(
        supabase
          .from('products')
          .select(
            `
            id, category_id, name, slug, is_featured, created_at, min_price, max_price, min_price_myr, max_price_myr,
            description, short_description, description_en, short_description_en, care_guide_en, meta_title, meta_description,
            categories (id, name, slug),
            ${PUBLIC_VARIANT_IMAGE_RELATIONS}
          `
          )
          .eq('is_active', true)
          .eq('product_variants.is_active', true),
        resolved,
        { productIds, market, minPrice, maxPrice }
      )

      const { data: searchCandidates, error } = await baseSearchQuery
      if (error) throw error

      if (!searchCandidates || searchCandidates.length === 0) {
        return { data: [], count: 0 }
      }

      const scoredItems = searchCandidates
        .map((p) => ({
          product: p,
          score: scoreProduct(p as unknown as SearchCandidateProduct, searchQuery),
        }))
        .filter((item) => item.score > 0)

      scoredItems.sort((a, b) => {
        if (sortBy === 'price-low') {
          const aPrice = Number(market === 'MY' ? a.product.min_price_myr : a.product.min_price) || 0
          const bPrice = Number(market === 'MY' ? b.product.min_price_myr : b.product.min_price) || 0
          return aPrice - bPrice
        }
        if (sortBy === 'price-high') {
          const aPrice = Number(market === 'MY' ? a.product.min_price_myr : a.product.min_price) || 0
          const bPrice = Number(market === 'MY' ? b.product.min_price_myr : b.product.min_price) || 0
          return bPrice - aPrice
        }
        if (sortBy === 'popular' || sortBy === 'featured') {
          if (a.score !== b.score) return b.score - a.score
          return (b.product.is_featured ? 1 : 0) - (a.product.is_featured ? 1 : 0)
        }
        if (b.score !== a.score) return b.score - a.score
        return new Date(b.product.created_at).getTime() - new Date(a.product.created_at).getTime()
      })

      const count = scoredItems.length
      const paginatedData = scoredItems.slice(offset, offset + limit).map((s) => s.product)
      return { data: paginatedData, count }
    }

    let query = applyPublicProductConstraints(
      supabase
        .from('products')
        .select(
          `
          id, category_id, name, slug, is_featured, created_at, min_price, max_price, min_price_myr, max_price_myr,
          categories (name, slug),
          ${PUBLIC_VARIANT_IMAGE_RELATIONS}
        `,
          { count: 'exact' }
        )
        .eq('is_active', true)
        .eq('product_variants.is_active', true),
      resolved,
      { productIds, market, minPrice, maxPrice }
    )

    const priceCol = market === 'MY' ? 'min_price_myr' : 'min_price'
    if (sortBy === 'newest') {
      query = query.order('created_at', { ascending: false })
    } else if (sortBy === 'featured') {
      query = query
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
    } else if (sortBy === 'price-low') {
      query = query.order(priceCol, { ascending: true })
    } else if (sortBy === 'price-high') {
      query = query.order(priceCol, { ascending: false })
    } else if (sortBy === 'popular') {
      query = query.order('is_featured', { ascending: false })
    }

    const { data, count, error } = await query.range(offset, offset + limit - 1)
    if (error) throw error
    return { data, count }
  }

  /**
   * Mendapatkan detail produk berdasarkan slug
   */
  async findOneBySlug(slug: string) {
    const supabase = createStaticClient()
    const { data, error } = await supabase
      .from('products')
      .select(
        `
        id, category_id, name, slug, description, short_description, description_en, short_description_en, care_guide_en, weight_gram, is_featured, created_at, size_guide, size_guide_inch, hs_code, care_guide, meta_title, meta_description,
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
      .maybeSingle()

    if (error) throw error
    return data
  }

  /**
   * Mendapatkan produk terkait
   */
  async findRelated(productId: string, categoryId: string, limit = 4) {
    const supabase = createStaticClient()
    const { data, error } = await supabase
      .from('products')
      .select(
        `
        id, category_id, name, slug, is_featured, created_at, min_price_myr, max_price_myr,
        categories (name, slug),
        ${PUBLIC_VARIANT_IMAGE_RELATIONS}
      `
      )
      .eq('is_active', true)
      .eq('category_id', categoryId)
      .neq('id', productId)
      .eq('product_variants.is_active', true)
      .limit(limit)

    if (error) throw error
    return data
  }

  // --- Admin delegations (implemented in AdminProductRepository) ---

  adminFindMany(params?: { page?: number; limit?: number; search?: string }) {
    return adminProductRepository.adminFindMany(params)
  }

  adminCreate(
    productData: ProductPayload['productData'],
    variants: ProductPayload['variants'],
    images: ProductPayload['images'],
    marketplaceLinks: ProductPayload['links'],
    collectionIds: string[] = []
  ) {
    return adminProductRepository.adminCreate(
      productData,
      variants,
      images,
      marketplaceLinks,
      collectionIds
    )
  }

  adminUpdate(
    productId: string,
    productData: ProductPayload['productData'],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    variantsToUpsert: any[],
    variantIdsToDelete: string[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    imagesToUpsert: any[],
    imageIdsToDelete: string[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    linksToUpsert: any[],
    linkIdsToDelete: string[],
    collectionIds: string[] = []
  ) {
    return adminProductRepository.adminUpdate(
      productId,
      productData,
      variantsToUpsert,
      variantIdsToDelete,
      imagesToUpsert,
      imageIdsToDelete,
      linksToUpsert,
      linkIdsToDelete,
      collectionIds
    )
  }

  adminDelete(productId: string) {
    return adminProductRepository.adminDelete(productId)
  }

  getProductImages(productId: string) {
    return adminProductRepository.getProductImages(productId)
  }

  getProductVariants(productId: string) {
    return adminProductRepository.getProductVariants(productId)
  }

  getProductLinks(productId: string) {
    return adminProductRepository.getProductLinks(productId)
  }

  adminUpdateActiveStatus(productId: string, isActive: boolean) {
    return adminProductRepository.adminUpdateActiveStatus(productId, isActive)
  }

  adminUpdateFeaturedStatus(productId: string, isFeatured: boolean) {
    return adminProductRepository.adminUpdateFeaturedStatus(productId, isFeatured)
  }

  adminFindManyVariants(params?: AdminFindVariantsParams) {
    return adminProductRepository.adminFindManyVariants(params)
  }

  adminUpdateVariant(variantId: string, data: AdminVariantUpdateInput) {
    return adminProductRepository.adminUpdateVariant(variantId, data)
  }

  adminBatchUpdateVariants(updates: AdminVariantBatchUpdateItem[]) {
    return adminProductRepository.adminBatchUpdateVariants(updates)
  }
}

export const productRepository = new ProductRepository()
