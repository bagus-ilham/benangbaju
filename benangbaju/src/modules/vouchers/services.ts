import type { Voucher, VoucherValidationResult } from './types'
import { safeLogError } from '@/lib/logger'
import { insertAdminActivityLog } from '@/modules/admin-logs/services'
import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'
import { ApiListResponse, ApiResponse, ok, paginated, fail } from '@/lib/api-response'
import { ApiErrorCode } from '@/lib/api-errors'

export async function validateVoucher(
  supabase: SupabaseClient<Database>,
  code: string,
  subtotal: number,
  userId: string
): Promise<VoucherValidationResult> {
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

export async function adminGetVouchers(
  supabase: SupabaseClient<Database>,
  page = 1,
  limit = 20
): Promise<ApiListResponse<Voucher>> {
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

export async function adminCreateVoucher(
  supabase: SupabaseClient<Database>,
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

export async function adminUpdateVoucher(
  supabase: SupabaseClient<Database>,
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

export async function adminDeleteVoucher(
  supabase: SupabaseClient<Database>,
  voucherId: string
): Promise<ApiResponse<void>> {
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

export type { Voucher }

export * from './types'
