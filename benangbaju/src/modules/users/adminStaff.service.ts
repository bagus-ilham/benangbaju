import { adminStaffRepository } from './adminStaff.repository'
import { StaffProfile } from './types'

export class AdminStaffService {
  async adminGetStaffs(): Promise<StaffProfile[]> {
    return adminStaffRepository.adminGetStaffs()
  }

  async adminCreateStaff(staffData: {
    name: string
    email: string
    password?: string
    role: 'admin' | 'staff'
  }): Promise<{ success: boolean; data?: StaffProfile; error?: string }> {
    return adminStaffRepository.adminCreateStaff(staffData)
  }

  async adminUpdateStaff(
    staffId: string,
    staffData: Partial<{
      name: string
      role: 'admin' | 'staff'
      is_active: boolean
    }>
  ): Promise<{ success: boolean; data?: StaffProfile; error?: Error }> {
    return adminStaffRepository.adminUpdateStaff(staffId, staffData)
  }

  async adminDeleteStaff(staffId: string): Promise<{ success: boolean; error?: Error }> {
    return adminStaffRepository.adminDeleteStaff(staffId)
  }
}

export const adminStaffService = new AdminStaffService()
