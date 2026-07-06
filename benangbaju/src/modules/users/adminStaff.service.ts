import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'
import * as repo from './adminStaff.repository'

export class AdminStaffService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async adminGetStaffs() {
    return repo.adminGetStaffs(this.supabase)
  }

  async adminCreateStaff(staffData: {
    name: string
    email: string
    password?: string
    role: 'admin' | 'staff'
  }) {
    return repo.adminCreateStaff(this.supabase, staffData)
  }

  async adminUpdateStaff(
    staffId: string,
    staffData: Partial<{
      name: string
      role: 'admin' | 'staff'
      is_active: boolean
    }>
  ) {
    return repo.adminUpdateStaff(this.supabase, staffId, staffData)
  }

  async adminDeleteStaff(staffId: string) {
    return repo.adminDeleteStaff(this.supabase, staffId)
  }
}
