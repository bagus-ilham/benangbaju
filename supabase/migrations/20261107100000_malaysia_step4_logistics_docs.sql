-- ==============================================================================
-- 25_malaysia_step4_logistics_docs.sql
-- Migration for Tahap 4: Logistik, Kebijakan, Dokumen & Finishing
--
-- 1. Seed Zone 7: Malaysia Timur (East Malaysia - Sabah, Sarawak, Labuan)
-- 2. Seed shipping_zone_coverage for Zone 7 (Sabah, Sarawak, Labuan)
-- 3. Seed initial shipping_rates for Zone 7
-- 4. Update create_order RPC:
--    - Allow postal codes 01000–98999
--    - Cross-validate state vs postal code (West vs East Malaysia)
-- 5. DB Trigger on return_requests to reject returns for Malaysia orders
-- 6. Add market column to stock_notifications
-- 7. Update get_analytics_data RPC to support market filtering and total_myr
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Seed Zone 7: Malaysia Timur (East Malaysia)
-- ------------------------------------------------------------------------------
INSERT INTO public.shipping_zones (id, name, description, is_active)
VALUES (
  'e1000000-0000-0000-0000-000000000007',
  'Malaysia Timur (East Malaysia)',
  'Pengiriman Internasional ke Sabah, Sarawak, dan Wilayah Persekutuan Labuan',
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

-- ------------------------------------------------------------------------------
-- 2. Seed East Malaysia & Federal Territory States into shipping_zone_coverage
-- ------------------------------------------------------------------------------
INSERT INTO public.shipping_zone_coverage (zone_id, country_code, province_name)
VALUES
  -- Zone 6: Ensure full Federal Territory names match MALAYSIA_WEST_STATES in constants.ts
  ('e1000000-0000-0000-0000-000000000006', 'MY', 'Wilayah Persekutuan Kuala Lumpur'),
  ('e1000000-0000-0000-0000-000000000006', 'MY', 'WP Kuala Lumpur'),
  ('e1000000-0000-0000-0000-000000000006', 'MY', 'Wilayah Persekutuan Putrajaya'),
  ('e1000000-0000-0000-0000-000000000006', 'MY', 'WP Putrajaya'),
  -- Zone 7: East Malaysia
  ('e1000000-0000-0000-0000-000000000007', 'MY', 'Sabah'),
  ('e1000000-0000-0000-0000-000000000007', 'MY', 'Sarawak'),
  ('e1000000-0000-0000-0000-000000000007', 'MY', 'Wilayah Persekutuan Labuan'),
  ('e1000000-0000-0000-0000-000000000007', 'MY', 'WP Labuan'),
  ('e1000000-0000-0000-0000-000000000007', 'MY', 'Labuan')
ON CONFLICT (zone_id, country_code, province_name) DO NOTHING;

-- Ensure orders.country_code exists and backfill from order_shipping if needed
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS country_code VARCHAR(2) NOT NULL DEFAULT 'ID';

UPDATE public.orders o
SET country_code = os.country_code
FROM public.order_shipping os
WHERE os.order_id = o.id
  AND os.country_code IS NOT NULL
  AND o.country_code <> os.country_code;

-- ------------------------------------------------------------------------------
-- 3. Seed Initial Shipping Rate for East Malaysia (Zone 7)
-- ------------------------------------------------------------------------------
INSERT INTO public.shipping_rates (
  zone_id, courier_name, price_per_kg, min_weight_gram, max_weight_gram, base_price, etd_days_min, etd_days_max, is_active
)
SELECT
  'e1000000-0000-0000-0000-000000000007'::UUID,
  'International Express (East Malaysia)',
  165000,
  1000,
  30000,
  165000,
  7,
  14,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.shipping_rates WHERE zone_id = 'e1000000-0000-0000-0000-000000000007'::UUID
);

-- ------------------------------------------------------------------------------
-- 4. DB Trigger to Enforce Final Sale (No Return Requests for Malaysia Orders)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_malaysia_return_requests()
RETURNS TRIGGER AS $$
DECLARE
  v_country VARCHAR(2);
BEGIN
  -- Check order country_code or order_shipping country_code
  SELECT COALESCE(o.country_code, os.country_code, 'ID')
  INTO v_country
  FROM public.orders o
  LEFT JOIN public.order_shipping os ON os.order_id = o.id
  WHERE o.id = NEW.order_id;

  IF UPPER(v_country) = 'MY' THEN
    RAISE EXCEPTION 'International orders (Malaysia) are Final Sale and not eligible for self-service return requests.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_malaysia_return_requests ON public.return_requests;
CREATE TRIGGER trg_prevent_malaysia_return_requests
BEFORE INSERT ON public.return_requests
FOR EACH ROW
EXECUTE FUNCTION public.prevent_malaysia_return_requests();

