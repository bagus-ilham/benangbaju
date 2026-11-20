-- ==============================================================================
-- 24_malaysia_step3_promotions_payment.sql
-- Benangbaju E-Commerce: Malaysia Market Step 3 (Promotions, Vouchers & Payment)
--
-- Features implemented:
-- 1. flash_sales target_market column (ALL, ID, MY) with constraint
-- 2. Updated admin_create_flash_sale & admin_update_flash_sale to persist target_market
-- 3. Seed site_settings for free shipping thresholds (IDR & MYR)
-- 4. Updated validate_voucher RPC with localized English & RM messages for Malaysia orders
-- 5. Updated create_order RPC to enforce flash_sales target_market validation
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Table Alterations: flash_sales (Target Market)
-- ------------------------------------------------------------------------------
ALTER TABLE public.flash_sales
    ADD COLUMN IF NOT EXISTS target_market VARCHAR(10) NOT NULL DEFAULT 'ALL';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'flash_sales_target_market_check'
    ) THEN
        ALTER TABLE public.flash_sales
            ADD CONSTRAINT flash_sales_target_market_check
            CHECK (target_market IN ('ALL', 'ID', 'MY'));
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. Seed site_settings for Free Shipping Thresholds
-- ------------------------------------------------------------------------------
INSERT INTO public.site_settings (key, value, type, "group", label)
VALUES
    ('free_shipping_threshold_idr', '500000', 'number', 'shipping', 'Ambang Gratis/Subsidi Ongkir Indonesia (Rp)'),
    ('free_shipping_threshold_myr', '150', 'number', 'shipping', 'Ambang Gratis/Subsidi Ongkir Malaysia (RM)')
ON CONFLICT (key) DO UPDATE
SET label = EXCLUDED.label,
    "group" = EXCLUDED."group",
    type = EXCLUDED.type;

-- ------------------------------------------------------------------------------
-- 3. Update admin_create_flash_sale & admin_update_flash_sale RPCs
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_create_flash_sale(
  p_flash_sale jsonb,
  p_items jsonb
) RETURNS jsonb AS $$
DECLARE
  v_flash_sale_id uuid;
  v_item jsonb;
BEGIN
  -- 1. Insert flash sale
  INSERT INTO public.flash_sales (
    name, description, banner_url, starts_at, ends_at, is_active, target_market
  ) VALUES (
    p_flash_sale->>'name',
    p_flash_sale->>'description',
    p_flash_sale->>'banner_url',
    (p_flash_sale->>'starts_at')::timestamptz,
    (p_flash_sale->>'ends_at')::timestamptz,
    COALESCE((p_flash_sale->>'is_active')::boolean, true),
    COALESCE(NULLIF(p_flash_sale->>'target_market', ''), 'ALL')
  ) RETURNING id INTO v_flash_sale_id;

  -- 2. Insert items
  IF jsonb_array_length(p_items) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
      INSERT INTO public.flash_sale_items (
        flash_sale_id, variant_id, original_price,
        sale_price, quota, sold_count
      ) VALUES (
        v_flash_sale_id,
        (v_item->>'variant_id')::uuid,
        (v_item->>'original_price')::numeric,
        (v_item->>'sale_price')::numeric,
        (v_item->>'quota')::int,
        COALESCE((v_item->>'sold_count')::int, 0)
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', true, 'data', jsonb_build_object('id', v_flash_sale_id));
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', jsonb_build_object('code', SQLSTATE, 'message', SQLERRM));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.admin_update_flash_sale(
  p_flash_sale_id uuid,
  p_flash_sale jsonb,
  p_items_to_upsert jsonb,
  p_variant_ids_to_delete uuid[]
) RETURNS jsonb AS $$
DECLARE
  v_item jsonb;
