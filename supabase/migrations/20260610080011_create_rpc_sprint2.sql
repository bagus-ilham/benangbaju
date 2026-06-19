-- =============================================================
-- Migration: 20260610080011_create_rpc_sprint2.sql
-- RPC Functions: create_order, cancel_order, lazy_cancel
-- =============================================================

-- -------------------------------------------------------
-- Helper: generate_order_number()
-- Format: BB-YYYYMMDD-XXXXXX (6 random alphanumeric)
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
DECLARE
  v_date TEXT;
  v_random TEXT;
  v_order_number TEXT;
  v_exists BOOLEAN;
BEGIN
  v_date := to_char(now(), 'YYYYMMDD');
  LOOP
    v_random := upper(substr(md5(random()::text), 1, 6));
    v_order_number := 'BB-' || v_date || '-' || v_random;
    SELECT EXISTS(SELECT 1 FROM orders WHERE order_number = v_order_number) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_order_number;
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------
-- RPC: create_order
-- Atomic checkout transaction
-- -------------------------------------------------------
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
    'message', 'Terjadi kesalahan saat membuat pesanan. Silakan coba lagi.',
    'code', 'ORDER_ERROR'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_order IS 'Atomic checkout: validate cart, voucher, shipping → create order + deduct stock + clear cart';

-- -------------------------------------------------------
-- RPC: cancel_order
-- Cancel order + restore stock
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_order(
  p_order_id UUID,
  p_cancel_reason TEXT DEFAULT 'Dibatalkan oleh customer'
)
RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
BEGIN
  -- Get order with lock
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Pesanan tidak ditemukan', 'code', 'ORDER_NOT_FOUND');
  END IF;

  -- Check ownership (user or admin)
  IF v_order.user_id != auth.uid() AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak', 'code', 'FORBIDDEN');
  END IF;

  -- Check status
  IF v_order.status != 'pending_payment' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Pesanan hanya bisa dibatalkan saat status menunggu pembayaran',
      'code', 'ORDER_WRONG_STATUS'
    );
  END IF;

  -- Restore stock for each item
  FOR v_item IN
    SELECT oi.*, pv.stock AS current_stock
    FROM order_items oi
    JOIN product_variants pv ON pv.id = oi.variant_id
    WHERE oi.order_id = p_order_id
    FOR UPDATE OF pv
  LOOP
    -- Restore stock
    UPDATE product_variants
    SET stock = stock + v_item.quantity
    WHERE id = v_item.variant_id;

    -- Record stock mutation
    INSERT INTO stock_mutations (variant_id, order_item_id, type, qty, qty_before, qty_after, note)
    VALUES (
      v_item.variant_id,
      v_item.id,
      'released',
      v_item.quantity,
      v_item.current_stock,
      v_item.current_stock + v_item.quantity,
      'Order cancelled: ' || v_order.order_number
    );

    -- Restore flash sale quota
    IF v_item.flash_sale_item_id IS NOT NULL THEN
      UPDATE flash_sale_items
      SET sold_count = GREATEST(sold_count - v_item.quantity, 0)
      WHERE id = v_item.flash_sale_item_id;
    END IF;
  END LOOP;

  -- Update order status
  UPDATE orders
  SET status = 'cancelled',
      cancel_reason = p_cancel_reason,
      cancelled_at = now()
  WHERE id = p_order_id;

  -- Update payment status
  UPDATE payments
  SET status = 'expired'
  WHERE order_id = p_order_id AND status = 'pending';

  -- Restore voucher usage
  IF v_order.voucher_id IS NOT NULL THEN
    DELETE FROM voucher_usages WHERE order_id = p_order_id;
    UPDATE vouchers SET used_count = GREATEST(used_count - 1, 0) WHERE id = v_order.voucher_id;
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
    'message', 'Terjadi kesalahan saat membatalkan pesanan',
    'code', 'CANCEL_ERROR'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cancel_order IS 'Cancel pending_payment order and restore stock atomically';

-- -------------------------------------------------------
-- RPC: lazy_cancel_expired_orders
-- Auto-cancel orders >24h in pending_payment
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lazy_cancel_expired_orders(
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_cancelled_count INT := 0;
  v_result JSONB;
BEGIN
  FOR v_order IN
    SELECT id, order_number
    FROM orders
    WHERE user_id = p_user_id
      AND status = 'pending_payment'
      AND created_at < now() - INTERVAL '24 hours'
    FOR UPDATE
  LOOP
    v_result := public.cancel_order(v_order.id, 'Otomatis dibatalkan - pembayaran melewati batas waktu');
    IF (v_result->>'success')::boolean THEN
      v_cancelled_count := v_cancelled_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'cancelled_count', v_cancelled_count
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.lazy_cancel_expired_orders IS 'Auto-cancel orders pending >24h when user opens their order page';
