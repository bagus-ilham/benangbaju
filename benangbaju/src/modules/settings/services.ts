import type { SiteSetting, ActivityLog } from './types'
import { safeLogError } from '@/lib/logger'
import { insertAdminActivityLog } from '@/modules/admin-logs/services'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'
import { ApiListResponse, ApiResponse, ok, paginated, fail } from '@/lib/api-response'
import { ApiErrorCode } from '@/lib/api-errors'

function mapSiteSetting(row: Database['public']['Tables']['site_settings']['Row']): SiteSetting {
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

export async function adminGetSettings(
  supabase: SupabaseClient<Database>
): Promise<ApiListResponse<SiteSetting>> {
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

export async function adminUpdateSettings(
  supabase: SupabaseClient<Database>,
  settings: Record<string, string>
): Promise<ApiResponse<void>> {
  // Fetch existing settings to preserve all required fields (type, group, label) for upsert
  const res = await adminGetSettings(supabase)
  if (!res.success) return fail(ApiErrorCode.INTERNAL_ERROR, res.error.message)
  const currentSettings = res.data

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

  await insertAdminActivityLog(supabase, 'update', 'settings', 'bulk', 'Updated site settings')
  return ok()
}

export async function adminGetActivityLogs(
  supabase: SupabaseClient<Database>,
  page = 1,
  limit = 100
): Promise<ApiListResponse<ActivityLog>> {
  const from = (page - 1) * limit
  const to = from + limit - 1
  const { data, error, count } = await supabase
    .from('admin_activity_logs')
    .select('*, profiles(name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    safeLogError('Error fetching admin activity logs:', error)
    return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengambil log aktivitas')
  }

  if (!data) return paginated([], page, limit, count || 0)

  const list = data.map((row) => {
    const rawProfiles = row.profiles
    let profiles: { name: string; email: string | null } | null = null
    if (rawProfiles && !Array.isArray(rawProfiles)) {
      profiles = {
        name: rawProfiles.name,
        email: rawProfiles.email,
      }
    }
    return {
      id: row.id,
      admin_id: row.admin_id,
      action: row.action,
      resource_type: row.resource_type,
      resource_id: row.resource_id,
      old_data: row.old_data,
      new_data: row.new_data,
      ip_address: row.ip_address,
      created_at: row.created_at,
      profiles,
    }
  })
  return paginated(list, page, limit, count || 0)
}

export async function adminUpsertSettings(
  supabase: SupabaseClient<Database>,
  settings: SiteSetting[]
): Promise<ApiResponse<void>> {
  const { error } = await supabase.from('site_settings').upsert(settings, { onConflict: 'key' })

  if (error) {
    safeLogError('Error upserting settings:', error)
    return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal upsert pengaturan')
  }

  await insertAdminActivityLog(supabase, 'update', 'settings', 'bulk', 'Upserted site settings')
  return ok()
}

export async function getSiteSettings(
  supabase: SupabaseClient<Database>
): Promise<ApiListResponse<SiteSetting>> {
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

export type { SiteSetting }

export * from './types'
