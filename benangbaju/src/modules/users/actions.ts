'use server'

import { requireAdmin } from '@/lib/auth-guard'
import { adminCustomerService } from './adminCustomer.service'
import { adminStaffService } from './adminStaff.service'
import { CreateStaffPayload } from './types'

export async function getAdminCustomersAction(page = 1, limit = 20) {
  await requireAdmin()
  return adminCustomerService.adminGetCustomers(page, limit)
}

export async function toggleAdminCustomerStatusAction(customerId: string, isActive: boolean) {
  await requireAdmin()
  return adminCustomerService.adminToggleCustomerStatus(customerId, isActive)
}

export async function getAdminCustomerDetailAction(customerId: string) {
  await requireAdmin()
  return adminCustomerService.adminGetCustomerDetail(customerId)
}

// Staff actions
export async function getAdminStaffsAction() {
  await requireAdmin()
  return adminStaffService.adminGetStaffs()
}

export async function createAdminStaffAction(payload: CreateStaffPayload) {
  await requireAdmin()

  if (!payload.email || !payload.name || !payload.role || !payload.password) {
    return {
      success: false,
      error: 'All fields including password are required',
    }
  }

  if (
    payload.password.length < 12 ||
    !/[A-Z]/.test(payload.password) ||
    !/[0-9]/.test(payload.password)
  ) {
    return {
      success: false,
      error: 'Password must be at least 12 characters with uppercase and digits',
    }
  }

  return adminStaffService.adminCreateStaff({
    name: payload.name,
    email: payload.email,
    password: payload.password,
    role: payload.role as 'admin' | 'staff',
  })
}

export async function updateAdminStaffAction(
  staffId: string,
  staffData: Partial<{
    name: string
    role: 'admin' | 'staff'
    is_active: boolean
  }>
) {
  await requireAdmin()
  return adminStaffService.adminUpdateStaff(staffId, staffData)
}

export async function deleteAdminStaffAction(staffId: string) {
  await requireAdmin()
  return adminStaffService.adminDeleteStaff(staffId)
}
