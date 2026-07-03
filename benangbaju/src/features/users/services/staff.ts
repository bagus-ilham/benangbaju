import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'
import { AdminStaffService } from '@/features/users/application/adminStaff.service'

export type { StaffProfile } from '@/features/users/domain/adminStaff.types'

export async function adminGetStaffs(supabase: SupabaseClient<Database>) {
  return new AdminStaffService(supabase).adminGetStaffs()
}

export async function adminCreateStaff(
  supabase: SupabaseClient<Database>,
  staffData: {
    name: string
    email: string
    password?: string
    role: 'admin' | 'staff'
  }
) {
  return new AdminStaffService(supabase).adminCreateStaff(staffData)
}

export async function adminUpdateStaff(
  supabase: SupabaseClient<Database>,
  staffId: string,
  staffData: Partial<{
    name: string
    role: 'admin' | 'staff'
    is_active: boolean
  }>
) {
  return new AdminStaffService(supabase).adminUpdateStaff(staffId, staffData)
}

export async function adminDeleteStaff(supabase: SupabaseClient<Database>, staffId: string) {
  return new AdminStaffService(supabase).adminDeleteStaff(staffId)
}