BEGIN
  -- 1. Update flash sale
  IF p_flash_sale IS NOT NULL AND p_flash_sale != '{}'::jsonb THEN
    UPDATE public.flash_sales SET
      name = COALESCE(p_flash_sale->>'name', name),
      description = COALESCE(p_flash_sale->>'description', description),
      banner_url = COALESCE(p_flash_sale->>'banner_url', banner_url),
      starts_at = COALESCE((p_flash_sale->>'starts_at')::timestamptz, starts_at),
      ends_at = COALESCE((p_flash_sale->>'ends_at')::timestamptz, ends_at),
      is_active = COALESCE((p_flash_sale->>'is_active')::boolean, is_active),
      target_market = COALESCE(p_flash_sale->>'target_market', target_market)
    WHERE id = p_flash_sale_id;
  END IF;

  -- 2. Delete items
  IF array_length(p_variant_ids_to_delete, 1) > 0 THEN
    DELETE FROM public.flash_sale_items 
    WHERE flash_sale_id = p_flash_sale_id 
    AND variant_id = ANY(p_variant_ids_to_delete);
  END IF;

  -- 3. Upsert items
  IF jsonb_array_length(p_items_to_upsert) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items_to_upsert) LOOP
      INSERT INTO public.flash_sale_items (
        flash_sale_id, variant_id, original_price,
        sale_price, quota, sold_count
      ) VALUES (
        p_flash_sale_id,
        (v_item->>'variant_id')::uuid,
        (v_item->>'original_price')::numeric,
        (v_item->>'sale_price')::numeric,
        (v_item->>'quota')::int,
        COALESCE((v_item->>'sold_count')::int, 0)
      )
      ON CONFLICT (flash_sale_id, variant_id) DO UPDATE SET
        original_price = EXCLUDED.original_price,
        sale_price = EXCLUDED.sale_price,
        quota = EXCLUDED.quota;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', true, 'data', jsonb_build_object('id', p_flash_sale_id));
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', jsonb_build_object('code', SQLSTATE, 'message', SQLERRM));
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 4. Update validate_voucher RPC
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_voucher(
  p_code TEXT,
  p_subtotal NUMERIC,
  p_user_id UUID,
  p_country_code VARCHAR DEFAULT 'ID'
)
RETURNS JSONB AS $$
DECLARE
  v_voucher RECORD;
  v_user_usage_count INT;
  v_discount_amount NUMERIC;
  v_country VARCHAR(2);
  v_myr_rate NUMERIC := 3600;
  v_min_spend_msg TEXT;
