-- =============================================================
-- Migration: 00007_create_rpc_functions.sql
-- Core RPC Functions (Sprint 1)
-- =============================================================

-- -------------------------------------------------------
-- RPC: calculate_shipping(zone_id, weight_gram)
-- Menghitung opsi ongkos kirim berdasarkan zona dan berat
-- Catatan: shipping_rates tabel dibuat di Sprint 2, 
-- fungsi ini siap dipakai setelah tabel tersedia.
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_shipping(
  p_zone_id UUID,
  p_weight_gram INT
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Validate inputs
  IF p_zone_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Zona pengiriman tidak valid', 'code', 'INVALID_ZONE');
  END IF;

  IF p_weight_gram <= 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Berat harus lebih dari 0', 'code', 'INVALID_WEIGHT');
  END IF;

  -- Check if shipping_rates table exists and has data
  -- Calculate shipping options
  SELECT jsonb_build_object(
    'success', true,
    'data', COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', sr.id,
        'courier_name', sr.courier_name,
        'price', GREATEST(
          sr.base_price,
          CEIL(GREATEST(p_weight_gram, sr.min_weight_gram)::NUMERIC / 1000) * sr.price_per_kg
        ),
        'etd_min', sr.etd_days_min,
        'etd_max', sr.etd_days_max,
        'weight_used_gram', GREATEST(p_weight_gram, sr.min_weight_gram)
      )
    ), '[]'::jsonb)
  ) INTO v_result
  FROM shipping_rates sr
  WHERE sr.zone_id = p_zone_id
    AND sr.is_active = true;

  RETURN v_result;

