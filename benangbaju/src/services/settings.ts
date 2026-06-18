import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export interface SiteSetting {
  key: string
  value: string
  type: 'text' | 'json' | 'boolean' | 'image' | 'number'
  group: 'general' | 'seo' | 'payment' | 'social'
  label: string
}

export interface ActivityLog {
  id: string
  admin_id: string
  action: string
  resource_type: string
  resource_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
  profiles?: {
    name: string
    email: string
  } | null
}

export async function adminGetSettings(supabase: SupabaseClient<Database>): Promise<SiteSetting[]> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')

  if (error) {
    console.error('Error fetching site settings:', error)
    throw error
  }

  return data as SiteSetting[]
}

export async function adminUpdateSettings(
  supabase: SupabaseClient<Database>,
  settings: Record<string, string>
): Promise<void> {
  const updates = Object.entries(settings).map(([key, value]) => ({
    key,
    value,
  }))

  await Promise.all(
    updates.map(async (update) => {
      const { error } = await supabase
        .from('site_settings')
        .update({ value: update.value })
        .eq('key', update.key)

      if (error) {
        console.error(`Error updating setting ${update.key}:`, error)
        throw error
      }
    })
  )
}

export async function adminGetActivityLogs(supabase: SupabaseClient<Database>): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('admin_activity_logs')
    .select('*, profiles(name, email)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching admin activity logs:', error)
    throw error
  }

  return data as unknown as ActivityLog[]
}

export async function adminUpsertSettings(
  supabase: SupabaseClient<Database>,
  settings: SiteSetting[]
): Promise<void> {
  const { error } = await supabase
    .from('site_settings')
    .upsert(settings, { onConflict: 'key' })

  if (error) {
    console.error('Error upserting settings:', error)
    throw error
  }
}

export async function getSiteSettings(
  supabase: SupabaseClient<Database>
): Promise<SiteSetting[]> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')

  if (error) {
    console.error('Error fetching site settings:', error)
    return []
  }

  return data as SiteSetting[]
}

