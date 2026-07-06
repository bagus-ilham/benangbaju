import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'
import * as repo from './adminCustomer.repository'

export class AdminCustomerService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async adminGetCustomers(page = 1, limit = 20) {
    return repo.adminGetCustomers(this.supabase, page, limit)
  }

  async adminToggleCustomerStatus(customerId: string, isActive: boolean) {
    return repo.adminToggleCustomerStatus(this.supabase, customerId, isActive)
  }

  async adminGetCustomerDetail(customerId: string) {
    return repo.adminGetCustomerDetail(this.supabase, customerId)
  }
}
