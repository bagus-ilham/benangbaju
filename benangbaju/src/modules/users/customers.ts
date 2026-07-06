import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'
import { AdminCustomerService } from '@/modules/users/adminCustomer.service'

export type { CustomerProfile, CustomerDetail } from '@/modules/users/adminCustomer.types'

export async function adminGetCustomers(supabase: SupabaseClient<Database>, page = 1, limit = 20) {
  return new AdminCustomerService(supabase).adminGetCustomers(page, limit)
}

export async function adminToggleCustomerStatus(
  supabase: SupabaseClient<Database>,
  customerId: string,
  isActive: boolean
) {
  return new AdminCustomerService(supabase).adminToggleCustomerStatus(customerId, isActive)
}

export async function adminGetCustomerDetail(
  supabase: SupabaseClient<Database>,
  customerId: string
) {
  return new AdminCustomerService(supabase).adminGetCustomerDetail(customerId)
}
