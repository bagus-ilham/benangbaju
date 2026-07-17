import { voucherRepository } from './voucher.repository'
import { ApiListResponse, ApiResponse, ok, fail, paginated } from '@/lib/api-response'
import { ApiErrorCode } from '@/lib/api-errors'
import type { Voucher, VoucherValidationResult } from './types'
import { safeLogError } from '@/lib/logger'

export class VoucherService {
  async validateVoucher(
    code: string,
    subtotal: number,
    userId: string
  ): Promise<ApiResponse<VoucherValidationResult>> {
    try {
      const result = await voucherRepository.validateVoucher(code, subtotal, userId)
      return ok(result)
    } catch (error: any) {
      safeLogError('Error in VoucherService.validateVoucher:', error)
      return fail(ApiErrorCode.VALIDATION_ERROR, error.message || 'Voucher tidak valid')
    }
  }

  async adminGetVouchers(page = 1, limit = 20): Promise<ApiListResponse<Voucher>> {
    try {
      const { data, count } = await voucherRepository.adminGetVouchers(page, limit)
      return paginated(data, page, limit, count)
    } catch (error) {
      safeLogError('Error in VoucherService.adminGetVouchers:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengambil daftar voucher')
    }
  }

  async adminCreateVoucher(voucherData: {
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
  }): Promise<ApiResponse<Voucher>> {
    try {
      const voucher = await voucherRepository.adminCreateVoucher(voucherData)
      return ok(voucher)
    } catch (error) {
      safeLogError('Error in VoucherService.adminCreateVoucher:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal membuat voucher')
    }
  }

  async adminUpdateVoucher(
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
  ): Promise<ApiResponse<Voucher>> {
    try {
      const voucher = await voucherRepository.adminUpdateVoucher(voucherId, voucherData)
      return ok(voucher)
    } catch (error) {
      safeLogError('Error in VoucherService.adminUpdateVoucher:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memperbarui voucher')
    }
  }

  async adminDeleteVoucher(voucherId: string): Promise<ApiResponse<void>> {
    try {
      await voucherRepository.adminDeleteVoucher(voucherId)
      return ok()
    } catch (error) {
      safeLogError('Error in VoucherService.adminDeleteVoucher:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal menghapus voucher')
    }
  }
}

export const voucherService = new VoucherService()
