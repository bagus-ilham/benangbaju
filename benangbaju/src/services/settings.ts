import { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/database'

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
  old_data: Json | null
  new_data: Json | null
  ip_address: string | null
  created_at: string
  profiles?: {
    name: string
    email: string | null
  } | null
}

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

export async function adminGetSettings(supabase: SupabaseClient<Database>): Promise<SiteSetting[]> {
  const { data, error } = await supabase
    .from('site_settings')
    .select('*')

  if (error) {
    console.error('Error fetching site settings:', error)
    throw error
  }

  if (!data) return []

  return data.map(mapSiteSetting)
}

export async function adminUpdateSettings(
  supabase: SupabaseClient<Database>,
  settings: Record<string, string>
): Promise<void> {
  // Fetch existing settings to preserve all required fields (type, group, label) for upsert
  const currentSettings = await adminGetSettings(supabase)

  const settingsToUpsert = currentSettings
    .filter((s) => Object.prototype.hasOwnProperty.call(settings, s.key))
    .map((s) => ({
      key: s.key,
      value: settings[s.key],
      type: s.type,
      group: s.group,
      label: s.label,
    }))

  if (settingsToUpsert.length === 0) return

  const { error } = await supabase
    .from('site_settings')
    .upsert(settingsToUpsert, { onConflict: 'key' })

  if (error) {
    console.error('Error updating site settings:', error)
    throw error
  }
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

  if (!data) return []

  return data.map(row => {
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

  return data.map(mapSiteSetting)
}
