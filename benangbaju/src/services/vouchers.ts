import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

export interface VoucherValidationResult {
  success: boolean
  valid: boolean
  voucher_id?: string
  code?: string
  discount_type?: 'fixed' | 'percentage'
  discount_amount?: number
  final_total?: number
  message?: string
  code_error?: string
}

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val)
}

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
    console.error('Error validating voucher:', error)
    return {
      success: false,
      valid: false,
      message: 'Gagal memvalidasi voucher. Coba beberapa saat lagi.',
    }
  }

  if (data && isObject(data)) {
    const success = typeof data['success'] === 'boolean' ? data['success'] : false
    const valid = typeof data['valid'] === 'boolean' ? data['valid'] : false
    const voucher_id = typeof data['voucher_id'] === 'string' ? data['voucher_id'] : undefined
    const rpcCode = typeof data['code'] === 'string' ? data['code'] : undefined
    const discount_type = (data['discount_type'] === 'fixed' || data['discount_type'] === 'percentage') ? data['discount_type'] : undefined
    const discount_amount = typeof data['discount_amount'] === 'number' ? data['discount_amount'] : undefined
    const final_total = typeof data['final_total'] === 'number' ? data['final_total'] : undefined
    const message = typeof data['message'] === 'string' ? data['message'] : undefined
    const code_error = typeof data['code_error'] === 'string' ? data['code_error'] : undefined

    return {
      success,
      valid,
      voucher_id,
      code: rpcCode,
      discount_type,
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

export async function adminGetVouchers(supabase: SupabaseClient<Database>) : Promise<{ id: string; code: string; name: string; discount_type: string; value: number; max_discount: number | null; min_purchase: number; starts_at: string; expires_at: string; usage_limit: number | null; usage_per_user: number; used_count: number; is_active: boolean; created_at: string; }[]> {
  const { data, error } = await supabase
    .from('vouchers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching admin vouchers:', error)
    throw error
  }

  return data || []
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
) : Promise<{ id: string; code: string; name: string; discount_type: string; value: number; max_discount: number | null; min_purchase: number; starts_at: string; expires_at: string; usage_limit: number | null; usage_per_user: number; used_count: number; is_active: boolean; created_at: string; }> {
  const { data, error } = await supabase
    .from('vouchers')
    .insert(voucherData)
    .select('*')
    .single()

  if (error) throw error
  return data
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
) : Promise<{ id: string; code: string; name: string; discount_type: string; value: number; max_discount: number | null; min_purchase: number; starts_at: string; expires_at: string; usage_limit: number | null; usage_per_user: number; used_count: number; is_active: boolean; created_at: string; }> {
  const { data, error } = await supabase
    .from('vouchers')
    .update(voucherData)
    .eq('id', voucherId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function adminDeleteVoucher(
  supabase: SupabaseClient<Database>,
  voucherId: string
) : Promise<{ success: boolean; }> {
  const { error } = await supabase
    .from('vouchers')
    .update({ is_active: false })
    .eq('id', voucherId)

  if (error) throw error
  return { success: true }
}
