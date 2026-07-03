'use server'

import { requireAdmin } from '@/lib/auth-guard'

export async function getAdminCustomersAction(page = 1, limit = 20) {
  await requireAdmin()
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const { adminGetCustomers } =
    await import('@/features/users/infrastructure/adminCustomer.repository')

  const supabaseAdmin = createAdminClient()
  return adminGetCustomers(supabaseAdmin, page, limit)
}

export async function toggleAdminCustomerStatusAction(customerId: string, isActive: boolean) {
  await requireAdmin()
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const { adminToggleCustomerStatus } =
    await import('@/features/users/infrastructure/adminCustomer.repository')

  const supabaseAdmin = createAdminClient()
  return adminToggleCustomerStatus(supabaseAdmin, customerId, isActive)
}

export async function getAdminCustomerDetailAction(customerId: string) {
  await requireAdmin()
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const { adminGetCustomerDetail } =
    await import('@/features/users/infrastructure/adminCustomer.repository')

  const supabaseAdmin = createAdminClient()
  return adminGetCustomerDetail(supabaseAdmin, customerId)
}
