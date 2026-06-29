import { safeLogError } from '@/lib/logger'
import { insertAdminActivityLog } from '@/services/adminLogs'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { CustomerProfile } from "../domain/adminCustomer.types";

// 1. Get list of all customer profiles
export async function adminGetCustomers(
  supabase: SupabaseClient<Database>
): Promise<CustomerProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, phone, avatar_url, role, is_active, created_at, updated_at')
    .neq('role', 'admin')
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) {
    safeLogError('Error fetching admin customers:', error)
    throw error
  }

  if (!data) return []

  return data.map(row => ({
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

// 2. Toggle customer activation status (Block / Unblock)
export async function adminToggleCustomerStatus(
  supabase: SupabaseClient<Database>,
  customerId: string,
  isActive: boolean
): Promise<{ success: boolean; error: Error | null }> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', customerId)
    .neq('role', 'admin') // Security guard: only toggle non-admin role profiles

  if (error) {
    safeLogError('Error toggling customer status:', error)
    return { success: false, error: new Error('Gagal mengubah status pelanggan.') }
  }

  await insertAdminActivityLog(supabase, 'update', 'customer', customerId, `Toggled customer ${customerId} status to ${isActive}`)

  return { success: true, error: null }
}
