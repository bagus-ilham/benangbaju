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
