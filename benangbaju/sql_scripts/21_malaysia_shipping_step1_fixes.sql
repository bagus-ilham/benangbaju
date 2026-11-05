-- ==============================================================================
-- Migration: 20261104161500_malaysia_shipping_step1_fixes.sql
-- Step 1 Fixes:
-- 1. admin_update_shipping_zone: preserve zone country_code (prevent MY overwritten as ID)
-- 2. admin_update_product & admin_create_product: support clearing size_guide_inch / hs_code / size_guide
-- 3. create_order: non-negative checks, fraud check, safe regex for MY postcodes, order_item_id in stock_mutations
-- 4. cancel_order: record order_item_id in stock_mutations
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. admin_create_product & admin_update_product
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_create_product(
  p_product jsonb,
  p_variants jsonb,
  p_images jsonb,
  p_links jsonb,
  p_collections text[]
) RETURNS jsonb AS $$
DECLARE
  v_product_id uuid;
  v_variant_idx int;
  v_variant jsonb;
  v_variant_id uuid;
  v_variant_ids uuid[];
  v_attr jsonb;
  v_image jsonb;
  v_link jsonb;
  v_collection_id uuid;
BEGIN
  -- 1. Insert product
  INSERT INTO public.products (
    category_id, name, slug, description, short_description, weight_gram,
    is_featured, is_active, meta_title, meta_description, size_guide, size_guide_inch, care_guide, hs_code
  ) VALUES (
    (p_product->>'category_id')::uuid,
    p_product->>'name',
    p_product->>'slug',
    p_product->>'description',
    p_product->>'short_description',
    (p_product->>'weight_gram')::numeric,
    COALESCE((p_product->>'is_featured')::boolean, false),
    COALESCE((p_product->>'is_active')::boolean, true),
    p_product->>'meta_title',
    p_product->>'meta_description',
    NULLIF(p_product->>'size_guide', ''),
    NULLIF(p_product->>'size_guide_inch', ''),
    NULLIF(p_product->>'care_guide', ''),
    NULLIF(p_product->>'hs_code', '')
  ) RETURNING id INTO v_product_id;

  -- 2. Insert variants and attributes
  IF jsonb_array_length(p_variants) > 0 THEN
    FOR v_variant_idx IN 0 .. jsonb_array_length(p_variants) - 1 LOOP
      v_variant := p_variants->v_variant_idx;
      
      INSERT INTO public.product_variants (
        product_id, sku, name, price, compare_price, stock, weight_gram, is_active
      ) VALUES (
        v_product_id,
        v_variant->>'sku',
        v_variant->>'name',
        (v_variant->>'price')::bigint,
        (v_variant->>'compare_price')::bigint,
        (v_variant->>'stock')::int,
        (v_variant->>'weight_gram')::numeric,
        COALESCE((v_variant->>'is_active')::boolean, true)
      ) RETURNING id INTO v_variant_id;
      
      v_variant_ids := array_append(v_variant_ids, v_variant_id);

      IF v_variant ? 'attrs' AND jsonb_array_length(v_variant->'attrs') > 0 THEN
        FOR v_attr IN SELECT * FROM jsonb_array_elements(v_variant->'attrs') LOOP
          INSERT INTO public.product_variant_attrs (
            variant_id, attr_name, attr_value
          ) VALUES (
            v_variant_id,
            v_attr->>'attr_name',
            v_attr->>'attr_value'
          );
        END LOOP;
      END IF;
    END LOOP;
  END IF;

  -- 3. Insert images
  IF jsonb_array_length(p_images) > 0 THEN
    FOR v_image IN SELECT * FROM jsonb_array_elements(p_images) LOOP
      INSERT INTO public.product_images (
        product_id, variant_id, url, alt_text, is_primary, sort_order
      ) VALUES (
        v_product_id,
        CASE 
          WHEN v_image->>'variant_idx' IS NOT NULL THEN v_variant_ids[(v_image->>'variant_idx')::int + 1]
          ELSE NULL
        END,
        v_image->>'url',
        v_image->>'alt_text',
        COALESCE((v_image->>'is_primary')::boolean, false),
        COALESCE((v_image->>'sort_order')::int, 0)
      );
    END LOOP;
  END IF;

  -- 4. Insert marketplace links
  IF jsonb_array_length(p_links) > 0 THEN
    FOR v_link IN SELECT * FROM jsonb_array_elements(p_links) LOOP
      INSERT INTO public.product_marketplace_links (
        product_id, platform, url, label, sort_order
      ) VALUES (
        v_product_id,
        v_link->>'platform',
        v_link->>'url',
        v_link->>'label',
        COALESCE((v_link->>'sort_order')::int, 0)
      );
    END LOOP;
  END IF;

  -- 5. Insert collections
  IF array_length(p_collections, 1) > 0 THEN
    FOREACH v_collection_id IN ARRAY p_collections LOOP
      INSERT INTO public.collection_products (
        product_id, collection_id
      ) VALUES (
        v_product_id,
        v_collection_id::uuid
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', true, 'data', jsonb_build_object('id', v_product_id));
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', jsonb_build_object('code', SQLSTATE, 'message', SQLERRM));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.admin_update_product(
  p_product_id uuid,
  p_product jsonb,
  p_variants_to_upsert jsonb,
  p_variant_ids_to_delete uuid[],
  p_images_to_upsert jsonb,
  p_image_ids_to_delete uuid[],
  p_links_to_upsert jsonb,
  p_link_ids_to_delete uuid[],
  p_collections text[]
) RETURNS jsonb AS $$
DECLARE
  v_variant jsonb;
  v_variant_id uuid;
  v_attr jsonb;
  v_image jsonb;
  v_link jsonb;
  v_collection_id uuid;
