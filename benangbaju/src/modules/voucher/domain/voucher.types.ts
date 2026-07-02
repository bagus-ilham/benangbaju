export interface VoucherValidationResult {
    success: boolean;
    valid: boolean;
    voucher_id?: string;
    code?: string;
    discount_type?: 'fixed' | 'percentage';
    discount_amount?: number;
    final_total?: number;
    message?: string;
    code_error?: string;
}

export interface Voucher {
    id: string;
    code: string;
    name: string;
    discount_type: 'fixed' | 'percentage';
    value: number;
    max_discount: number | null;
    min_purchase: number;
    starts_at: string | null;
    expires_at: string | null;
    usage_limit: number | null;
    usage_per_user: number;
    used_count: number;
    is_active: boolean;
    created_at: string;
}
