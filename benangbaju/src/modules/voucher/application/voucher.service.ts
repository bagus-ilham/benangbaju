import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import * as repo from "../infrastructure/voucher.repository";
import { VoucherValidationResult } from "../domain/voucher.types";

export class VoucherService {
    constructor(private supabase: SupabaseClient<Database>) {
    }

    async validateVoucher(code: string, subtotal: number, userId: string) {
        return repo.validateVoucher(this.supabase, code, subtotal, userId);
    }

    async adminGetVouchers(page = 1, limit = 20) {
        return repo.adminGetVouchers(this.supabase, page, limit);
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
          }) {
        return repo.adminCreateVoucher(this.supabase, voucherData);
    }

    async adminUpdateVoucher(voucherId: string, voucherData: {
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
          }) {
        return repo.adminUpdateVoucher(this.supabase, voucherId, voucherData);
    }

    async adminDeleteVoucher(voucherId: string) {
        return repo.adminDeleteVoucher(this.supabase, voucherId);
    }
}
