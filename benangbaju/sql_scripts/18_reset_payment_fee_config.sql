-- ==============================================================================
-- SCRIPT RESET PAYMENT FEE CONFIG (DOKU OFFICIAL API CHANNEL CODES)
-- ==============================================================================
-- Memperbarui dan mereset tabel payment_fee_config sesuai 9 Kode API Resmi DOKU 
-- (payment_method_types) beserta tarif DOKU + PPN 11%.
-- ==============================================================================

BEGIN;

-- 1. Kosongkan konfigurasi fee pembayaran lama
TRUNCATE TABLE public.payment_fee_config;

-- 2. Masukkan 9 kanal pembayaran resmi DOKU (Kode API Standar SNAP/Checkout)
INSERT INTO public.payment_fee_config (
    channel_code, 
    category, 
    channel_name, 
    fee_type, 
    fee_flat, 
    fee_percentage, 
    is_active, 
    sort_order
) VALUES
  -- 1. Virtual Account BNI (Rp 4.000 + PPN 11%)
  ('VIRTUAL_ACCOUNT_BNI', 'virtual_account', 'Virtual Account BNI', 'flat', 4440, 0, true, 1),

  -- 2. DOKU VA (Other Banks / Mandiri / Danamon / dll) (Rp 4.000 + PPN 11%)
  ('VIRTUAL_ACCOUNT_DOKU', 'virtual_account', 'DOKU VA (Other Banks)', 'flat', 4440, 0, true, 2),

  -- 3. DOKU Wallet (Rp 2.000 + PPN 11%)
  ('EMONEY_DOKU', 'ewallet', 'DOKU Wallet', 'flat', 2220, 0, true, 3),

  -- 4. Alfa Group (Rp 5.000 + PPN 11%)
  ('ONLINE_TO_OFFLINE_ALFA', 'minimarket', 'Alfa Group (Alfamart, Alfamidi, Lawson, Dan++)', 'flat', 5550, 0, true, 4),

  -- 5. Indomaret (Rp 5.000 + PPN 11%)
  ('ONLINE_TO_OFFLINE_INDOMARET', 'minimarket', 'Indomaret', 'flat', 5550, 0, true, 5),

  -- 6. QRIS (0.7% + PPN 11% = 0.777%)
  ('QRIS', 'qris', 'QRIS (Semua Bank & E-Wallet)', 'percentage', 0, 0.777, true, 6),

  -- 7. DANA (1.5% + PPN 11% = 1.665%)
  ('EMONEY_DANA', 'ewallet', 'DANA', 'percentage', 0, 1.665, true, 7),

  -- 8. OVO (2.0% + PPN 11% = 2.220%)
  ('EMONEY_OVO', 'ewallet', 'OVO', 'percentage', 0, 2.220, true, 8),

  -- 9. ShopeePay (2.0% + PPN 11% = 2.220%)
  ('EMONEY_SHOPEE_PAY', 'ewallet', 'ShopeePay', 'percentage', 0, 2.220, true, 9);

COMMIT;
