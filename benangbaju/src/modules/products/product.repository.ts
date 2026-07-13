import { createServerClient } from '@/lib/supabase/server'
import { createStaticClient } from '@/lib/supabase/static'
import type { Json } from '@/shared/types/database'
import { ProductFilters, ProductPayload } from './types'

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
    } = filters

    const offset = (page - 1) * limit

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

    if (categorySlug) {
      const { data: categories } = await supabase.from('categories').select('id, slug, parent_id')
      const category = categories?.find((c) => c.slug === categorySlug)
      if (category) {
        const categoryIds = [
          category.id,
          ...(categories?.filter((c) => c.parent_id === category.id).map((c) => c.id) || []),
        ]
        query = query.in('category_id', categoryIds)
      } else {
        return { data: [], count: 0 }
      }
    }

    if (collectionSlug) {
      const { data: junction } = await supabase
        .from('collection_products')
        .select('product_id, collections!inner(id, slug)')
        .eq('collections.slug', collectionSlug)

      const pIds = junction?.map((j) => j.product_id) || []
      if (pIds.length > 0) {
        query = query.in('id', pIds)
      } else {
        return { data: [], count: 0 }
      }
    }

    if (productIds && productIds.length > 0) {
      query = query.in('id', productIds)
    }

    if (searchQuery) {
      const escapedSearch = searchQuery
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_')
      query = query.ilike('name', `%${escapedSearch}%`)
    }

    if (minPrice !== undefined) {
      query = query.gte('min_price', minPrice)
    }
    if (maxPrice !== undefined) {
      query = query.lte('max_price', maxPrice)
    }

    if (sortBy === 'newest') {
      query = query.order('created_at', { ascending: false })
    } else if (sortBy === 'featured') {
      query = query
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
    } else if (sortBy === 'price-low') {
      query = query.order('min_price', { ascending: true })
    } else if (sortBy === 'price-high') {
      query = query.order('min_price', { ascending: false })
    } else if (sortBy === 'popular') {
      query = query.order('is_featured', { ascending: false })
    }

    query = query.range(offset, offset + limit - 1)

    const { data, count, error } = await query
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

    if (error) throw error
    return data
  }

  /**
   * ADMIN: Mendapatkan daftar produk dengan filter minimalis
   */
  async adminFindMany(params: { page?: number; limit?: number; search?: string } = {}) {
    const supabase = await createServerClient()
    const { page = 1, limit = 20, search = '' } = params
    const offset = (page - 1) * limit

    let query = supabase.from('products').select(
      `
        id, name, slug, description, short_description, weight_gram, is_featured, is_active, created_at,
        categories (name, slug),
        product_variants (id, sku, name, price, compare_price, stock, is_active)
      `,
      { count: 'exact' }
    )

    if (search) {
      const escapedSearch = search.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')
      query = query.ilike('name', `%${escapedSearch}%`)
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return { data, count }
  }

  /**
   * ADMIN: Eksekusi RPC untuk membuat produk
   */
  async adminCreate(
    productData: ProductPayload['productData'],
    variants: ProductPayload['variants'],
    images: ProductPayload['images'],
    marketplaceLinks: ProductPayload['links'],
    collectionIds: string[] = []
  ) {
    const supabase = await createServerClient()
    const { data: result, error: rpcErr } = await supabase.rpc('admin_create_product', {
      p_product: productData as unknown as Json,
      p_variants: variants as unknown as Json,
      p_images: images as unknown as Json,
      p_links: marketplaceLinks as unknown as Json,
      p_collections: collectionIds as any,
    } as any)

    if (rpcErr) throw rpcErr
    const res = result as Record<string, unknown>
    if (res && res.success === false) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      throw new Error((res.error as any)?.message || 'Transaction failed')
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (res?.data as any)?.id
  }

  /**
   * ADMIN: Eksekusi RPC untuk update produk
   */
  async adminUpdate(
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
    const supabase = await createServerClient()
    const { data: result, error: rpcErr } = await supabase.rpc('admin_update_product', {
      p_product_id: productId as unknown as Json,
      p_product: productData as unknown as Json,
      p_variants_to_upsert: variantsToUpsert as unknown as Json,
      p_variant_ids_to_delete: variantIdsToDelete as unknown as Json,
      p_images_to_upsert: imagesToUpsert as unknown as Json,
      p_image_ids_to_delete: imageIdsToDelete as unknown as Json,
      p_links_to_upsert: linksToUpsert as unknown as Json,
      p_link_ids_to_delete: linkIdsToDelete as unknown as Json,
      p_collections: collectionIds as any,
    } as any)

    if (rpcErr) throw rpcErr
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = result as any
    if (res && res.success === false) {
      throw new Error(res.error?.message || 'Transaction failed')
    }
    return productId
  }

  /**
   * ADMIN: Soft delete atau hard delete produk
   */
  async adminDelete(productId: string) {
    const supabase = await createServerClient()
    const { error } = await supabase.from('products').delete().eq('id', productId)
    if (error) throw error
    return true
  }

  /**
   * Mendapatkan gambar-gambar suatu produk
   */
  async getProductImages(productId: string) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('product_images')
      .select('id, url')
      .eq('product_id', productId)
    if (error) throw error
    return data
  }

  /**
   * Mendapatkan varian dari sebuah produk
   */
  async getProductVariants(productId: string) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('product_variants')
      .select('id')
      .eq('product_id', productId)
    if (error) throw error
    return data
  }

  /**
   * Mendapatkan links dari produk
   */
  async getProductLinks(productId: string) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('product_marketplace_links')
      .select('id, url')
      .eq('product_id', productId)
    if (error) throw error
    return data
  }

  /**
   * ADMIN: Update status aktif produk
   */
  async adminUpdateActiveStatus(productId: string, isActive: boolean) {
    const supabase = await createServerClient()
    const { error } = await supabase
      .from('products')
      .update({ is_active: isActive })
      .eq('id', productId)
    if (error) throw error
    return true
  }

  /**
   * ADMIN: Update status featured produk
   */
  async adminUpdateFeaturedStatus(productId: string, isFeatured: boolean) {
    const supabase = await createServerClient()
    const { error } = await supabase
      .from('products')
      .update({ is_featured: isFeatured })
      .eq('id', productId)
    if (error) throw error
    return true
  }
}

export const productRepository = new ProductRepository()
