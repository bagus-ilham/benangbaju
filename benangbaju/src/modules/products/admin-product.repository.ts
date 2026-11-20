import { createServerClient } from '@/lib/supabase/server'
import type { Database, Json } from '@/shared/types/database'
import type { ProductPayload } from './types'
import { scoreProduct, type SearchCandidateProduct } from './product-search'

const ADMIN_PRODUCT_SELECT = `
  id, name, slug, description, short_description, description_en, short_description_en, care_guide_en, weight_gram, is_featured, is_active, created_at,
  categories (name, slug),
  product_variants (id, sku, name, price, compare_price, price_myr, compare_price_myr, stock, stock_my, is_active)
`

export interface AdminVariantUpdateInput {
  price: number
  compare_price: number | null
  price_myr?: number | null
  compare_price_myr?: number | null
  stock: number
  stock_my?: number
  is_active: boolean
}

export interface AdminVariantBatchUpdateItem extends AdminVariantUpdateInput {
  variantId: string
}

export interface AdminFindVariantsParams {
  page?: number
  limit?: number
  search?: string
  stockFilter?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
  statusFilter?: 'all' | 'active' | 'inactive'
  sortBy?: 'name_asc' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc' | 'newest'
  market?: 'ID' | 'MY'
}

type ServerSupabase = Awaited<ReturnType<typeof createServerClient>>

async function updateSingleVariantWithNotifications(
  supabase: ServerSupabase,
  variantId: string,
  data: AdminVariantUpdateInput
) {
  const { data: currentVar } = await supabase
    .from('product_variants')
    .select('stock, stock_my')
    .eq('id', variantId)
    .single()

  const oldStock = currentVar?.stock ?? 0
  const oldStockMy = currentVar?.stock_my ?? 0

  const updatePayload: Database['public']['Tables']['product_variants']['Update'] = {
    price: data.price,
    compare_price: data.compare_price,
    stock: data.stock,
    is_active: data.is_active,
  }
  if (data.price_myr !== undefined) updatePayload.price_myr = data.price_myr
  if (data.compare_price_myr !== undefined) updatePayload.compare_price_myr = data.compare_price_myr
  if (data.stock_my !== undefined) updatePayload.stock_my = data.stock_my

  const { error } = await supabase
    .from('product_variants')
    .update(updatePayload)
    .eq('id', variantId)

  if (error) throw error

  const needsIdNotif = oldStock <= 0 && data.stock > 0
  const needsMyNotif = data.stock_my !== undefined && oldStockMy <= 0 && data.stock_my > 0

  if (needsIdNotif || needsMyNotif) {
    const { checkAndDispatchStockNotifications } = await import('./inventory.repository')
    if (needsIdNotif) {
      await checkAndDispatchStockNotifications(supabase, variantId, data.stock, 'ID')
    }
    if (needsMyNotif && data.stock_my !== undefined) {
      await checkAndDispatchStockNotifications(supabase, variantId, data.stock_my, 'MY')
    }
  }
}

export class AdminProductRepository {
  /**
   * ADMIN: Mendapatkan daftar produk dengan filter minimalis
   */
  async adminFindMany(params: { page?: number; limit?: number; search?: string } = {}) {
    const supabase = await createServerClient()
    const { page = 1, limit = 20, search = '' } = params
    const offset = (page - 1) * limit

    if (search && search.trim().length > 0) {
      const { data: allAdminProducts, error } = await supabase
        .from('products')
        .select(ADMIN_PRODUCT_SELECT)
      if (error) throw error

      const scored = (allAdminProducts || [])
        .map((p) => ({
          product: p,
          score: scoreProduct(p as unknown as SearchCandidateProduct, search),
        }))
        .filter((item) => item.score > 0)
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score
          return new Date(b.product.created_at).getTime() - new Date(a.product.created_at).getTime()
        })

      const count = scored.length
      const paginatedData = scored.slice(offset, offset + limit).map((s) => s.product)
      return { data: paginatedData, count }
    }

    const { data, count, error } = await supabase
      .from('products')
      .select(ADMIN_PRODUCT_SELECT, { count: 'exact' })
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      p_collections: collectionIds as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      p_collections: collectionIds as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  /**
   * ADMIN: Mendapatkan daftar varian terpaginasi dengan filter pencarian dan status stok
   */
  async adminFindManyVariants(params: AdminFindVariantsParams = {}) {
    const supabase = await createServerClient()
    const {
      page = 1,
      limit = 20,
      search = '',
      stockFilter = 'all',
      statusFilter = 'all',
      sortBy = 'newest',
      market = 'ID',
    } = params
    const offset = (page - 1) * limit
    const stockCol = market === 'MY' ? 'stock_my' : 'stock'
    const priceCol = market === 'MY' ? 'price_myr' : 'price'

    let query = supabase.from('product_variants').select(
      `
        id, product_id, sku, name, price, compare_price, price_myr, compare_price_myr, stock, stock_my, is_active,
        products!inner (
          id, name, slug, is_active,
          categories (name)
        )
      `,
      { count: 'exact' }
    )

    if (search) {
      const escapedSearch = search
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_')
        .replace(/,/g, '\\,')

      const { data: matchedProducts } = await supabase
        .from('products')
        .select('id')
        .ilike('name', `%${escapedSearch}%`)

      const matchedProductIds = (matchedProducts || []).map((p) => p.id)

      if (matchedProductIds.length > 0) {
        query = query.or(
          `name.ilike.%${escapedSearch}%,sku.ilike.%${escapedSearch}%,product_id.in.(${matchedProductIds.join(',')})`
        )
      } else {
        query = query.or(`name.ilike.%${escapedSearch}%,sku.ilike.%${escapedSearch}%`)
      }
    }

    if (stockFilter === 'out_of_stock') {
      query = query.lte(stockCol, 0)
    } else if (stockFilter === 'low_stock') {
      query = query.gt(stockCol, 0).lte(stockCol, 5)
    } else if (stockFilter === 'in_stock') {
      query = query.gt(stockCol, 0)
    }

    if (statusFilter === 'active') {
      query = query.eq('is_active', true)
    } else if (statusFilter === 'inactive') {
      query = query.eq('is_active', false)
    }

    if (sortBy === 'name_asc') {
      query = query.order('name', { ascending: true })
    } else if (sortBy === 'price_asc') {
      query = query.order(priceCol, { ascending: true, nullsFirst: false })
    } else if (sortBy === 'price_desc') {
      query = query.order(priceCol, { ascending: false, nullsFirst: false })
    } else if (sortBy === 'stock_asc') {
      query = query.order(stockCol, { ascending: true })
    } else if (sortBy === 'stock_desc') {
      query = query.order(stockCol, { ascending: false })
    } else {
      query = query.order('id', { ascending: false })
    }

    const { data, count, error } = await query.range(offset, offset + limit - 1)
    if (error) throw error
    return { data, count }
  }

  /**
   * ADMIN: Update single variant price & stock (ID & MY)
   */
  async adminUpdateVariant(variantId: string, data: AdminVariantUpdateInput) {
    const supabase = await createServerClient()
    await updateSingleVariantWithNotifications(supabase, variantId, data)
    return true
  }

  /**
   * ADMIN: Batch update variant price & stock (ID & MY)
   */
  async adminBatchUpdateVariants(updates: AdminVariantBatchUpdateItem[]) {
    const supabase = await createServerClient()
    for (const item of updates) {
      await updateSingleVariantWithNotifications(supabase, item.variantId, item)
    }
    return true
  }
}

export const adminProductRepository = new AdminProductRepository()
