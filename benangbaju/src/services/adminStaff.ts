import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { AdminStaffService } from "@/modules/adminStaff/application/adminStaff.service";
import * as types from "@/modules/adminStaff/domain/adminStaff.types";

export type { StaffProfile } from "@/modules/adminStaff/domain/adminStaff.types";

export async function adminGetStaffs(supabase: SupabaseClient<Database>) {
    return new AdminStaffService(supabase).adminGetStaffs();
}

export async function adminCreateStaff(supabase: SupabaseClient<Database>, staffData: {
        name: string
        email: string
        password?: string
        role: 'admin' | 'staff'
      }) {
    return new AdminStaffService(supabase).adminCreateStaff(staffData);
}

export async function adminUpdateStaff(supabase: SupabaseClient<Database>, staffId: string, staffData: Partial<{
        name: string
        role: 'admin' | 'staff'
        is_active: boolean
      }>) {
    return new AdminStaffService(supabase).adminUpdateStaff(staffId, staffData);
}

export async function adminDeleteStaff(supabase: SupabaseClient<Database>, staffId: string) {
    return new AdminStaffService(supabase).adminDeleteStaff(staffId);
}
