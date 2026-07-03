import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database'
import { VoucherService } from '@/features/marketing/application/voucher.service'
import * as types from '@/features/marketing/domain/voucher.types'

export type { VoucherValidationResult } from '@/features/marketing/domain/voucher.types'

export async function validateVoucher(
  supabase: SupabaseClient<Database>,
  code: string,
  subtotal: number,
  userId: string
) {
  return new VoucherService(supabase).validateVoucher(code, subtotal, userId)
}

export async function adminGetVouchers(supabase: SupabaseClient<Database>, page = 1, limit = 20) {
  return new VoucherService(supabase).adminGetVouchers(page, limit)
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
  return new VoucherService(supabase).adminCreateVoucher(voucherData)
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
  return new VoucherService(supabase).adminUpdateVoucher(voucherId, voucherData)
}

export async function adminDeleteVoucher(supabase: SupabaseClient<Database>, voucherId: string) {
  return new VoucherService(supabase).adminDeleteVoucher(voucherId)
}
