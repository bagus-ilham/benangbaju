import { safeLogError } from '@/lib/logger'
import { insertAdminActivityLog } from '@/entities/adminLog/api/adminLogs'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'
import { Banner } from '../domain/banner.types'
import { ApiListResponse, ApiResponse, ok, paginated, fail } from '@/lib/api-response'
import { ApiErrorCode } from '@/lib/api-errors'

export async function getActiveBanners(
  supabase: SupabaseClient<Database>,
  page = 1,
  limit = 20
): Promise<ApiListResponse<Banner>> {
  const now = new Date().toISOString()

  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await supabase
    .from('banners')
    .select(
      'id, title, subtitle, image_url, image_mobile_url, link_url, position, sort_order, is_active, starts_at, ends_at',
      { count: 'exact' }
    )
    .eq('is_active', true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .order('sort_order', { ascending: true })
    .range(from, to)

  if (error) {
    safeLogError('Error fetching banners:', error)
    return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengambil banner')
  }

  return paginated(data || [], page, limit, count || 0)
}

export async function adminGetBanners(
  supabase: SupabaseClient<Database>,
  page = 1,
  limit = 20
): Promise<ApiListResponse<Banner>> {
  const from = (page - 1) * limit
  const to = from + limit - 1
  const { data, error, count } = await supabase
    .from('banners')
    .select(
      'id, title, subtitle, image_url, image_mobile_url, link_url, position, sort_order, is_active, starts_at, ends_at',
      { count: 'exact' }
    )
    .order('sort_order', { ascending: true })
    .range(from, to)

  if (error) {
    safeLogError('Error fetching admin banners:', error)
    return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengambil banner admin')
  }

  return paginated(data || [], page, limit, count || 0)
}

export async function adminCreateBanner(
  supabase: SupabaseClient<Database>,
  bannerData: {
    title: string | null
    subtitle: string | null
    image_url: string
    image_mobile_url: string | null
    link_url: string | null
    position: string
    sort_order: number
    is_active: boolean
    starts_at: string | null
    ends_at: string | null
  }
): Promise<ApiResponse<Banner>> {
  const { data, error } = await supabase
    .from('banners')
    .insert(bannerData)
    .select(
      'id, title, subtitle, image_url, image_mobile_url, link_url, position, sort_order, is_active, starts_at, ends_at'
    )
    .single()

  if (error) {
    safeLogError('Error creating banner:', error)
    return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal membuat banner')
  }

  await insertAdminActivityLog(
    supabase,
    'create',
    'banner',
    data.id,
    `Created banner ${bannerData.title || 'Untitled'}`
  )

  return ok(data)
}

export async function adminUpdateBanner(
  supabase: SupabaseClient<Database>,
  bannerId: string,
  bannerData: {
    title: string | null
    subtitle: string | null
    image_url: string
    image_mobile_url: string | null
    link_url: string | null
    position: string
    sort_order: number
    is_active: boolean
    starts_at: string | null
    ends_at: string | null
  }
): Promise<ApiResponse<Banner>> {
  const { data, error } = await supabase
    .from('banners')
    .update(bannerData)
    .eq('id', bannerId)
    .select(
      'id, title, subtitle, image_url, image_mobile_url, link_url, position, sort_order, is_active, starts_at, ends_at'
    )
    .single()

  if (error) {
    safeLogError('Error updating banner:', error)
    return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memperbarui banner')
  }

  await insertAdminActivityLog(
    supabase,
    'update',
    'banner',
    bannerId,
    `Updated banner ${bannerData.title || 'Untitled'}`
  )

  return ok(data)
}

export async function adminDeleteBanner(
  supabase: SupabaseClient<Database>,
  bannerId: string
): Promise<ApiResponse<void>> {
  // 1. Fetch images associated with this banner to clean up storage
  const { data: banner } = await supabase
    .from('banners')
    .select('image_url, image_mobile_url')
    .eq('id', bannerId)
    .single()

  // 2. Delete the physical images from Supabase Storage
  if (banner) {
    const { deleteImageByUrl } = await import('@/lib/supabase/storage')
    const cleanupPromises = []
    if (banner.image_url)
      cleanupPromises.push(deleteImageByUrl(supabase, banner.image_url, 'banners'))
    if (banner.image_mobile_url)
      cleanupPromises.push(deleteImageByUrl(supabase, banner.image_mobile_url, 'banners'))
    if (cleanupPromises.length > 0) {
      await Promise.all(cleanupPromises)
    }
  }

  // 3. Delete banner record
  const { error } = await supabase.from('banners').delete().eq('id', bannerId)

  if (error) {
    safeLogError('Error deleting banner:', error)
    return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal menghapus banner')
  }

  await insertAdminActivityLog(supabase, 'delete', 'banner', bannerId, `Deleted banner ${bannerId}`)

  return ok()
}
