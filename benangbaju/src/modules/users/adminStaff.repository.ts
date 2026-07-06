import { safeLogError } from '@/lib/logger'
import { insertAdminActivityLog } from '@/modules/admin-logs/services'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'
import { StaffProfile } from './types'
import { InternalError } from '@/lib/api-errors'

// 1. Get list of all admin and staff profiles
export async function adminGetStaffs(supabase: SupabaseClient<Database>): Promise<StaffProfile[]> {
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

// 2. Create staff via internal API (Server-side required for Service Role Key)
export async function adminCreateStaff(
  supabase: SupabaseClient<Database>,
  staffData: {
    name: string
    email: string
    password?: string
    role: 'admin' | 'staff'
  }
): Promise<{ success: boolean; data?: StaffProfile; error?: string }> {
  try {
    const response = await fetch('/api/admin/staff', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(staffData),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to create staff account')
    }

    if (result.data?.id) {
      await insertAdminActivityLog(
        supabase,
        'create',
        'staff',
        result.data.id,
        `Created staff account: ${result.data.name}`
      )
    }

    return { success: true, data: result.data }
  } catch (err: any) {
    safeLogError('Error creating staff via API:', err)
    return { success: false, error: err.message }
  }
}

// 3. Update staff details
export async function adminUpdateStaff(
  supabase: SupabaseClient<Database>,
  staffId: string,
  staffData: Partial<{
    name: string
    role: 'admin' | 'staff'
    is_active: boolean
  }>
): Promise<{ success: boolean; data?: StaffProfile; error?: Error }> {
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

  await insertAdminActivityLog(
    supabase,
    'update',
    'staff',
    staffId,
    `Updated staff profile ${data.name}`
  )

  return { success: true, data }
}

// 4. Soft Delete staff (Disable account)
export async function adminDeleteStaff(
  supabase: SupabaseClient<Database>,
  staffId: string
): Promise<{ success: boolean; error?: Error }> {
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

  await insertAdminActivityLog(
    supabase,
    'delete',
    'staff',
    staffId,
    `Soft-deleted (disabled) staff ${staffId}`
  )

  return { success: true }
}