EXCEPTION WHEN undefined_table THEN
  -- shipping_rates table doesn't exist yet (Sprint 2)
  RETURN jsonb_build_object(
    'success', false,
    'message', 'Tabel shipping_rates belum tersedia',
    'code', 'TABLE_NOT_READY'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_shipping IS 'Calculate shipping options for a given zone and weight';

-- -------------------------------------------------------
-- RPC: validate_voucher(code, subtotal, user_id)
-- Validasi voucher dan hitung diskon
-- Catatan: vouchers tabel dibuat di Sprint 2,
-- fungsi ini siap dipakai setelah tabel tersedia.
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_voucher(
  p_code TEXT,
  p_subtotal NUMERIC,
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_voucher RECORD;
  v_user_usage_count INT;
  v_discount_amount NUMERIC;
BEGIN
  -- Validate inputs
  IF p_code IS NULL OR p_code = '' THEN
    RETURN jsonb_build_object('success', false, 'valid', false, 'message', 'Kode voucher tidak boleh kosong', 'code', 'VOUCHER_INVALID');
  END IF;

  -- 1. Find voucher
  SELECT * INTO v_voucher
  FROM vouchers
  WHERE code = UPPER(TRIM(p_code))
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', true, 'valid', false, 'message', 'Kode voucher tidak ditemukan', 'code', 'VOUCHER_INVALID');
  END IF;

  -- 2. Check is_active
  IF NOT v_voucher.is_active THEN
    RETURN jsonb_build_object('success', true, 'valid', false, 'message', 'Voucher tidak aktif', 'code', 'VOUCHER_INVALID');
  END IF;

  -- 3. Check date range
  IF v_voucher.starts_at > now() THEN
    RETURN jsonb_build_object('success', true, 'valid', false, 'message', 'Voucher belum berlaku', 'code', 'VOUCHER_INVALID');
  END IF;

  IF v_voucher.expires_at < now() THEN
    RETURN jsonb_build_object('success', true, 'valid', false, 'message', 'Voucher sudah kadaluarsa', 'code', 'VOUCHER_EXPIRED');
  END IF;

  -- 4. Check global usage limit
  IF v_voucher.usage_limit IS NOT NULL AND v_voucher.used_count >= v_voucher.usage_limit THEN
    RETURN jsonb_build_object('success', true, 'valid', false, 'message', 'Kuota voucher sudah habis', 'code', 'VOUCHER_QUOTA_EXCEEDED');
  END IF;

  -- 5. Check per-user usage limit
  SELECT COUNT(*) INTO v_user_usage_count
  FROM voucher_usages
  WHERE voucher_id = v_voucher.id
    AND user_id = p_user_id;

  IF v_user_usage_count >= v_voucher.usage_per_user THEN
    RETURN jsonb_build_object('success', true, 'valid', false, 'message', 'Anda sudah menggunakan voucher ini', 'code', 'VOUCHER_USER_LIMIT');
  END IF;

  -- 6. Check minimum purchase
  IF p_subtotal < v_voucher.min_purchase THEN
    RETURN jsonb_build_object(
      'success', true, 'valid', false,
      'message', format('Minimum belanja Rp %s untuk voucher ini', to_char(v_voucher.min_purchase, 'FM999,999,999')),
      'code', 'VOUCHER_MIN_PURCHASE'
    );
  END IF;

  -- 7. Calculate discount
  IF v_voucher.discount_type = 'fixed' THEN
    v_discount_amount := LEAST(v_voucher.value, p_subtotal);
  ELSIF v_voucher.discount_type = 'percentage' THEN
    v_discount_amount := p_subtotal * (v_voucher.value / 100);
    -- Cap by max_discount if set
    IF v_voucher.max_discount IS NOT NULL THEN
      v_discount_amount := LEAST(v_discount_amount, v_voucher.max_discount);
    END IF;
  ELSE
    v_discount_amount := 0;
  END IF;

  -- Round to 2 decimals
  v_discount_amount := ROUND(v_discount_amount, 2);

  RETURN jsonb_build_object(
    'success', true,
    'valid', true,
    'voucher_id', v_voucher.id,
    'code', v_voucher.code,
    'discount_type', v_voucher.discount_type,
    'discount_amount', v_discount_amount,
    'final_total', GREATEST(p_subtotal - v_discount_amount, 0)
  );

EXCEPTION WHEN undefined_table THEN
  -- vouchers/voucher_usages table doesn't exist yet (Sprint 2)
  RETURN jsonb_build_object(
    'success', false,
    'valid', false,
    'message', 'Tabel vouchers belum tersedia',
    'code', 'TABLE_NOT_READY'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.validate_voucher IS 'Validate a voucher code and calculate discount amount';

-- -------------------------------------------------------
-- RPC: adjust_stock(variant_id, qty, note, admin_id)
-- Manual stock adjustment by admin
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.adjust_stock(
  p_variant_id UUID,
  p_qty INT,
  p_note TEXT DEFAULT '',
  p_admin_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_current_stock INT;
  v_new_stock INT;
BEGIN
  -- Verify caller is admin
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak', 'code', 'FORBIDDEN');
  END IF;

  -- Lock the variant row for update
  SELECT stock INTO v_current_stock
  FROM product_variants
  WHERE id = p_variant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Variant tidak ditemukan', 'code', 'NOT_FOUND');
  END IF;

  -- Calculate new stock
  v_new_stock := v_current_stock + p_qty;

  IF v_new_stock < 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Stok tidak boleh negatif', 'code', 'STOCK_NEGATIVE');
  END IF;

  -- Update stock
  UPDATE product_variants SET stock = v_new_stock WHERE id = p_variant_id;

  -- Record mutation
  INSERT INTO stock_mutations (variant_id, type, qty, qty_before, qty_after, note, created_by)
  VALUES (
    p_variant_id,
    'adjustment',
    p_qty,
    v_current_stock,
    v_new_stock,
    COALESCE(p_note, 'Manual adjustment'),
    COALESCE(p_admin_id, auth.uid())
  );

  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'variant_id', p_variant_id,
      'qty_before', v_current_stock,
      'qty_after', v_new_stock,
      'adjustment', p_qty
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.adjust_stock IS 'Admin manual stock adjustment with mutation logging';
