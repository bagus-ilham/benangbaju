import { safeLogError } from '@/lib/logger'
import { insertAdminActivityLog } from '@/modules/admin-logs/admin-log.repository'
import { createServerClient } from '@/lib/supabase/server'
import { ApiListResponse, ApiResponse, ok, paginated, fail } from '@/lib/api-response'
import { ApiErrorCode } from '@/lib/api-errors'
import type { Voucher, VoucherValidationResult } from './types'

export class VoucherRepository {
  async validateVoucher(
    code: string,
    subtotal: number,
    userId: string
  ): Promise<VoucherValidationResult> {
    const supabase = await createServerClient()
    const { data, error } = await supabase.rpc('validate_voucher', {
      p_code: code,
      p_subtotal: subtotal,
      p_user_id: userId,
    })

    if (error) {
      safeLogError('Error validating voucher:', error)
      return {
        success: false,
        valid: false,
        message: 'Gagal memvalidasi voucher. Coba beberapa saat lagi.',
      }
    }

    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const {
        success = false,
        valid = false,
        voucher_id,
        code: rpcCode,
        discount_type,
        discount_amount,
        final_total,
        message,
        code_error,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } = data as Record<string, any>

      return {
        success: Boolean(success),
        valid: Boolean(valid),
        voucher_id,
        code: rpcCode,
        discount_type:
          discount_type === 'fixed' || discount_type === 'percentage' ? discount_type : undefined,
        discount_amount,
        final_total,
        message,
        code_error,
      }
    }

    return {
      success: false,
      valid: false,
      message: 'Format respon voucher tidak valid.',
    }
  }

  async adminGetVouchers(
    page = 1,
    limit = 20
  ): Promise<ApiListResponse<Voucher>> {
    const supabase = await createServerClient()
    const from = (page - 1) * limit
    const to = from + limit - 1
    const { data, error, count } = await supabase
      .from('vouchers')
      .select(
        'id, code, name, discount_type, value, max_discount, min_purchase, starts_at, expires_at, usage_limit, usage_per_user, used_count, is_active, created_at',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      safeLogError('Error fetching admin vouchers:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal mengambil daftar voucher')
    }

    return paginated((data as Voucher[]) || [], page, limit, count || 0)
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
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('vouchers')
      .insert(voucherData)
      .select(
        'id, code, name, discount_type, value, max_discount, min_purchase, starts_at, expires_at, usage_limit, usage_per_user, used_count, is_active, created_at'
      )
      .single()

    if (error) {
      safeLogError('Error creating voucher:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal membuat voucher')
    }

    await insertAdminActivityLog(
      supabase,
      'create',
      'voucher',
      data.id,
      `Created voucher ${voucherData.code}`
    )

    return ok(data as Voucher)
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
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('vouchers')
      .update(voucherData)
      .eq('id', voucherId)
      .select(
        'id, code, name, discount_type, value, max_discount, min_purchase, starts_at, expires_at, usage_limit, usage_per_user, used_count, is_active, created_at'
      )
      .single()

    if (error) {
      safeLogError('Error updating voucher:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal memperbarui voucher')
    }

    await insertAdminActivityLog(
      supabase,
      'update',
      'voucher',
      voucherId,
      `Updated voucher ${voucherData.code}`
    )

    return ok(data as Voucher)
  }

  async adminDeleteVoucher(voucherId: string): Promise<ApiResponse<void>> {
    const supabase = await createServerClient()
    const { error } = await supabase.from('vouchers').delete().eq('id', voucherId)

    if (error) {
      safeLogError('Error deleting voucher:', error)
      return fail(ApiErrorCode.INTERNAL_ERROR, 'Gagal menghapus voucher')
    }

    await insertAdminActivityLog(
      supabase,
      'delete',
      'voucher',
      voucherId,
      `Deleted voucher ${voucherId}`
    )

    return ok()
  }
}

export const voucherRepository = new VoucherRepository()
