import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'
import { SettingService } from '@/features/core/application/setting.service'
import * as types from '@/features/core/domain/setting.types'

export type { SiteSetting, ActivityLog } from '@/features/core/domain/setting.types'

export async function adminGetSettings(supabase: SupabaseClient<Database>) {
  return new SettingService(supabase).adminGetSettings()
}

export async function adminUpdateSettings(
  supabase: SupabaseClient<Database>,
  settings: Record<string, string>
) {
  return new SettingService(supabase).adminUpdateSettings(settings)
}

export async function adminGetActivityLogs(
  supabase: SupabaseClient<Database>,
  page = 1,
  limit = 100
) {
  return new SettingService(supabase).adminGetActivityLogs(page, limit)
}

export async function adminUpsertSettings(
  supabase: SupabaseClient<Database>,
  settings: types.SiteSetting[]
) {
  return new SettingService(supabase).adminUpsertSettings(settings)
}

export async function getSiteSettings(supabase: SupabaseClient<Database>) {
  return new SettingService(supabase).getSiteSettings()
}
