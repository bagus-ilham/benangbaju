import { safeLogError } from '@/lib/logger'
import { adminLogRepository } from '@/modules/admin-logs/admin-log.repository'
import { createServerClient } from '@/lib/supabase/server'
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
      throw new Error('Gagal memvalidasi voucher. Coba beberapa saat lagi.')
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } = data as Record<string, any>

      if (!success || !valid) {
        throw new Error(message || 'Voucher tidak valid atau tidak dapat digunakan.')
      }

      return {
        voucher_id,
        code: rpcCode,
        discount_type:
          discount_type === 'fixed' || discount_type === 'percentage' ? discount_type : 'fixed',
        discount_amount,
        final_total,
      }
    }

    throw new Error('Format respon voucher tidak valid.')
  }

  async adminGetVouchers(page = 1, limit = 20): Promise<{ data: Voucher[]; count: number }> {
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
      throw error
    }

    return { data: (data as Voucher[]) || [], count: count || 0 }
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
    starts_at: string
    expires_at: string
  }): Promise<Voucher> {
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
      throw error
    }

    await adminLogRepository.insertAdminActivityLog(
      supabase,
      'create',
      'voucher',
      data.id,
      `Created voucher ${voucherData.code}`
    )

    return data as Voucher
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
  ): Promise<Voucher> {
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
      throw error
    }

    await adminLogRepository.insertAdminActivityLog(
      supabase,
      'update',
      'voucher',
      voucherId,
      `Updated voucher ${voucherData.code}`
    )

    return data as Voucher
  }

  async adminDeleteVoucher(voucherId: string): Promise<void> {
    const supabase = await createServerClient()
    const { error } = await supabase.from('vouchers').delete().eq('id', voucherId)

    if (error) {
      safeLogError('Error deleting voucher:', error)
      throw error
    }

    await adminLogRepository.insertAdminActivityLog(
      supabase,
      'delete',
      'voucher',
      voucherId,
      `Deleted voucher ${voucherId}`
    )
  }
}

export const voucherRepository = new VoucherRepository()
