import type { Collection, AdminCollectionItem } from './types'
import { safeLogError } from '@/lib/logger'
import { insertAdminActivityLog } from '@/modules/admin-logs/services'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'
import { ApiListResponse, ApiResponse, ok, paginated, fail } from '@/lib/api-response'
import { ApiErrorCode } from '@/lib/api-errors'

export async function getActiveCollections(
  supabase: SupabaseClient<Database>,
  page = 1,
  limit = 20
): Promise<ApiListResponse<Collection>> {
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

export async function getCollectionBySlug(
  supabase: SupabaseClient<Database>,
  slug: string
): Promise<ApiResponse<Collection | null>> {
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

export async function adminGetCollections(
  supabase: SupabaseClient<Database>,
  page = 1,
  limit = 20
): Promise<ApiListResponse<AdminCollectionItem>> {
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
    const product_ids = Array.isArray(products) ? products.map((cp) => cp.product_id) : []
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

export async function adminCreateCollection(
  supabase: SupabaseClient<Database>,
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

  await insertAdminActivityLog(
    supabase,
    'create',
    'collection',
    collectionId,
    `Created collection ${collectionData.name}`
  )

  return ok({ id: collectionId })
}

export async function adminUpdateCollection(
  supabase: SupabaseClient<Database>,
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

  await insertAdminActivityLog(
    supabase,
    'update',
    'collection',
    collectionId,
    `Updated collection ${collectionData.name}`
  )

  return ok({ id: collectionId })
}

export async function adminDeleteCollection(
  supabase: SupabaseClient<Database>,
  collectionId: string
): Promise<ApiResponse<void>> {
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

  await insertAdminActivityLog(
    supabase,
    'delete',
    'collection',
    collectionId,
    `Deleted collection ${collectionId}`
  )

  return ok()
}

export type { Collection }

export * from './types'