BEGIN
  IF p_code IS NULL OR TRIM(p_code) = '' THEN
    RETURN jsonb_build_object('success', false, 'valid', false, 'message', 'Kode voucher tidak boleh kosong', 'code', 'VOUCHER_INVALID');
  END IF;

  v_country := UPPER(TRIM(COALESCE(p_country_code, 'ID')));

  SELECT * INTO v_voucher
  FROM public.vouchers
  WHERE code = UPPER(TRIM(p_code))
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', true, 'valid', false,
      'message', CASE WHEN v_country = 'MY' THEN 'Voucher code not found' ELSE 'Kode voucher tidak ditemukan' END,
      'code', 'VOUCHER_INVALID'
    );
  END IF;

  IF NOT v_voucher.is_active THEN
    RETURN jsonb_build_object(
      'success', true, 'valid', false,
      'message', CASE WHEN v_country = 'MY' THEN 'Voucher is not active' ELSE 'Voucher tidak aktif' END,
      'code', 'VOUCHER_INVALID'
    );
  END IF;

  IF v_voucher.starts_at IS NOT NULL AND v_voucher.starts_at > now() THEN
    RETURN jsonb_build_object(
      'success', true, 'valid', false,
      'message', CASE WHEN v_country = 'MY' THEN 'Voucher is not valid yet' ELSE 'Voucher belum berlaku' END,
      'code', 'VOUCHER_INVALID'
    );
  END IF;

  IF v_voucher.expires_at IS NOT NULL AND v_voucher.expires_at < now() THEN
    RETURN jsonb_build_object(
      'success', true, 'valid', false,
      'message', CASE WHEN v_country = 'MY' THEN 'Voucher has expired' ELSE 'Voucher sudah kadaluarsa' END,
      'code', 'VOUCHER_EXPIRED'
    );
  END IF;

  -- Country guardrail
  IF v_voucher.applicable_countries IS NOT NULL AND NOT (v_country = ANY(v_voucher.applicable_countries)) THEN
    RETURN jsonb_build_object(
      'success', true, 'valid', false,
      'message', CASE WHEN v_country = 'MY' 
        THEN 'This voucher is not applicable for orders shipped to Malaysia' 
        ELSE 'Voucher ini tidak berlaku untuk negara tujuan pengiriman Anda' END,
      'code', 'VOUCHER_COUNTRY_MISMATCH'
    );
  END IF;

  -- Global usage limit
  IF v_voucher.usage_limit IS NOT NULL AND v_voucher.used_count >= v_voucher.usage_limit THEN
    RETURN jsonb_build_object(
      'success', true, 'valid', false,
      'message', CASE WHEN v_country = 'MY' THEN 'Voucher usage limit reached' ELSE 'Kuota voucher sudah habis' END,
      'code', 'VOUCHER_QUOTA_EXCEEDED'
    );
  END IF;

  -- Per-user usage limit
  IF p_user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_user_usage_count
    FROM public.voucher_usages
    WHERE voucher_id = v_voucher.id
      AND user_id = p_user_id;

    IF v_user_usage_count >= v_voucher.usage_per_user THEN
      RETURN jsonb_build_object(
        'success', true, 'valid', false,
        'message', CASE WHEN v_country = 'MY' THEN 'You have already used this voucher' ELSE 'Anda sudah menggunakan voucher ini' END,
        'code', 'VOUCHER_USER_LIMIT'
      );
    END IF;
  END IF;

  -- Minimum purchase
  IF v_voucher.min_purchase IS NOT NULL AND p_subtotal < v_voucher.min_purchase THEN
    IF v_country = 'MY' THEN
      SELECT COALESCE(NULLIF(value, '')::NUMERIC, 3600) INTO v_myr_rate
      FROM public.site_settings WHERE key = 'myr_exchange_rate' LIMIT 1;
      IF v_myr_rate IS NULL OR v_myr_rate <= 0 THEN v_myr_rate := 3600; END IF;

      v_min_spend_msg := format(
        'Minimum spend RM %s (≈ Rp %s) for this voucher',
        to_char(ROUND(v_voucher.min_purchase::numeric / v_myr_rate, 2), 'FM999,990.00'),
        to_char(v_voucher.min_purchase, 'FM999,999,999')
      );
    ELSE
      v_min_spend_msg := format('Minimum belanja Rp %s untuk voucher ini', to_char(v_voucher.min_purchase, 'FM999,999,999'));
    END IF;

    RETURN jsonb_build_object(
      'success', true, 'valid', false,
      'message', v_min_spend_msg,
      'code', 'VOUCHER_MIN_PURCHASE'
    );
  END IF;

  -- Calculate discount
  IF v_voucher.discount_type = 'fixed' THEN
    v_discount_amount := LEAST(v_voucher.value, p_subtotal);
  ELSIF v_voucher.discount_type = 'percentage' THEN
    v_discount_amount := p_subtotal * (v_voucher.value / 100.0);
    IF v_voucher.max_discount IS NOT NULL AND v_voucher.max_discount > 0 THEN
      v_discount_amount := LEAST(v_discount_amount, v_voucher.max_discount);
    END IF;
  ELSE
    v_discount_amount := 0;
  END IF;

  v_discount_amount := ROUND(v_discount_amount);

  RETURN jsonb_build_object(
    'success', true,
    'valid', true,
    'voucher_id', v_voucher.id,
    'code', v_voucher.code,
    'discount_type', v_voucher.discount_type,
    'discount_amount', v_discount_amount,
    'final_total', GREATEST(p_subtotal - v_discount_amount, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 5. Update create_order RPC (Enforce Flash Sale target_market)
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.create_order(UUID, UUID, BIGINT, TEXT, TEXT, TEXT, BIGINT);

CREATE OR REPLACE FUNCTION public.create_order(
    p_user_id UUID,
    p_address_id UUID,
    p_voucher_code TEXT DEFAULT NULL,
    p_courier_name TEXT DEFAULT NULL,
    p_shipping_cost BIGINT DEFAULT 0,
    p_notes TEXT DEFAULT NULL,
    p_payment_fee BIGINT DEFAULT 0,
    p_payment_channel TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_cart_id UUID;
    v_order_id UUID;
    v_order_number TEXT;
    v_subtotal BIGINT := 0;
    v_discount_amount BIGINT := 0;
    v_payment_fee BIGINT := COALESCE(p_payment_fee, 0);
    v_total_amount BIGINT := 0;
    v_voucher_id UUID;
    v_voucher_result JSONB;
    v_user_address RECORD;
    v_cart_item RECORD;
    v_actual_price BIGINT;
    v_flash_sale_item_id UUID;
    v_item_subtotal BIGINT;
    v_shipping_cost BIGINT := COALESCE(p_shipping_cost, 0);
    v_address_country VARCHAR(2);
    v_date TEXT;
    v_random TEXT;
    v_exists BOOLEAN;
    v_cancelled_count INT;
    v_order_item_id UUID;

    -- Malaysia pricing variables
    v_myr_rate NUMERIC := 3600;
    v_my_markup NUMERIC := 0;
    v_my_rounding TEXT := 'none';
    v_price_myr NUMERIC(12,2) := NULL;
    v_total_myr NUMERIC(12,2) := NULL;
    v_calc_res RECORD;
BEGIN
    -- 0. Validate non-negative financial inputs
    IF p_shipping_cost < 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Ongkos kirim tidak valid', 'code', 'INVALID_SHIPPING');
    END IF;

    IF p_payment_fee < 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Biaya pembayaran tidak valid', 'code', 'INVALID_PAYMENT_FEE');
    END IF;

    -- 1. Fraud check: user with too many cancellations in 24 hours
    SELECT COUNT(*) INTO v_cancelled_count
    FROM public.orders
    WHERE user_id = p_user_id
      AND status = 'cancelled'
      AND cancelled_at > now() - INTERVAL '24 hours';

    IF v_cancelled_count > 3 THEN
        RETURN jsonb_build_object(
          'success', false,
          'message', 'Terlalu banyak pesanan dibatalkan. Silakan coba lagi nanti.',
          'code', 'FRAUD_DETECTED'
        );
    END IF;

    -- 2. Check user cart
    SELECT id INTO v_cart_id FROM public.carts WHERE user_id = p_user_id LIMIT 1;
    IF v_cart_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Keranjang belanja tidak ditemukan', 'code', 'CART_EMPTY');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.cart_items WHERE cart_id = v_cart_id) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Keranjang belanja kosong', 'code', 'CART_EMPTY');
    END IF;

    -- 3. Fetch user address
    SELECT id, recipient_name, phone, full_address, province_name, city_name, district_name, postal_code, country_code, zone_id
    INTO v_user_address
    FROM public.user_addresses
    WHERE id = p_address_id AND user_id = p_user_id;

    IF v_user_address IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Alamat pengiriman tidak ditemukan', 'code', 'ADDRESS_NOT_FOUND');
    END IF;

    v_address_country := UPPER(TRIM(COALESCE(v_user_address.country_code, 'ID')));

    -- 4. Specific validation for Malaysia addresses
    IF v_address_country = 'MY' THEN
        -- Postcode validation (West Malaysia: 01000 - 86999) using safe regex
        IF v_user_address.postal_code !~ '^(0[1-9]|[1-7][0-9]|8[0-6])[0-9]{3}$' THEN
            RETURN jsonb_build_object(
              'success', false,
              'message', 'Pengiriman ke Malaysia saat ini hanya mendukung poskod Semenanjung Malaysia (01000–86999).',
              'code', 'INVALID_POSTAL_CODE'
            );
        END IF;

        -- PO Box check
        IF v_user_address.full_address ~* '(p\.?\s*o\.?\s*box|peti\s*surat)' THEN
            RETURN jsonb_build_object(
              'success', false,
              'message', 'Alamat P.O. Box tidak didukung untuk pengiriman internasional.',
              'code', 'PO_BOX_REJECTED'
            );
        END IF;

        -- Payment channel must be QRIS
        IF LOWER(COALESCE(p_payment_channel, '')) <> 'qris' THEN
            RETURN jsonb_build_object(
              'success', false,
              'message', 'Metode pembayaran untuk pesanan ke Malaysia wajib menggunakan QRIS Cross-Border (DuitNow).',
              'code', 'INVALID_PAYMENT_CHANNEL'
            );
        END IF;

        -- Fetch Malaysia pricing settings
        SELECT COALESCE(NULLIF(value, '')::NUMERIC, 3600) INTO v_myr_rate
        FROM public.site_settings WHERE key = 'myr_exchange_rate' LIMIT 1;
        IF v_myr_rate IS NULL OR v_myr_rate <= 0 THEN v_myr_rate := 3600; END IF;

        SELECT COALESCE(NULLIF(value, '')::NUMERIC, 0) INTO v_my_markup
        FROM public.site_settings WHERE key = 'my_price_markup_percent' LIMIT 1;
        IF v_my_markup IS NULL THEN v_my_markup := 0; END IF;

        SELECT COALESCE(NULLIF(TRIM(value), ''), 'none') INTO v_my_rounding
        FROM public.site_settings WHERE key = 'my_price_rounding' LIMIT 1;
        IF v_my_rounding IS NULL THEN v_my_rounding := 'none'; END IF;
    END IF;

    -- 5. Calculate subtotal, verify stock & determine active flash sale prices (with target_market filter & MY markup if applicable)
    FOR v_cart_item IN 
        SELECT
            ci.variant_id,
            ci.quantity,
            pv.stock,
            pv.price AS regular_price,
            pv.name AS variant_name,
            p.name AS product_name,
            pv.sku,
            pv.is_active AS variant_active,
            p.is_active AS product_active
        FROM public.cart_items ci
        JOIN public.product_variants pv ON ci.variant_id = pv.id
        JOIN public.products p ON pv.product_id = p.id
        WHERE ci.cart_id = v_cart_id
        FOR UPDATE OF pv
    LOOP
        IF NOT v_cart_item.product_active OR NOT v_cart_item.variant_active THEN
            RETURN jsonb_build_object(
              'success', false,
              'message', 'Produk "' || v_cart_item.product_name || '" saat ini tidak aktif.',
              'code', 'PRODUCT_INACTIVE'
            );
        END IF;

        IF v_cart_item.stock < v_cart_item.quantity THEN
            RETURN jsonb_build_object(
              'success', false,
              'message', 'Stok produk ' || v_cart_item.product_name || ' (' || v_cart_item.variant_name || ') tidak mencukupi (sisa: ' || v_cart_item.stock || ').',
              'code', 'STOCK_INSUFFICIENT'
            );
        END IF;

        -- Check active flash sale (enforce target_market = 'ALL' OR target_market = v_address_country)
        v_actual_price := v_cart_item.regular_price;
        v_flash_sale_item_id := NULL;

        SELECT fsi.id, fsi.sale_price INTO v_flash_sale_item_id, v_actual_price
        FROM public.flash_sale_items fsi
        JOIN public.flash_sales fs ON fs.id = fsi.flash_sale_id
        WHERE fsi.variant_id = v_cart_item.variant_id
          AND fs.is_active = true
          AND fs.starts_at <= now()
          AND fs.ends_at > now()
          AND (fsi.quota = 0 OR fsi.sold_count < fsi.quota)
          AND (fs.target_market = 'ALL' OR fs.target_market = v_address_country)
        LIMIT 1;

        IF v_actual_price IS NULL THEN
            v_actual_price := v_cart_item.regular_price;
        END IF;

        -- Apply Malaysia pricing engine if shipping to MY
        IF v_address_country = 'MY' THEN
            SELECT price_myr, charged_idr INTO v_calc_res
            FROM public.get_my_price(v_actual_price, v_my_markup, v_myr_rate, v_my_rounding);
            v_actual_price := v_calc_res.charged_idr;
        END IF;

        v_item_subtotal := v_actual_price * v_cart_item.quantity;
        v_subtotal := v_subtotal + v_item_subtotal;
    END LOOP;

    -- 6. Validate voucher if provided (using validate_voucher with country parameter)
    IF p_voucher_code IS NOT NULL AND TRIM(p_voucher_code) <> '' THEN
        v_voucher_result := public.validate_voucher(p_voucher_code, v_subtotal, p_user_id, v_address_country);

        IF (v_voucher_result->>'valid')::BOOLEAN = true THEN
            v_voucher_id := (v_voucher_result->>'voucher_id')::UUID;
            v_discount_amount := (v_voucher_result->>'discount_amount')::BIGINT;
        ELSE
            RETURN jsonb_build_object(
              'success', false,
              'message', COALESCE(v_voucher_result->>'message', 'Voucher tidak valid.'),
              'code', COALESCE(v_voucher_result->>'code', 'VOUCHER_INVALID')
            );
        END IF;
    END IF;

    -- 7. Final total
    v_total_amount := GREATEST(0, v_subtotal + v_shipping_cost + v_payment_fee - v_discount_amount);

    -- 8. Validate QRIS cross-border transaction limit (max Rp 10.000.000)
    IF v_address_country = 'MY' AND v_total_amount > 10000000 THEN
        RETURN jsonb_build_object(
          'success', false,
          'message', 'Total transaksi melebihi batas regulasi QRIS Antarnegara (Rp 10.000.000). Silakan bagi menjadi 2 pesanan.',
          'code', 'QRIS_LIMIT_EXCEEDED'
        );
    END IF;

    -- Calculate total in MYR snapshot if MY
    IF v_address_country = 'MY' THEN
        v_total_myr := ROUND((v_total_amount::NUMERIC / v_myr_rate), 2);
    END IF;

    -- 9. Generate order number (ORD-YYYYMMDD-XXXXX)
    v_date := TO_CHAR(NOW(), 'YYYYMMDD');
    LOOP
        v_random := LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
        v_order_number := 'ORD-' || v_date || '-' || v_random;
        SELECT EXISTS(SELECT 1 FROM public.orders WHERE order_number = v_order_number) INTO v_exists;
        EXIT WHEN NOT v_exists;
    END LOOP;

    -- 10. Insert orders record (with Snapshot columns R4)
    INSERT INTO public.orders (
        user_id, order_number, status, subtotal, shipping_cost, discount_amount, total_amount, payment_fee, payment_channel, notes, voucher_id,
        country_code, exchange_rate_at_order, markup_percent_at_order, total_myr
    ) VALUES (
        p_user_id, v_order_number, 'pending_payment', v_subtotal, v_shipping_cost, v_discount_amount, v_total_amount, v_payment_fee, p_payment_channel, p_notes, v_voucher_id,
        v_address_country,
        CASE WHEN v_address_country = 'MY' THEN v_myr_rate ELSE NULL END,
        CASE WHEN v_address_country = 'MY' THEN v_my_markup ELSE NULL END,
        v_total_myr
    ) RETURNING id INTO v_order_id;

    -- 11. Insert order items, deduct variant stock, update flash sale & log mutation with unit_price_myr snapshot
    FOR v_cart_item IN 
        SELECT
            ci.variant_id,
            ci.quantity,
            pv.price AS regular_price,
            pv.name AS variant_name,
            p.name AS product_name,
            pv.sku,
            pv.stock
        FROM public.cart_items ci
        JOIN public.product_variants pv ON ci.variant_id = pv.id
        JOIN public.products p ON pv.product_id = p.id
        WHERE ci.cart_id = v_cart_id
    LOOP
        v_actual_price := v_cart_item.regular_price;
        v_flash_sale_item_id := NULL;
        v_price_myr := NULL;

        SELECT fsi.id, fsi.sale_price INTO v_flash_sale_item_id, v_actual_price
        FROM public.flash_sale_items fsi
        JOIN public.flash_sales fs ON fs.id = fsi.flash_sale_id
        WHERE fsi.variant_id = v_cart_item.variant_id
          AND fs.is_active = true
          AND fs.starts_at <= now()
          AND fs.ends_at > now()
          AND (fsi.quota = 0 OR fsi.sold_count < fsi.quota)
          AND (fs.target_market = 'ALL' OR fs.target_market = v_address_country)
        LIMIT 1;

        IF v_actual_price IS NULL THEN
            v_actual_price := v_cart_item.regular_price;
        END IF;

        IF v_address_country = 'MY' THEN
            SELECT price_myr, charged_idr INTO v_calc_res
            FROM public.get_my_price(v_actual_price, v_my_markup, v_myr_rate, v_my_rounding);
            v_actual_price := v_calc_res.charged_idr;
            v_price_myr := v_calc_res.price_myr;
        END IF;

        v_item_subtotal := v_actual_price * v_cart_item.quantity;

        INSERT INTO public.order_items (
            order_id, variant_id, flash_sale_item_id, product_name, variant_name, sku, price, quantity, subtotal, unit_price_myr
        ) VALUES (
            v_order_id,
            v_cart_item.variant_id,
            v_flash_sale_item_id,
            v_cart_item.product_name,
            v_cart_item.variant_name,
            v_cart_item.sku,
            v_actual_price,
            v_cart_item.quantity,
            v_item_subtotal,
            v_price_myr
        ) RETURNING id INTO v_order_item_id;

        -- Deduct stock
        UPDATE public.product_variants
        SET stock = stock - v_cart_item.quantity
        WHERE id = v_cart_item.variant_id;

        -- Record mutation with order_item_id
        INSERT INTO public.stock_mutations (variant_id, order_item_id, type, qty, qty_before, qty_after, note)
        VALUES (
          v_cart_item.variant_id,
          v_order_item_id,
          'out',
          v_cart_item.quantity,
          v_cart_item.stock,
          v_cart_item.stock - v_cart_item.quantity,
          'Order: ' || v_order_number
        );

        -- Update flash sale sold count if applicable
        IF v_flash_sale_item_id IS NOT NULL THEN
            UPDATE public.flash_sale_items
            SET sold_count = sold_count + v_cart_item.quantity
            WHERE id = v_flash_sale_item_id;
        END IF;
    END LOOP;

    -- 12. Insert order shipping details (including country_code)
    INSERT INTO public.order_shipping (
        order_id, recipient_name, phone, full_address, province_name, city_name, district_name, postal_code, country_code, courier_name
    ) VALUES (
        v_order_id,
        v_user_address.recipient_name,
        v_user_address.phone,
        v_user_address.full_address,
        v_user_address.province_name,
        v_user_address.city_name,
        v_user_address.district_name,
        v_user_address.postal_code,
        v_address_country,
        COALESCE(p_courier_name, 'Standard')
    );

    -- 13. Record voucher usage & increment count
    IF v_voucher_id IS NOT NULL THEN
        INSERT INTO public.voucher_usages (voucher_id, user_id, order_id, discount_amount)
        VALUES (v_voucher_id, p_user_id, v_order_id, v_discount_amount);

        UPDATE public.vouchers
        SET used_count = used_count + 1
        WHERE id = v_voucher_id;
    END IF;

    -- 14. Insert initial payment record
    INSERT INTO public.payments (
        order_id, amount, payment_fee, payment_channel, status, gateway_order_id
    ) VALUES (
        v_order_id, v_total_amount, v_payment_fee, p_payment_channel, 'pending', v_order_number
    );

    -- 15. Clear cart items
    DELETE FROM public.cart_items WHERE cart_id = v_cart_id;

    RETURN jsonb_build_object(
        'success', true,
        'data', jsonb_build_object(
            'order_id', v_order_id,
            'order_number', v_order_number,
            'subtotal', v_subtotal,
            'shipping_cost', v_shipping_cost,
            'discount_amount', v_discount_amount,
            'payment_fee', v_payment_fee,
            'payment_channel', p_payment_channel,
            'total_amount', v_total_amount,
            'status', 'pending_payment',
            'total_myr', v_total_myr
        )
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', 'Terjadi kesalahan: ' || SQLERRM,
        'code', 'ORDER_ERROR'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- ==============================================================================
-- ROLLBACK SCRIPT (Run only to rollback this migration)
-- ==============================================================================
-- BEGIN;
-- ALTER TABLE public.flash_sales
--     DROP CONSTRAINT IF EXISTS flash_sales_target_market_check,
--     DROP COLUMN IF EXISTS target_market;
--
-- DELETE FROM public.site_settings WHERE key IN ('free_shipping_threshold_idr', 'free_shipping_threshold_myr');
-- COMMIT;

