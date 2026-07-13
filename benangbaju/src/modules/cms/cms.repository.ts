import type { RedirectRule, LandingPage } from './types'
import { safeLogError } from '@/lib/logger'
import { adminLogRepository } from '@/modules/admin-logs/admin-log.repository'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Database } from '@/shared/types/database'
import { createServerClient } from '@/lib/supabase/server'
import { ApiListResponse, ApiResponse, ok, paginated, fail } from '@/lib/api-response'
import { ApiErrorCode } from '@/lib/api-errors'

export class CmsRepository {
  // =============================================================
  // REDIRECTS CRUD
  // =============================================================

  async adminGetRedirects(page = 1, limit = 20): Promise<ApiListResponse<RedirectRule>> {
    const supabase = await createServerClient()
    const from = (page - 1) * limit
    const to = from + limit - 1
    const { data, error, count } = await supabase
      .from('redirects')
      .select('id, from_path, to_path, status_code, is_active, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      safeLogError('Error fetching redirects:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengambil data redirects')
    }

    if (!data) return paginated([], page, limit, count || 0)
    const list = data.map((row) => ({
      id: row.id,
      from_path: row.from_path,
      to_path: row.to_path,
      status_code: row.status_code,
      is_active: row.is_active,
      created_at: row.created_at,
    }))

    return paginated(list, page, limit, count || 0)
  }

  async adminCreateRedirect(
    redirect: Omit<RedirectRule, 'id' | 'created_at'>
  ): Promise<ApiResponse<RedirectRule>> {
    const supabase = await createServerClient()
    const { data, error } = await supabase.from('redirects').insert([redirect]).select().single()

    if (error) {
      safeLogError('Error creating redirect:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal membuat redirect')
    }

    const result = {
      id: data.id,
      from_path: data.from_path,
      to_path: data.to_path,
      status_code: data.status_code,
      is_active: data.is_active,
      created_at: data.created_at,
    }

    await adminLogRepository.insertAdminActivityLog(
      supabase,
      'create',
      'redirect',
      data.id,
      `Created redirect from ${data.from_path}`
    )

    return ok(result)
  }

  async adminUpdateRedirect(
    redirectId: string,
    redirect: Partial<Omit<RedirectRule, 'id' | 'created_at'>>
  ): Promise<ApiResponse<void>> {
    const supabase = await createServerClient()
    const { error } = await supabase.from('redirects').update(redirect).eq('id', redirectId)

    if (error) {
      safeLogError('Error updating redirect:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memperbarui redirect')
    }

    await adminLogRepository.insertAdminActivityLog(
      supabase,
      'update',
      'redirect',
      redirectId,
      `Updated redirect ${redirectId}`
    )
    return ok()
  }

  async adminDeleteRedirect(redirectId: string): Promise<ApiResponse<void>> {
    const supabase = await createServerClient()
    const { error } = await supabase.from('redirects').delete().eq('id', redirectId)

    if (error) {
      safeLogError('Error deleting redirect:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal menghapus redirect')
    }

    await adminLogRepository.insertAdminActivityLog(
      supabase,
      'delete',
      'redirect',
      redirectId,
      `Deleted redirect ${redirectId}`
    )
    return ok()
  }

  // =============================================================
  // LANDING PAGES CRUD
  // =============================================================

  async adminGetLandingPages(page = 1, limit = 20): Promise<ApiListResponse<LandingPage>> {
    const supabase = await createServerClient()
    const from = (page - 1) * limit
    const to = from + limit - 1
    const { data, error, count } = await supabase
      .from('landing_pages')
      .select(
        'id, slug, title, content, meta_title, meta_description, is_active, created_at, updated_at',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      safeLogError('Error fetching landing pages:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengambil data landing pages')
    }

    if (!data) return paginated([], page, limit, count || 0)
    const list = data.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      content: row.content,
      meta_title: row.meta_title,
      meta_description: row.meta_description,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }))

    return paginated(list, page, limit, count || 0)
  }

  async adminCreateLandingPage(
    landingPage: Omit<LandingPage, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ApiResponse<LandingPage>> {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('landing_pages')
      .insert([landingPage])
      .select()
      .single()

    if (error) {
      safeLogError('Error creating landing page:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal membuat landing page')
    }

    const result = {
      id: data.id,
      slug: data.slug,
      title: data.title,
      content: data.content,
      meta_title: data.meta_title,
      meta_description: data.meta_description,
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at,
    }

    await adminLogRepository.insertAdminActivityLog(
      supabase,
      'create',
      'landing_page',
      data.id,
      `Created landing page ${data.slug}`
    )

    return ok(result)
  }

  async adminUpdateLandingPage(
    landingPageId: string,
    landingPage: Partial<Omit<LandingPage, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<ApiResponse<void>> {
    const supabase = await createServerClient()
    const { error } = await supabase
      .from('landing_pages')
      .update(landingPage)
      .eq('id', landingPageId)

    if (error) {
      safeLogError('Error updating landing page:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memperbarui landing page')
    }

    await adminLogRepository.insertAdminActivityLog(
      supabase,
      'update',
      'landing_page',
      landingPageId,
      `Updated landing page ${landingPageId}`
    )
    return ok()
  }

  async adminDeleteLandingPage(landingPageId: string): Promise<ApiResponse<void>> {
    const supabase = await createServerClient()
    const { error } = await supabase.from('landing_pages').delete().eq('id', landingPageId)

    if (error) {
      safeLogError('Error deleting landing page:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal menghapus landing page')
    }

    await adminLogRepository.insertAdminActivityLog(
      supabase,
      'delete',
      'landing_page',
      landingPageId,
      `Deleted landing page ${landingPageId}`
    )
    return ok()
  }
}

export const cmsRepository = new CmsRepository()