-- ------------------------------------------------------------------------------
-- 5. Add market column on stock_notifications
-- ------------------------------------------------------------------------------
ALTER TABLE public.stock_notifications
  ADD COLUMN IF NOT EXISTS market VARCHAR(2) NOT NULL DEFAULT 'ID';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stock_notifications_market_check'
  ) THEN
    ALTER TABLE public.stock_notifications
      ADD CONSTRAINT stock_notifications_market_check CHECK (market IN ('ID', 'MY'));
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 6. Update create_order RPC
--    - Allow postcodes 01000–98999
--    - Cross-validate state vs postal code (West vs East Malaysia)
--    - Enforce flash_sale target_market and R1/R2/R4 snapshots
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
    v_postcode_num INT;
    v_is_east_state BOOLEAN := false;
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
        -- Postcode basic format check (5 digits: 01000 - 98999)
        IF v_user_address.postal_code !~ '^(0[1-9]|[1-8][0-9]|9[0-8])[0-9]{3}$' THEN
            RETURN jsonb_build_object(
              'success', false,
              'message', 'Poskod Malaysia harus berupa 5 digit angka yang valid (01000–98999).',
              'code', 'INVALID_POSTAL_CODE'
            );
        END IF;

        v_postcode_num := v_user_address.postal_code::INT;

        -- Check if selected province/state is East Malaysia
        v_is_east_state := (
            LOWER(v_user_address.province_name) LIKE '%sabah%' OR
            LOWER(v_user_address.province_name) LIKE '%sarawak%' OR
            LOWER(v_user_address.province_name) LIKE '%labuan%'
        );

        -- Cross-validation: East Malaysia states vs postal code range
        IF v_is_east_state THEN
            IF v_postcode_num < 87000 OR v_postcode_num > 98999 THEN
                RETURN jsonb_build_object(
                  'success', false,
                  'message', 'Poskod tidak sesuai dengan negeri Malaysia Timur (Sabah, Sarawak, Labuan: 87000–98999).',
                  'code', 'INVALID_POSTAL_CODE_REGION'
                );
            END IF;

            IF LOWER(v_user_address.province_name) LIKE '%labuan%' AND (v_postcode_num < 87000 OR v_postcode_num > 87999) THEN
                RETURN jsonb_build_object(
                  'success', false,
                  'message', 'Poskod Wilayah Persekutuan Labuan harus berada pada rentang 87000–87999.',
                  'code', 'INVALID_POSTAL_CODE_REGION'
                );
            END IF;

            IF LOWER(v_user_address.province_name) LIKE '%sabah%' AND (v_postcode_num < 88000 OR v_postcode_num > 91999) THEN
                RETURN jsonb_build_object(
                  'success', false,
                  'message', 'Poskod Negeri Sabah harus berada pada rentang 88000–91999.',
                  'code', 'INVALID_POSTAL_CODE_REGION'
                );
            END IF;

            IF LOWER(v_user_address.province_name) LIKE '%sarawak%' AND (v_postcode_num < 93000 OR v_postcode_num > 98999) THEN
                RETURN jsonb_build_object(
                  'success', false,
                  'message', 'Poskod Negeri Sarawak harus berada pada rentang 93000–98999.',
                  'code', 'INVALID_POSTAL_CODE_REGION'
                );
            END IF;
        ELSE
            -- Peninsular / West Malaysia state
            IF v_postcode_num >= 87000 AND v_postcode_num <= 98999 THEN
                RETURN jsonb_build_object(
                  'success', false,
                  'message', 'Poskod 87000–98999 merupakan wilayah Malaysia Timur. Sila pilih negeri Sabah, Sarawak, atau Labuan.',
                  'code', 'INVALID_POSTAL_CODE_REGION'
                );
            END IF;
        END IF;

        -- PO Box check
        IF v_user_address.full_address ~* '(p\.?\s*o\.?\s*box|peti\s*surat|karung\s*berkunci)' THEN
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
        COALESCE(p_courier_name, CASE WHEN v_address_country = 'MY' THEN 'International Express (MY)' ELSE 'Standard' END)
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

    -- 15. Empty the user's cart
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
    RETURN jsonb_build_object('success', false, 'message', 'Terjadi kesalahan: ' || SQLERRM, 'code', 'ORDER_ERROR');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 7. Update get_analytics_data RPC
