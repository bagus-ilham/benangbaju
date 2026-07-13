import { safeLogError } from '@/lib/logger'
import { adminLogRepository } from '@/modules/admin-logs/admin-log.repository'
import { createAdminClient } from '@/lib/supabase/admin'
import { StaffProfile } from './types'
import { InternalError } from '@/lib/api-errors'

export class AdminStaffRepository {
  async adminGetStaffs(): Promise<StaffProfile[]> {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, phone, avatar_url, role, is_active, created_at, updated_at')
      .in('role', ['admin', 'staff'])
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) {
      safeLogError('Error fetching admin staffs:', error)
      throw new InternalError('Gagal memuat daftar staf')
    }

    if (!data) return []

    return data.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      avatar_url: row.avatar_url,
      role: row.role,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }))
  }

  async adminCreateStaff(staffData: {
    name: string
    email: string
    password?: string
    role: 'admin' | 'staff'
  }): Promise<{ success: boolean; data?: StaffProfile; error?: string }> {
    try {
      const supabaseAdmin = createAdminClient()

      // 1. Create auth user securely on the server
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: staffData.email,
        password: staffData.password,
        email_confirm: true,
        user_metadata: {
          name: staffData.name,
          role: staffData.role,
        },
      })

      if (authError) {
        safeLogError('Staff creation auth error:', authError)
        return {
          success: false,
          error: 'Failed to create staff account. Please check the email and try again.',
        }
      }

      const newUserId = authData.user.id

      // Wait a moment for trigger to create profile (if a trigger exists)
      await new Promise((resolve) => setTimeout(resolve, 500))

      // 2. Update/upsert profile
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert(
          {
            id: newUserId,
            email: staffData.email,
            name: staffData.name,
            role: staffData.role,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        .select('id, name, email, phone, avatar_url, role, is_active, created_at, updated_at')
        .single()

      if (profileError) {
        safeLogError('Error updating user profile after creation:', profileError)
        return { success: false, error: 'Failed to update user profile' }
      }

      await adminLogRepository.insertAdminActivityLog(
        supabaseAdmin,
        'create',
        'staff',
        newUserId,
        `Created staff account: ${staffData.name}`
      )

      return { success: true, data: profileData }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      safeLogError('Error creating staff:', err)
      return { success: false, error: err.message }
    }
  }

  async adminUpdateStaff(
    staffId: string,
    staffData: Partial<{
      name: string
      role: 'admin' | 'staff'
      is_active: boolean
    }>
  ): Promise<{ success: boolean; data?: StaffProfile; error?: Error }> {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...staffData, updated_at: new Date().toISOString() })
      .eq('id', staffId)
      .in('role', ['admin', 'staff'])
      .select('id, name, email, phone, avatar_url, role, is_active, created_at, updated_at')
      .single()

    if (error) {
      safeLogError('Error updating staff profile:', error)
      return { success: false, error: new Error('Gagal memperbarui profil staf.') }
    }

    await adminLogRepository.insertAdminActivityLog(
      supabase,
      'update',
      'staff',
      staffId,
      `Updated staff profile ${data.name}`
    )

    return { success: true, data }
  }

  async adminDeleteStaff(staffId: string): Promise<{ success: boolean; error?: Error }> {
    const supabase = createAdminClient()
    // We use soft delete to preserve activity logs and relations
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', staffId)
      .in('role', ['admin', 'staff'])

    if (error) {
      safeLogError('Error soft-deleting staff profile:', error)
      return { success: false, error: new Error('Gagal menonaktifkan akun staf.') }
    }

    await adminLogRepository.insertAdminActivityLog(
      supabase,
      'delete',
      'staff',
      staffId,
      `Soft-deleted (disabled) staff ${staffId}`
    )

    return { success: true }
  }
}

export const adminStaffRepository = new AdminStaffRepository()
