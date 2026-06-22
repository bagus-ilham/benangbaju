-- Migration: 20260622084900_improve_create_order_error_reporting.sql
-- Improve exception handling in create_order to expose exact Postgres database error messages

CREATE OR REPLACE FUNCTION public.create_order(
  p_user_id UUID,
  p_address_id UUID,
  p_voucher_code TEXT DEFAULT NULL,
  p_courier_name TEXT DEFAULT NULL,
  p_shipping_cost NUMERIC DEFAULT 0,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_cart_id UUID;
  v_item RECORD;
  v_order_id UUID;
  v_order_number TEXT;
  v_subtotal NUMERIC := 0;
  v_discount_amount NUMERIC := 0;
  v_total_amount NUMERIC;
  v_voucher_id UUID;
  v_voucher_result JSONB;
  v_address RECORD;
  v_total_weight INT := 0;
  v_cancelled_count INT;
  v_actual_price NUMERIC;
  v_flash_sale_item_id UUID;
  v_item_subtotal NUMERIC;
BEGIN
  -- ========== FRAUD CHECK ==========
  SELECT COUNT(*) INTO v_cancelled_count
  FROM orders
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

  -- ========== GET CART ==========
  SELECT id INTO v_cart_id
  FROM carts
  WHERE user_id = p_user_id
  LIMIT 1;

  IF v_cart_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Keranjang belanja kosong', 'code', 'CART_EMPTY');
  END IF;

  -- Check cart has items
  IF NOT EXISTS (SELECT 1 FROM cart_items WHERE cart_id = v_cart_id) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Keranjang belanja kosong', 'code', 'CART_EMPTY');
  END IF;

  -- ========== VALIDATE ADDRESS ==========
  SELECT * INTO v_address
  FROM user_addresses
  WHERE id = p_address_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Alamat pengiriman tidak ditemukan', 'code', 'ADDRESS_NOT_FOUND');
  END IF;

  -- ========== VALIDATE & PROCESS CART ITEMS ==========
  v_order_id := uuid_generate_v4();
  v_order_number := public.generate_order_number();

  FOR v_item IN
    SELECT
      ci.id AS cart_item_id,
      ci.variant_id,
      ci.quantity,
      pv.id AS pv_id,
      pv.stock,
      pv.price AS regular_price,
      pv.name AS variant_name,
      pv.sku,
      pv.weight_gram AS variant_weight,
      pv.is_active AS variant_active,
      p.id AS product_id,
      p.name AS product_name,
      p.weight_gram AS product_weight,
      p.is_active AS product_active
    FROM cart_items ci
    JOIN product_variants pv ON pv.id = ci.variant_id
    JOIN products p ON p.id = pv.product_id
    WHERE ci.cart_id = v_cart_id
    FOR UPDATE OF pv  -- Lock variant rows
  LOOP
    -- Validate active
    IF NOT v_item.product_active OR NOT v_item.variant_active THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', format('Produk "%s" tidak tersedia lagi', v_item.product_name),
        'code', 'PRODUCT_INACTIVE'
      );
    END IF;

    -- Validate stock
    IF v_item.stock < v_item.quantity THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', format('Stok %s tidak mencukupi (tersedia: %s)', v_item.variant_name, v_item.stock),
        'code', 'STOCK_INSUFFICIENT'
      );
    END IF;

    -- Check flash sale price
    v_actual_price := v_item.regular_price;
    v_flash_sale_item_id := NULL;

    SELECT fsi.id, fsi.sale_price INTO v_flash_sale_item_id, v_actual_price
    FROM flash_sale_items fsi
    JOIN flash_sales fs ON fs.id = fsi.flash_sale_id
    WHERE fsi.variant_id = v_item.variant_id
      AND fs.is_active = true
      AND fs.starts_at <= now()
      AND fs.ends_at > now()
      AND (fsi.quota = 0 OR fsi.sold_count < fsi.quota)
    LIMIT 1;

    IF v_actual_price IS NULL THEN
      v_actual_price := v_item.regular_price;
    END IF;

    v_item_subtotal := v_actual_price * v_item.quantity;
    v_subtotal := v_subtotal + v_item_subtotal;
    v_total_weight := v_total_weight + COALESCE(v_item.variant_weight, v_item.product_weight, 0) * v_item.quantity;

    -- Insert order item (snapshot)
    INSERT INTO order_items (order_id, variant_id, flash_sale_item_id, product_name, variant_name, sku, price, quantity, subtotal)
    VALUES (v_order_id, v_item.variant_id, v_flash_sale_item_id, v_item.product_name, v_item.variant_name, v_item.sku, v_actual_price, v_item.quantity, v_item_subtotal);

    -- Deduct stock
    UPDATE product_variants SET stock = stock - v_item.quantity WHERE id = v_item.variant_id;

    -- Record stock mutation
    INSERT INTO stock_mutations (variant_id, type, qty, qty_before, qty_after, note)
    VALUES (v_item.variant_id, 'out', v_item.quantity, v_item.stock, v_item.stock - v_item.quantity, 'Order: ' || v_order_number);

    -- Update flash sale sold_count
    IF v_flash_sale_item_id IS NOT NULL THEN
      UPDATE flash_sale_items SET sold_count = sold_count + v_item.quantity WHERE id = v_flash_sale_item_id;
    END IF;
  END LOOP;

  -- ========== VALIDATE VOUCHER ==========
  IF p_voucher_code IS NOT NULL AND p_voucher_code != '' THEN
    v_voucher_result := public.validate_voucher(p_voucher_code, v_subtotal, p_user_id);

    IF (v_voucher_result->>'valid')::boolean = true THEN
      v_voucher_id := (v_voucher_result->>'voucher_id')::UUID;
      v_discount_amount := (v_voucher_result->>'discount_amount')::NUMERIC;
    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'message', v_voucher_result->>'message',
        'code', v_voucher_result->>'code'
      );
    END IF;
  END IF;

  -- ========== VALIDATE SHIPPING ==========
  -- Cross-check shipping cost from DB (use provided cost but validate zone exists)
  IF p_shipping_cost < 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Ongkos kirim tidak valid', 'code', 'INVALID_SHIPPING');
  END IF;

  -- ========== CALCULATE TOTAL ==========
  v_total_amount := v_subtotal - v_discount_amount + p_shipping_cost;

  IF v_total_amount < 0 THEN
    v_total_amount := 0;
  END IF;

  -- ========== INSERT ORDER ==========
  INSERT INTO orders (id, order_number, user_id, voucher_id, status, subtotal, shipping_cost, discount_amount, total_amount, notes)
  VALUES (v_order_id, v_order_number, p_user_id, v_voucher_id, 'pending_payment', v_subtotal, p_shipping_cost, v_discount_amount, v_total_amount, p_notes);

  -- ========== INSERT ORDER SHIPPING ==========
  INSERT INTO order_shipping (order_id, recipient_name, phone, full_address, province_name, city_name, district_name, postal_code, courier_name)
  VALUES (v_order_id, v_address.recipient_name, v_address.phone, v_address.full_address, v_address.province_name, v_address.city_name, v_address.district_name, v_address.postal_code, p_courier_name);

  -- ========== RECORD VOUCHER USAGE ==========
  IF v_voucher_id IS NOT NULL THEN
    INSERT INTO voucher_usages (voucher_id, user_id, order_id, discount_amount)
    VALUES (v_voucher_id, p_user_id, v_order_id, v_discount_amount);

    UPDATE vouchers SET used_count = used_count + 1 WHERE id = v_voucher_id;
  END IF;

  -- ========== CLEAR CART ==========
  DELETE FROM cart_items WHERE cart_id = v_cart_id;

  -- ========== CREATE PAYMENT RECORD ==========
  INSERT INTO payments (order_id, midtrans_order_id, status, amount)
  VALUES (v_order_id, v_order_number, 'pending', v_total_amount);

  -- ========== RETURN SUCCESS ==========
  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'order_id', v_order_id,
      'order_number', v_order_number,
      'subtotal', v_subtotal,
      'shipping_cost', p_shipping_cost,
      'discount_amount', v_discount_amount,
      'total_amount', v_total_amount,
      'status', 'pending_payment'
    )
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', 'Terjadi kesalahan saat membuat pesanan: ' || SQLERRM || ' [' || SQLSTATE || ']',
    'code', 'ORDER_ERROR'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_order IS 'Atomic checkout: validate cart, voucher, shipping → create order + deduct stock + clear cart with enhanced error logs';
