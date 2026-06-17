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

  // Cast JSON returned from RPC
  return data as unknown as VoucherValidationResult;
}

export async function adminGetVouchers(supabase: SupabaseClient<Database>) {
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
) {
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
) {
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
) {
  const { error } = await supabase
    .from('vouchers')
    .update({ is_active: false })
    .eq('id', voucherId)

  if (error) throw error
  return { success: true }
}
