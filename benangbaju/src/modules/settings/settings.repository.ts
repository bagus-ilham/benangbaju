import type { SiteSetting } from './types'
import { safeLogError } from '@/lib/logger'
import { adminLogRepository } from '@/modules/admin-logs/admin-log.repository'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'
import { createServerClient } from '@/lib/supabase/server'
import { createStaticClient } from '@/lib/supabase/static'
import { ApiListResponse, ApiResponse, ok, paginated, fail } from '@/lib/api-response'
import { ApiErrorCode } from '@/lib/api-errors'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSiteSetting(row: any): SiteSetting {
  const typeMap: Record<string, SiteSetting['type']> = {
    text: 'text',
    json: 'json',
    boolean: 'boolean',
    image: 'image',
    number: 'number',
  }
  const groupMap: Record<string, SiteSetting['group']> = {
    general: 'general',
    seo: 'seo',
    payment: 'payment',
    social: 'social',
  }
  return {
    key: row.key,
    value: row.value,
    type: typeMap[row.type] || 'text',
    group: groupMap[row.group] || 'general',
    label: row.label,
  }
}

export class SettingsRepository {
  async adminGetSettings(): Promise<ApiListResponse<SiteSetting>> {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value, type, group, label')

    if (error) {
      safeLogError('Error fetching site settings:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengambil pengaturan')
    }

    const list = data ? data.map(mapSiteSetting) : []
    return paginated(list)
  }

  async adminUpdateSettings(settings: Record<string, string>): Promise<ApiResponse<void>> {
    const supabase = await createServerClient()
    // Fetch existing settings to preserve all required fields
    const res = await this.adminGetSettings()
    if (!res.success) return fail(ApiErrorCode.INTERNAL_ERROR, res.error.message)
    const currentSettings = res.data || []

    const settingsToUpsert = currentSettings
      .filter((s) => Object.prototype.hasOwnProperty.call(settings, s.key))
      .map((s) => ({
        key: s.key,
        value: settings[s.key],
        type: s.type,
        group: s.group,
        label: s.label,
      }))

    if (settingsToUpsert.length === 0) return ok()

    const { error } = await supabase
      .from('site_settings')
      .upsert(settingsToUpsert, { onConflict: 'key' })

    if (error) {
      safeLogError('Error updating site settings:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memperbarui pengaturan')
    }

    await adminLogRepository.insertAdminActivityLog(
      supabase,
      'update',
      'settings',
      'bulk',
      'Updated site settings'
    )
    return ok()
  }

  async adminUpsertSettings(settings: SiteSetting[]): Promise<ApiResponse<void>> {
    const supabase = await createServerClient()
    const { error } = await supabase.from('site_settings').upsert(settings, { onConflict: 'key' })

    if (error) {
      safeLogError('Error upserting settings:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal upsert pengaturan')
    }

    await adminLogRepository.insertAdminActivityLog(
      supabase,
      'update',
      'settings',
      'bulk',
      'Upserted site settings'
    )
    return ok()
  }

  async getSiteSettings(client?: SupabaseClient<Database>): Promise<ApiListResponse<SiteSetting>> {
    const supabase = client || createStaticClient()
    const { data, error } = await supabase
      .from('site_settings')
      .select('key, value, type, group, label')

    if (error) {
      safeLogError('Error fetching site settings:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengambil pengaturan')
    }

    const list = data ? data.map(mapSiteSetting) : []
    return paginated(list)
  }
}

export const settingsRepository = new SettingsRepository()
