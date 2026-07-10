import { voucherRepository } from './voucher.repository'
import { ApiListResponse, ApiResponse } from '@/lib/api-response'
import type { Voucher, VoucherValidationResult } from './types'

export class VoucherService {
  async validateVoucher(
    code: string,
    subtotal: number,
    userId: string
  ): Promise<VoucherValidationResult> {
    return voucherRepository.validateVoucher(code, subtotal, userId)
  }

  async adminGetVouchers(
    page = 1,
    limit = 20
  ): Promise<ApiListResponse<Voucher>> {
    return voucherRepository.adminGetVouchers(page, limit)
  }

  async adminCreateVoucher(
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
      starts_at: string
      expires_at: string
    }
  ): Promise<ApiResponse<Voucher>> {
    return voucherRepository.adminCreateVoucher(voucherData)
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
      starts_at: string
      expires_at: string
    }
  ): Promise<ApiResponse<Voucher>> {
    return voucherRepository.adminUpdateVoucher(voucherId, voucherData)
  }

  async adminDeleteVoucher(voucherId: string): Promise<ApiResponse<void>> {
    return voucherRepository.adminDeleteVoucher(voucherId)
  }
}

export const voucherService = new VoucherService()
