import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'
import { safeLogError } from '@/lib/logger'
import { createServerClient } from '@/lib/supabase/server'
import { ApiListResponse, paginated, fail } from '@/lib/api-response'
import { ApiErrorCode } from '@/lib/api-errors'
import { ActivityLog } from './types'

export class AdminLogRepository {
  /**
   * Inserts a log entry into admin_activity_logs.
   * Automatically fetches the current admin's ID from the authenticated user.
   */
  async insertAdminActivityLog(
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
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()
        if (userError || !user) {
          safeLogError('Failed to get user for activity log', userError)
          return // Silently fail if no user is found
        }
        currentAdminId = user.id
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

  async adminGetActivityLogs(page = 1, limit = 100): Promise<ApiListResponse<ActivityLog>> {
    const supabase = await createServerClient()
    const from = (page - 1) * limit
    const to = from + limit - 1
    const { data, error, count } = await supabase
      .from('admin_activity_logs')
      .select('*, profiles(name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      safeLogError('Error fetching admin activity logs:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengambil log aktivitas')
    }

    if (!data) return paginated([], page, limit, count || 0)

    const list = data.map((row) => {
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
    return paginated(list, page, limit, count || 0)
  }
}

export const adminLogRepository = new AdminLogRepository()
