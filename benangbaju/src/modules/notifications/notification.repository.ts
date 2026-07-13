import { safeLogError } from '@/lib/logger'
import { adminLogRepository } from '@/modules/admin-logs/admin-log.repository'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Database } from '@/shared/types/database'
import { createServerClient } from '@/lib/supabase/server'
import { ApiListResponse, ApiResponse, ok, paginated, fail } from '@/lib/api-response'
import { ApiErrorCode, InternalError } from '@/lib/api-errors'
import type { UserNotification } from './types'
import { NotificationTemplate } from './template.types'

export class NotificationRepository {
  // =============================================================
  // USER NOTIFICATIONS
  // =============================================================

  async getUserNotifications(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<ApiListResponse<UserNotification>> {
    const supabase = await createServerClient()
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabase
      .from('notifications')
      .select('id, user_id, type, title, message, is_read, data, created_at', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      safeLogError('Error fetching user notifications:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengambil data notifikasi')
    }

    if (!data) return paginated([], page, limit, count || 0)

    const notifications = data.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      is_read: row.is_read,
      data: row.data,
      created_at: row.created_at,
    }))

    return paginated(notifications, page, limit, count || 0)
  }

  async markNotificationRead(notificationId: string, userId: string): Promise<ApiResponse<void>> {
    const supabase = await createServerClient()
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId)

    if (error) {
      safeLogError('Error marking notification read:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal menandai notifikasi telah dibaca')
    }

    return ok()
  }

  async markAllNotificationsRead(userId: string): Promise<ApiResponse<void>> {
    const supabase = await createServerClient()
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) {
      safeLogError('Error marking all notifications read:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal menandai semua notifikasi telah dibaca')
    }

    return ok()
  }

  // =============================================================
  // TEMPLATES CRUD
  // =============================================================

  async adminGetNotificationTemplates(): Promise<NotificationTemplate[]> {
    const supabase = await createServerClient()
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

  async adminCreateNotificationTemplate(templateData: {
    name: string
    subject: string
    html_body: string
    is_active: boolean
  }): Promise<NotificationTemplate> {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('notification_templates')
      .insert([templateData])
      .select('*')
      .single()

    if (error) {
      safeLogError('Error creating notification template:', error)
      throw new InternalError('Gagal membuat template notifikasi')
    }

    await adminLogRepository.insertAdminActivityLog(
      supabase,
      'create',
      'notification_template',
      data.id,
      `Created notification template: ${data.name}`
    )

    return data
  }

  async adminUpdateNotificationTemplate(
    templateId: string,
    templateData: Partial<{
      name: string
      subject: string
      html_body: string
      is_active: boolean
    }>
  ): Promise<NotificationTemplate> {
    const supabase = await createServerClient()
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

    await adminLogRepository.insertAdminActivityLog(
      supabase,
      'update',
      'notification_template',
      templateId,
      `Updated notification template: ${data.name}`
    )

    return data
  }

  async adminDeleteNotificationTemplate(templateId: string): Promise<{ success: boolean }> {
    const supabase = await createServerClient()
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

    await adminLogRepository.insertAdminActivityLog(
      supabase,
      'delete',
      'notification_template',
      templateId,
      `Deleted notification template: ${template?.name || templateId}`
    )

    return { success: true }
  }
}

export const notificationRepository = new NotificationRepository()
