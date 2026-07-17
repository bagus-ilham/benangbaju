'use server'

import { voucherService } from './voucher.service'
import { requireAdmin, requireAuth } from '@/lib/auth-guard'

// Public / Auth Actions
export async function validateVoucherAction(code: string, subtotal: number) {
  const { user } = await requireAuth()
  return voucherService.validateVoucher(code, subtotal, user.id)
}

// Admin Actions
export async function getAdminVouchersAction(page = 1, limit = 20) {
  await requireAdmin()
  return voucherService.adminGetVouchers(page, limit)
}

export async function createAdminVoucherAction(voucherData: {
  code: string
  name: string
  discount_type: 'percentage' | 'fixed'
  value: number
  min_purchase: number
  max_discount: number | null
  usage_limit: number | null
  usage_per_user: number
  is_active: boolean
  is_hidden: boolean
  starts_at: string
  expires_at: string
}) {
  await requireAdmin()
  return voucherService.adminCreateVoucher(voucherData)
}

export async function updateAdminVoucherAction(
  voucherId: string,
  voucherData: {
    code: string
    name: string
    discount_type: 'percentage' | 'fixed'
    value: number
    min_purchase: number
    max_discount: number | null
    usage_limit: number | null
    usage_per_user: number
    is_active: boolean
    is_hidden: boolean
    starts_at: string
    expires_at: string
  }
) {
  await requireAdmin()
  return voucherService.adminUpdateVoucher(voucherId, voucherData)
}

export async function deleteAdminVoucherAction(voucherId: string) {
  await requireAdmin()
  return voucherService.adminDeleteVoucher(voucherId)
}