BEGIN
  -- 1. Update product (support clearing nullable fields by checking key existence)
  IF p_product IS NOT NULL AND p_product != '{}'::jsonb THEN
    UPDATE public.products SET
      category_id = COALESCE((p_product->>'category_id')::uuid, category_id),
      name = COALESCE(p_product->>'name', name),
      slug = COALESCE(p_product->>'slug', slug),
      description = COALESCE(p_product->>'description', description),
      short_description = COALESCE(p_product->>'short_description', short_description),
      weight_gram = COALESCE((p_product->>'weight_gram')::numeric, weight_gram),
      is_featured = COALESCE((p_product->>'is_featured')::boolean, is_featured),
      is_active = COALESCE((p_product->>'is_active')::boolean, is_active),
      meta_title = COALESCE(p_product->>'meta_title', meta_title),
      meta_description = COALESCE(p_product->>'meta_description', meta_description),
      size_guide = CASE WHEN p_product ? 'size_guide' THEN NULLIF(p_product->>'size_guide', '') ELSE size_guide END,
      size_guide_inch = CASE WHEN p_product ? 'size_guide_inch' THEN NULLIF(p_product->>'size_guide_inch', '') ELSE size_guide_inch END,
      care_guide = CASE WHEN p_product ? 'care_guide' THEN NULLIF(p_product->>'care_guide', '') ELSE care_guide END,
      hs_code = CASE WHEN p_product ? 'hs_code' THEN NULLIF(p_product->>'hs_code', '') ELSE hs_code END,
      updated_at = NOW()
    WHERE id = p_product_id;
  END IF;

  -- 2. Delete components
  IF array_length(p_variant_ids_to_delete, 1) > 0 THEN
    DELETE FROM public.product_variants WHERE id = ANY(p_variant_ids_to_delete);
  END IF;
  
  IF array_length(p_image_ids_to_delete, 1) > 0 THEN
    DELETE FROM public.product_images WHERE id = ANY(p_image_ids_to_delete);
  END IF;
  
  IF array_length(p_link_ids_to_delete, 1) > 0 THEN
    DELETE FROM public.product_marketplace_links WHERE id = ANY(p_link_ids_to_delete);
  END IF;

  -- 3. Upsert variants and attributes
  IF jsonb_array_length(p_variants_to_upsert) > 0 THEN
    FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants_to_upsert) LOOP
      IF v_variant->>'id' IS NOT NULL THEN
        UPDATE public.product_variants SET
          sku = COALESCE(v_variant->>'sku', sku),
          name = COALESCE(v_variant->>'name', name),
          price = COALESCE((v_variant->>'price')::bigint, price),
          compare_price = (v_variant->>'compare_price')::bigint,
          stock = COALESCE((v_variant->>'stock')::int, stock),
          weight_gram = COALESCE((v_variant->>'weight_gram')::numeric, weight_gram),
          is_active = COALESCE((v_variant->>'is_active')::boolean, is_active)
        WHERE id = (v_variant->>'id')::uuid;
        v_variant_id := (v_variant->>'id')::uuid;
        
        DELETE FROM public.product_variant_attrs WHERE variant_id = v_variant_id;
      ELSE
        INSERT INTO public.product_variants (
          product_id, sku, name, price, compare_price, stock, weight_gram, is_active
        ) VALUES (
          p_product_id,
          v_variant->>'sku',
          v_variant->>'name',
          (v_variant->>'price')::bigint,
          (v_variant->>'compare_price')::bigint,
          (v_variant->>'stock')::int,
          (v_variant->>'weight_gram')::numeric,
          COALESCE((v_variant->>'is_active')::boolean, true)
        ) RETURNING id INTO v_variant_id;
      END IF;

      IF v_variant ? 'attrs' AND jsonb_array_length(v_variant->'attrs') > 0 THEN
        FOR v_attr IN SELECT * FROM jsonb_array_elements(v_variant->'attrs') LOOP
          INSERT INTO public.product_variant_attrs (
            variant_id, attr_name, attr_value
          ) VALUES (
            v_variant_id,
            v_attr->>'attr_name',
            v_attr->>'attr_value'
          );
        END LOOP;
      END IF;
    END LOOP;
  END IF;

  -- 4. Upsert images
  IF jsonb_array_length(p_images_to_upsert) > 0 THEN
    FOR v_image IN SELECT * FROM jsonb_array_elements(p_images_to_upsert) LOOP
      IF v_image->>'id' IS NOT NULL THEN
        UPDATE public.product_images SET
          variant_id = (v_image->>'variant_id')::uuid,
          url = COALESCE(v_image->>'url', url),
          alt_text = COALESCE(v_image->>'alt_text', alt_text),
          is_primary = COALESCE((v_image->>'is_primary')::boolean, is_primary),
          sort_order = COALESCE((v_image->>'sort_order')::int, sort_order)
        WHERE id = (v_image->>'id')::uuid;
      ELSE
        INSERT INTO public.product_images (
          product_id, variant_id, url, alt_text, is_primary, sort_order
        ) VALUES (
          p_product_id,
          (v_image->>'variant_id')::uuid,
          v_image->>'url',
          v_image->>'alt_text',
          COALESCE((v_image->>'is_primary')::boolean, false),
          COALESCE((v_image->>'sort_order')::int, 0)
        );
      END IF;
    END LOOP;
  END IF;

  -- 5. Upsert marketplace links
  IF jsonb_array_length(p_links_to_upsert) > 0 THEN
    FOR v_link IN SELECT * FROM jsonb_array_elements(p_links_to_upsert) LOOP
      IF v_link->>'id' IS NOT NULL THEN
        UPDATE public.product_marketplace_links SET
          platform = COALESCE(v_link->>'platform', platform),
          url = COALESCE(v_link->>'url', url),
          label = COALESCE(v_link->>'label', label),
          sort_order = COALESCE((v_link->>'sort_order')::int, sort_order)
        WHERE id = (v_link->>'id')::uuid;
      ELSE
        INSERT INTO public.product_marketplace_links (
          product_id, platform, url, label, sort_order
        ) VALUES (
          p_product_id,
          v_link->>'platform',
          v_link->>'url',
          v_link->>'label',
          COALESCE((v_link->>'sort_order')::int, 0)
        );
      END IF;
    END LOOP;
  END IF;

  -- 6. Update collections
  DELETE FROM public.collection_products WHERE product_id = p_product_id;
  IF array_length(p_collections, 1) > 0 THEN
    FOREACH v_collection_id IN ARRAY p_collections LOOP
      INSERT INTO public.collection_products (
        product_id, collection_id
      ) VALUES (
        p_product_id,
        v_collection_id::uuid
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', true, 'data', jsonb_build_object('id', p_product_id));
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', jsonb_build_object('code', SQLSTATE, 'message', SQLERRM));
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 2. admin_update_shipping_zone (Preserve Zone Country Code)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_update_shipping_zone(
  p_zone_id uuid,
  p_zone jsonb,
  p_provinces text[]
) RETURNS jsonb AS $$
DECLARE
  v_province text;
  v_country text;
  v_existing_country text;
BEGIN
  -- Determine country: prefer passed country_code, otherwise preserve existing coverage country, fallback to ID
  SELECT szc.country_code INTO v_existing_country
  FROM public.shipping_zone_coverage szc
  WHERE szc.zone_id = p_zone_id
  LIMIT 1;

  v_country := COALESCE(p_zone->>'country_code', v_existing_country, 'ID');

  IF p_zone IS NOT NULL AND p_zone != '{}'::jsonb THEN
    UPDATE public.shipping_zones SET
      name = COALESCE(p_zone->>'name', name),
      description = COALESCE(p_zone->>'description', description),
      is_active = COALESCE((p_zone->>'is_active')::boolean, is_active)
    WHERE id = p_zone_id;
  END IF;

  IF p_provinces IS NOT NULL THEN
    DELETE FROM public.shipping_zone_coverage WHERE zone_id = p_zone_id;

    IF array_length(p_provinces, 1) > 0 THEN
      FOREACH v_province IN ARRAY p_provinces LOOP
        INSERT INTO public.shipping_zone_coverage (
          zone_id, country_code, province_name
        ) VALUES (
          p_zone_id,
          v_country,
          v_province
        );
      END LOOP;
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'data', jsonb_build_object('id', p_zone_id));
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', jsonb_build_object('code', SQLSTATE, 'message', SQLERRM));
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 3. cancel_order (Include order_item_id in stock_mutations)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_order(
  p_order_id UUID,
  p_cancel_reason TEXT DEFAULT 'Dibatalkan oleh customer'
)
RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
BEGIN
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Pesanan tidak ditemukan', 'code', 'ORDER_NOT_FOUND');
  END IF;

  -- Allow order owner, admin, or background worker/cron (where auth.uid() IS NULL)
  IF auth.uid() IS NOT NULL AND v_order.user_id != auth.uid() AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak', 'code', 'FORBIDDEN');
  END IF;

  IF v_order.status != 'pending_payment' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Pesanan hanya bisa dibatalkan saat status menunggu pembayaran',
      'code', 'ORDER_WRONG_STATUS'
    );
  END IF;

  -- Restore variant stock
  FOR v_item IN
    SELECT oi.*, pv.stock AS current_stock
    FROM public.order_items oi
    JOIN public.product_variants pv ON pv.id = oi.variant_id
    WHERE oi.order_id = p_order_id
    FOR UPDATE OF pv
  LOOP
    UPDATE public.product_variants
    SET stock = stock + v_item.quantity
    WHERE id = v_item.variant_id;

    INSERT INTO public.stock_mutations (variant_id, order_item_id, type, qty, qty_before, qty_after, note)
    VALUES (
      v_item.variant_id,
      v_item.id,
      'released',
      v_item.quantity,
      v_item.current_stock,
      v_item.current_stock + v_item.quantity,
      'Order cancelled: ' || v_order.order_number
    );

    IF v_item.flash_sale_item_id IS NOT NULL THEN
      UPDATE public.flash_sale_items
      SET sold_count = GREATEST(sold_count - v_item.quantity, 0)
      WHERE id = v_item.flash_sale_item_id;
    END IF;
  END LOOP;

  UPDATE public.orders
  SET status = 'cancelled',
      cancel_reason = p_cancel_reason,
      cancelled_at = now(),
      updated_at = now()
  WHERE id = p_order_id;

  UPDATE public.payments
  SET status = 'expired',
      updated_at = now()
  WHERE order_id = p_order_id AND status = 'pending';

  IF v_order.voucher_id IS NOT NULL THEN
    DELETE FROM public.voucher_usages WHERE order_id = p_order_id;
    UPDATE public.vouchers SET used_count = GREATEST(used_count - 1, 0) WHERE id = v_order.voucher_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'order_id', p_order_id,
      'order_number', v_order.order_number,
      'status', 'cancelled'
    )
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', 'Terjadi kesalahan saat membatalkan pesanan: ' || SQLERRM,
    'code', 'CANCEL_ERROR'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 4. create_order (Include fraud check, non-negative checks, safe MY postcode regex, order_item_id in mutations)
