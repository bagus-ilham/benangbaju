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
  details?: string | null
): Promise<void> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      safeLogError('Failed to get user for activity log', userError)
      return // Silently fail if no user is found, to not break main operations
    }

    const { error } = await supabase.from('admin_activity_logs').insert({
      admin_id: user.id,
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
