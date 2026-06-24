import { safeLogError } from '@/lib/logger'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/database'

export interface UserNotification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  is_read: boolean
  data: Json | null
  created_at: string
}

// 1. Get user notifications
export async function getUserNotifications(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<UserNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, type, title, message, is_read, data, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    safeLogError('Error fetching user notifications:', error)
    return []
  }

  if (!data) return []

  return data.map(row => ({
    id: row.id,
    user_id: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    is_read: row.is_read,
    data: row.data,
    created_at: row.created_at,
  }))
}

// 2. Mark single notification as read
export async function markNotificationRead(
  supabase: SupabaseClient<Database>,
  notificationId: string,
  userId: string
): Promise<{ success: boolean; error: Error | null }> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', userId)

  if (error) {
    safeLogError('Error marking notification read:', error)
    return { success: false, error: new Error(error.message) }
  }

  return { success: true, error: null }
}

// 3. Mark all notifications as read
export async function markAllNotificationsRead(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ success: boolean; error: Error | null }> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false)

  if (error) {
    safeLogError('Error marking all notifications read:', error)
    return { success: false, error: new Error(error.message) }
  }

  return { success: true, error: null }
}
