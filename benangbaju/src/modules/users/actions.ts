'use server'

import { requireAdmin, requireSuperAdmin } from '@/lib/auth-guard'
import { adminCustomerService } from './adminCustomer.service'
import { adminStaffService } from './adminStaff.service'
import { CreateStaffPayload } from './types'

export async function getAdminCustomersAction(page = 1, limit = 20) {
  await requireAdmin()
  return adminCustomerService.adminGetCustomers(page, limit)
}

export async function toggleAdminCustomerStatusAction(customerId: string, isActive: boolean) {
  const { user } = await requireAdmin()
  return adminCustomerService.adminToggleCustomerStatus(customerId, isActive, user.id)
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
  const { user } = await requireSuperAdmin()

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

  return adminStaffService.adminCreateStaff(
    {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      role: payload.role as 'admin' | 'staff',
    },
    user.id
  )
}

export async function updateAdminStaffAction(
  staffId: string,
  staffData: Partial<{
    name: string
    role: 'admin' | 'staff'
    is_active: boolean
  }>
) {
  const { user } = await requireSuperAdmin()
  return adminStaffService.adminUpdateStaff(staffId, staffData, user.id)
}

export async function deleteAdminStaffAction(staffId: string) {
  const { user } = await requireSuperAdmin()
  if (staffId === user.id) {
    return {
      success: false,
      error: 'Tidak dapat menghapus akun Anda sendiri',
    }
  }
  return adminStaffService.adminDeleteStaff(staffId, user.id)
}
