import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { safeLogError } from '@/lib/logger'

/**
 * Inserts a log entry into admin_activity_logs.
 * Automatically fetches the current admin's ID from the authenticated user.
 */
export async function insertAdminActivityLog(
  supabase: SupabaseClient<Database>,
  action: string,
  resourceType: string,
  resourceId?: string | null,
  details?: string | null,
  adminId?: string
): Promise<void> {
  try {
    let currentAdminId = adminId
    
    if (!currentAdminId) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session?.user) {
        safeLogError('Failed to get user for activity log', sessionError)
        return // Silently fail if no user is found
      }
      currentAdminId = session.user.id
    }

    const { error } = await supabase.from('admin_activity_logs').insert({
      admin_id: currentAdminId,
      action,
      resource_type: resourceType,
      resource_id: resourceId || null,
      old_data: null,
      new_data: { details },
      ip_address: null,
    })

    if (error) {
      safeLogError('Failed to insert admin activity log', error)
    }
  } catch (err) {
    safeLogError('Unexpected error in insertAdminActivityLog', err)
  }
}
