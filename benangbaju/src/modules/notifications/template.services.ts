import { safeLogError } from '@/lib/logger'
import { insertAdminActivityLog } from '@/modules/admin-logs/services'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'
import { NotificationTemplate } from './template.types'
import { InternalError } from '@/lib/api-errors'

export async function adminGetNotificationTemplates(
  supabase: SupabaseClient<Database>
): Promise<NotificationTemplate[]> {
  const { data, error } = await supabase
    .from('notification_templates')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    safeLogError('Error fetching notification templates:', error)
    throw new InternalError('Gagal memuat template notifikasi')
  }

  return data || []
}

export async function adminCreateNotificationTemplate(
  supabase: SupabaseClient<Database>,
  templateData: {
    name: string
    subject: string
    html_body: string
    is_active: boolean
  }
): Promise<NotificationTemplate> {
  const { data, error } = await supabase
    .from('notification_templates')
    .insert([templateData])
    .select('*')
    .single()

  if (error) {
    safeLogError('Error creating notification template:', error)
    throw new InternalError('Gagal membuat template notifikasi')
  }

  await insertAdminActivityLog(
    supabase,
    'create',
    'notification_template',
    data.id,
    `Created notification template: ${data.name}`
  )

  return data
}

export async function adminUpdateNotificationTemplate(
  supabase: SupabaseClient<Database>,
  templateId: string,
  templateData: Partial<{
    name: string
    subject: string
    html_body: string
    is_active: boolean
  }>
): Promise<NotificationTemplate> {
  const { data, error } = await supabase
    .from('notification_templates')
    .update({ ...templateData, updated_at: new Date().toISOString() })
    .eq('id', templateId)
    .select('*')
    .single()

  if (error) {
    safeLogError('Error updating notification template:', error)
    throw new InternalError('Gagal memperbarui template notifikasi')
  }

  await insertAdminActivityLog(
    supabase,
    'update',
    'notification_template',
    templateId,
    `Updated notification template: ${data.name}`
  )

  return data
}

export async function adminDeleteNotificationTemplate(
  supabase: SupabaseClient<Database>,
  templateId: string
): Promise<{ success: boolean }> {
  // First, fetch the name for logging
  const { data: template } = await supabase
    .from('notification_templates')
    .select('name')
    .eq('id', templateId)
    .single()

  const { error } = await supabase.from('notification_templates').delete().eq('id', templateId)

  if (error) {
    safeLogError('Error deleting notification template:', error)
    throw new InternalError('Gagal menghapus template notifikasi')
  }

  await insertAdminActivityLog(
    supabase,
    'delete',
    'notification_template',
    templateId,
    `Deleted notification template: ${template?.name || templateId}`
  )

  return { success: true }
}
