import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export interface UserNotification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  is_read: boolean
  data: Record<string, unknown> | null
  created_at: string
}

// 1. Get user notifications
export async function getUserNotifications(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<UserNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user notifications:', error)
    return []
  }

  return (data || []) as UserNotification[]
}

// 2. Mark single notification as read
export async function markNotificationRead(
  supabase: SupabaseClient<Database>,
  notificationId: string
): Promise<{ success: boolean; error: Error | null }> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)

  if (error) {
    console.error('Error marking notification read:', error)
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
    console.error('Error marking all notifications read:', error)
    return { success: false, error: new Error(error.message) }
  }

  return { success: true, error: null }
}
