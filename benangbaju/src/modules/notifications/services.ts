import type { UserNotification } from './types'
import { safeLogError } from '@/lib/logger'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'
import { ApiListResponse, ApiResponse, ok, paginated, fail } from '@/lib/api-response'
import { ApiErrorCode } from '@/lib/api-errors'

// 1. Get user notifications
export async function getUserNotifications(
  supabase: SupabaseClient<Database>,
  userId: string,
  page = 1,
  limit = 20
): Promise<ApiListResponse<UserNotification>> {
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

// 2. Mark single notification as read
export async function markNotificationRead(
  supabase: SupabaseClient<Database>,
  notificationId: string,
  userId: string
): Promise<ApiResponse<void>> {
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

// 3. Mark all notifications as read
export async function markAllNotificationsRead(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<ApiResponse<void>> {
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

export * from './types'
