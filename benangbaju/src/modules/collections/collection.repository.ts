import { safeLogError } from '@/lib/logger'
import { adminLogRepository } from '@/modules/admin-logs/admin-log.repository'
import { createServerClient } from '@/lib/supabase/server'
import { createStaticClient } from '@/lib/supabase/static'
import { ApiListResponse, ApiResponse, ok, paginated, fail } from '@/lib/api-response'
import { ApiErrorCode } from '@/lib/api-errors'
import type { Collection, AdminCollectionItem } from './types'

export class CollectionRepository {
  async getActiveCollections(page = 1, limit = 20): Promise<ApiListResponse<Collection>> {
    const supabase = createStaticClient()
    const now = new Date().toISOString()

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabase
      .from('collections')
      .select('id, name, slug, description, image_url, sort_order, is_active, starts_at, ends_at', {
        count: 'exact',
      })
      .eq('is_active', true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order('sort_order', { ascending: true })
      .range(from, to)

    if (error) {
      safeLogError('Error fetching collections:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengambil daftar koleksi')
    }

    return paginated(data || [], page, limit, count || 0)
  }

  async getCollectionBySlug(slug: string): Promise<ApiResponse<Collection | null>> {
    const supabase = createStaticClient()
    const { data, error } = await supabase
      .from('collections')
      .select('id, name, slug, description, image_url, sort_order, is_active, starts_at, ends_at')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error) {
      safeLogError(`Error fetching collection for slug ${slug}:`, error)
      return fail(ApiErrorCode.NOT_FOUND, 'Koleksi tidak ditemukan')
    }

    return ok(data)
  }

  async adminGetCollections(page = 1, limit = 20): Promise<ApiListResponse<AdminCollectionItem>> {
    const supabase = await createServerClient()
    const from = (page - 1) * limit
    const to = from + limit - 1
    const { data, error, count } = await supabase
      .from('collections')
      .select('*, collection_products(product_id)', { count: 'exact' })
      .order('sort_order', { ascending: true })
      .range(from, to)

    if (error) {
      safeLogError('Error in adminGetCollections:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengambil daftar koleksi')
    }

    if (!data) return paginated([], page, limit, count || 0)

    const list = data.map((col) => {
      const products = col.collection_products
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const product_ids = Array.isArray(products) ? products.map((cp: any) => cp.product_id) : []
      return {
        id: col.id,
        name: col.name,
        slug: col.slug,
        description: col.description,
        image_url: col.image_url,
        sort_order: col.sort_order,
        is_active: col.is_active,
        starts_at: col.starts_at,
        ends_at: col.ends_at,
        product_ids,
      }
    })

    return paginated(list, page, limit, count || 0)
  }

  async adminCreateCollection(
    collectionData: {
      name: string
      slug: string
      description: string | null
      image_url: string | null
      sort_order: number
      is_active: boolean
      starts_at: string | null
      ends_at: string | null
    },
    productIds: string[]
  ): Promise<ApiResponse<{ id: string }>> {
    const supabase = await createServerClient()
    const { data: col, error: colErr } = await supabase
      .from('collections')
      .insert(collectionData)
      .select('id')
      .single()

    if (colErr) {
      safeLogError('Error creating collection:', colErr)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal membuat koleksi')
    }
    const collectionId = col.id

    if (productIds && productIds.length > 0) {
      const junctionData = productIds.map((pid, idx) => ({
        collection_id: collectionId,
        product_id: pid,
        sort_order: idx,
      }))
      const { error: juncErr } = await supabase.from('collection_products').insert(junctionData)

      if (juncErr) {
        safeLogError('Error linking products to collection:', juncErr)
        return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal menghubungkan produk ke koleksi')
      }
    }

    await adminLogRepository.insertAdminActivityLog(
      supabase,
      'create',
      'collection',
      collectionId,
      `Created collection ${collectionData.name}`
    )

    return ok({ id: collectionId })
  }

  async adminUpdateCollection(
    collectionId: string,
    collectionData: {
      name: string
      slug: string
      description: string | null
      image_url: string | null
      sort_order: number
      is_active: boolean
      starts_at: string | null
      ends_at: string | null
    },
    productIds: string[]
  ): Promise<ApiResponse<{ id: string }>> {
    const supabase = await createServerClient()
    const { error: colErr } = await supabase
      .from('collections')
      .update(collectionData)
      .eq('id', collectionId)

    if (colErr) {
      safeLogError('Error updating collection:', colErr)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memperbarui koleksi')
    }

    // delete current links
    const { error: delErr } = await supabase
      .from('collection_products')
      .delete()
      .eq('collection_id', collectionId)

    if (delErr) {
      safeLogError('Error deleting collection products:', delErr)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memperbarui produk koleksi')
    }

    if (productIds && productIds.length > 0) {
      const junctionData = productIds.map((pid, idx) => ({
        collection_id: collectionId,
        product_id: pid,
        sort_order: idx,
      }))
      const { error: juncErr } = await supabase.from('collection_products').insert(junctionData)

      if (juncErr) {
        safeLogError('Error linking products to collection:', juncErr)
        return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal menghubungkan produk ke koleksi')
      }
    }

    await adminLogRepository.insertAdminActivityLog(
      supabase,
      'update',
      'collection',
      collectionId,
      `Updated collection ${collectionData.name}`
    )

    return ok({ id: collectionId })
  }

  async adminDeleteCollection(collectionId: string): Promise<ApiResponse<void>> {
    const supabase = await createServerClient()
    // 1. Fetch images associated with this collection to clean up storage
    const { data: collection } = await supabase
      .from('collections')
      .select('image_url')
      .eq('id', collectionId)
      .single()

    // 2. Delete the physical image from Supabase Storage
    if (collection && collection.image_url) {
      const { deleteImageByUrl } = await import('@/lib/supabase/storage')
      await deleteImageByUrl(supabase, collection.image_url, 'collections')
    }

    // 3. Delete collection record
    const { error } = await supabase.from('collections').delete().eq('id', collectionId)

    if (error) {
      safeLogError('Error deleting collection:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal menghapus koleksi')
    }

    await adminLogRepository.insertAdminActivityLog(
      supabase,
      'delete',
      'collection',
      collectionId,
      `Deleted collection ${collectionId}`
    )

    return ok()
  }
}

export const collectionRepository = new CollectionRepository()