--    - Support p_country_code parameter ('ALL', 'ID', 'MY')
--    - Include revenue_myr in country_breakdown
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_analytics_data(TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.get_analytics_data(TIMESTAMPTZ, TEXT);
DROP FUNCTION IF EXISTS public.get_analytics_data(TIMESTAMPTZ, VARCHAR);

CREATE OR REPLACE FUNCTION public.get_analytics_data(
  p_start_date TIMESTAMPTZ,
  p_country_code VARCHAR DEFAULT 'ALL'
)
RETURNS JSONB AS $$
DECLARE
  v_revenue_trends JSONB;
  v_top_products JSONB;
  v_total_revenue BIGINT;
  v_total_orders BIGINT;
  v_country_breakdown JSONB;
  v_filter_country VARCHAR;
BEGIN
  v_filter_country := UPPER(TRIM(COALESCE(p_country_code, 'ALL')));

  -- 1. Total revenue & orders
  SELECT
    COALESCE(SUM(o.total_amount), 0),
    COUNT(*)
  INTO v_total_revenue, v_total_orders
  FROM public.orders o
  WHERE o.status IN ('paid', 'processing', 'shipped', 'delivered', 'completed')
    AND o.created_at >= p_start_date
    AND (
      v_filter_country = 'ALL' OR
      COALESCE(o.country_code, 'ID') = v_filter_country
    );

  -- 2. Daily revenue trends
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'date', daily.d,
    'revenue', daily.rev
  )), '[]'::jsonb) INTO v_revenue_trends
  FROM (
    SELECT
      TO_CHAR(o.created_at, 'YYYY-MM-DD') AS d,
      COALESCE(SUM(o.total_amount), 0) AS rev
    FROM public.orders o
    WHERE o.status IN ('paid', 'processing', 'shipped', 'delivered', 'completed')
      AND o.created_at >= p_start_date
      AND (
        v_filter_country = 'ALL' OR
        COALESCE(o.country_code, 'ID') = v_filter_country
      )
    GROUP BY TO_CHAR(o.created_at, 'YYYY-MM-DD')
    ORDER BY d ASC
  ) daily;

  -- 3. Top products by quantity
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'name', tp.product_name,
    'quantity', tp.total_qty,
    'revenue', tp.total_rev
  )), '[]'::jsonb) INTO v_top_products
  FROM (
    SELECT
      oi.product_name,
      SUM(oi.quantity) AS total_qty,
      SUM(oi.subtotal) AS total_rev
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE o.status IN ('paid', 'processing', 'shipped', 'delivered', 'completed')
      AND o.created_at >= p_start_date
      AND (
        v_filter_country = 'ALL' OR
        COALESCE(o.country_code, 'ID') = v_filter_country
      )
    GROUP BY oi.product_name
    ORDER BY total_qty DESC
    LIMIT 5
  ) tp;

  -- 4. Country breakdown (ID vs MY) with total_myr snapshot revenue
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'country_code', cb.c_code,
    'orders_count', cb.c_orders,
    'revenue', cb.c_revenue,
    'revenue_myr', cb.c_revenue_myr
  )), '[]'::jsonb) INTO v_country_breakdown
  FROM (
    SELECT
      COALESCE(o.country_code, os.country_code, 'ID') AS c_code,
      COUNT(DISTINCT o.id) AS c_orders,
      COALESCE(SUM(o.total_amount), 0) AS c_revenue,
      COALESCE(SUM(o.total_myr), 0) AS c_revenue_myr
    FROM public.orders o
    LEFT JOIN public.order_shipping os ON os.order_id = o.id
    WHERE o.status IN ('paid', 'processing', 'shipped', 'delivered', 'completed')
      AND o.created_at >= p_start_date
    GROUP BY COALESCE(o.country_code, os.country_code, 'ID')
    ORDER BY c_code ASC
  ) cb;

  RETURN jsonb_build_object(
    'revenue_trends', v_revenue_trends,
    'top_products', v_top_products,
    'total_revenue', v_total_revenue,
    'total_orders', v_total_orders,
    'country_breakdown', v_country_breakdown
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_analytics_data IS 'Dashboard analytics: revenue trends, top products, totals, and ID vs MY breakdown with country filtering and R4 snapshots';

COMMIT;

-- ==============================================================================
-- ROLLBACK SCRIPT (For reference only - execute if rollback is needed)
-- ==============================================================================
/*
BEGIN;
DROP TRIGGER IF EXISTS trg_prevent_malaysia_return_requests ON public.return_requests;
DROP FUNCTION IF EXISTS public.prevent_malaysia_return_requests();
DELETE FROM public.shipping_rates WHERE zone_id = 'e1000000-0000-0000-0000-000000000007'::UUID;
DELETE FROM public.shipping_zone_coverage WHERE zone_id = 'e1000000-0000-0000-0000-000000000007'::UUID;
DELETE FROM public.shipping_zones WHERE id = 'e1000000-0000-0000-0000-000000000007'::UUID;
ALTER TABLE public.stock_notifications DROP CONSTRAINT IF EXISTS stock_notifications_market_check;
ALTER TABLE public.stock_notifications DROP COLUMN IF EXISTS market;
COMMIT;
*/

