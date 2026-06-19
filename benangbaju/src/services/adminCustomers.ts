import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export interface CustomerProfile {
  id: string
  name: string
  email: string | null
  phone: string | null
  avatar_url: string | null
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// 1. Get list of all customer profiles
export async function adminGetCustomers(
  supabase: SupabaseClient<Database>
): Promise<CustomerProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'customer')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching admin customers:', error)
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
    .eq('role', 'customer') // Security guard: only toggle customer role profiles

  if (error) {
    console.error('Error toggling customer status:', error)
    return { success: false, error: new Error(error.message) }
  }

  return { success: true, error: null }
}