-- ------------------------------------------------------------------------------
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
        -- Postcode validation (West Malaysia only: 01000 - 86999) using safe regex
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
    END IF;

    -- 5. Calculate subtotal, verify stock & determine active flash sale prices
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

        -- Check active flash sale
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
        LIMIT 1;

        IF v_actual_price IS NULL THEN
            v_actual_price := v_cart_item.regular_price;
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

    -- 9. Generate order number (ORD-YYYYMMDD-XXXXX)
    v_date := TO_CHAR(NOW(), 'YYYYMMDD');
    LOOP
        v_random := LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
        v_order_number := 'ORD-' || v_date || '-' || v_random;
        SELECT EXISTS(SELECT 1 FROM public.orders WHERE order_number = v_order_number) INTO v_exists;
        EXIT WHEN NOT v_exists;
    END LOOP;

    -- 10. Insert orders record
    INSERT INTO public.orders (
        user_id, order_number, status, subtotal, shipping_cost, discount_amount, total_amount, payment_fee, payment_channel, notes, voucher_id
    ) VALUES (
        p_user_id, v_order_number, 'pending_payment', v_subtotal, v_shipping_cost, v_discount_amount, v_total_amount, v_payment_fee, p_payment_channel, p_notes, v_voucher_id
    ) RETURNING id INTO v_order_id;

    -- 11. Insert order items, deduct variant stock, update flash sale & log mutation with order_item_id
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

        SELECT fsi.id, fsi.sale_price INTO v_flash_sale_item_id, v_actual_price
        FROM public.flash_sale_items fsi
        JOIN public.flash_sales fs ON fs.id = fsi.flash_sale_id
        WHERE fsi.variant_id = v_cart_item.variant_id
          AND fs.is_active = true
          AND fs.starts_at <= now()
          AND fs.ends_at > now()
          AND (fsi.quota = 0 OR fsi.sold_count < fsi.quota)
        LIMIT 1;

        IF v_actual_price IS NULL THEN
            v_actual_price := v_cart_item.regular_price;
        END IF;

        v_item_subtotal := v_actual_price * v_cart_item.quantity;

        INSERT INTO public.order_items (
            order_id, variant_id, flash_sale_item_id, product_name, variant_name, sku, price, quantity, subtotal
        ) VALUES (
            v_order_id, v_cart_item.variant_id, v_flash_sale_item_id, v_cart_item.product_name, v_cart_item.variant_name, v_cart_item.sku, v_actual_price, v_cart_item.quantity, v_item_subtotal
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

        -- Flash sale quota count
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

    -- 15. Clear cart
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
            'status', 'pending_payment'
        )
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', 'Terjadi kesalahan: ' || SQLERRM, 'code', 'ORDER_ERROR');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
