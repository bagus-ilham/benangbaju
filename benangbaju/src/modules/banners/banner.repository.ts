import { safeLogError } from '@/lib/logger'
import { adminLogRepository } from '@/modules/admin-logs/admin-log.repository'
import { createServerClient } from '@/lib/supabase/server'
import { createStaticClient } from '@/lib/supabase/static'
import { ApiListResponse, ApiResponse, ok, paginated, fail } from '@/lib/api-response'
import { ApiErrorCode } from '@/lib/api-errors'
import type { Banner } from './types'

export class BannerRepository {
  async getActiveBanners(page = 1, limit = 20): Promise<ApiListResponse<Banner>> {
    const supabase = createStaticClient()
    const now = new Date().toISOString()

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabase
      .from('banners')
      .select(
        'id, title, subtitle, image_url, image_mobile_url, link_url, position, sort_order, is_active, starts_at, ends_at, created_at',
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

  async adminGetBanners(page = 1, limit = 20): Promise<ApiListResponse<Banner>> {
    const supabase = await createServerClient()
    const from = (page - 1) * limit
    const to = from + limit - 1
    const { data, error, count } = await supabase
      .from('banners')
      .select(
        'id, title, subtitle, image_url, image_mobile_url, link_url, position, sort_order, is_active, starts_at, ends_at, created_at',
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

  async adminCreateBanner(bannerData: {
    title: string
    subtitle: string | null
    image_url: string
    image_mobile_url: string | null
    link_url: string | null
    position: string
    sort_order: number
    is_active: boolean
    starts_at: string | null
    ends_at: string | null
  }): Promise<ApiResponse<Banner>> {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('banners')
      .insert(bannerData)
      .select(
        'id, title, subtitle, image_url, image_mobile_url, link_url, position, sort_order, is_active, starts_at, ends_at, created_at'
      )
      .single()

    if (error) {
      safeLogError('Error creating banner:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal membuat banner')
    }

    await adminLogRepository.insertAdminActivityLog(
      supabase,
      'create',
      'banner',
      data.id,
      `Created banner ${bannerData.title || 'Untitled'}`
    )

    return ok(data)
  }

  async adminUpdateBanner(
    bannerId: string,
    bannerData: {
      title?: string
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
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('banners')
      .update(bannerData)
      .eq('id', bannerId)
      .select(
        'id, title, subtitle, image_url, image_mobile_url, link_url, position, sort_order, is_active, starts_at, ends_at, created_at'
      )
      .single()

    if (error) {
      safeLogError('Error updating banner:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memperbarui banner')
    }

    await adminLogRepository.insertAdminActivityLog(
      supabase,
      'update',
      'banner',
      bannerId,
      `Updated banner ${bannerData.title || 'Untitled'}`
    )

    return ok(data)
  }

  async adminDeleteBanner(bannerId: string): Promise<ApiResponse<void>> {
    const supabase = await createServerClient()
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

    await adminLogRepository.insertAdminActivityLog(
      supabase,
      'delete',
      'banner',
      bannerId,
      `Deleted banner ${bannerId}`
    )

    return ok()
  }
}

export const bannerRepository = new BannerRepository()
