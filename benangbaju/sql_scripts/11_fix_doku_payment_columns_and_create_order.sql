-- Migration script: Complete Midtrans to DOKU gateway column renaming and create_order RPC update
-- Fixes PostgreSQL error 42703 (column "midtrans_order_id" of relation "payments" does not exist)

BEGIN;

-- 1. Rename columns in payments table to be gateway-agnostic
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'midtrans_order_id'
    ) THEN
        ALTER TABLE payments RENAME COLUMN midtrans_order_id TO gateway_order_id;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'midtrans_transaction_id'
    ) THEN
        ALTER TABLE payments RENAME COLUMN midtrans_transaction_id TO gateway_transaction_id;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'midtrans_response'
    ) THEN
        ALTER TABLE payments RENAME COLUMN midtrans_response TO gateway_response;
    END IF;
END $$;

-- 2. Rename column in payment_logs table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_logs' AND column_name = 'midtrans_order_id'
    ) THEN
        ALTER TABLE payment_logs RENAME COLUMN midtrans_order_id TO gateway_order_id;
    END IF;
END $$;

-- 3. Update unique constraint on payment_logs
ALTER TABLE payment_logs DROP CONSTRAINT IF EXISTS payment_logs_midtrans_order_id_event_type_key;
ALTER TABLE payment_logs DROP CONSTRAINT IF EXISTS payment_logs_gateway_order_id_event_type_key;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_logs' AND column_name = 'gateway_order_id'
    ) THEN
        ALTER TABLE payment_logs 
        ADD CONSTRAINT payment_logs_gateway_order_id_event_type_key UNIQUE (gateway_order_id, event_type);
    END IF;
END $$;

COMMIT;

-- 4. Drop existing overloaded create_order functions to resolve PostgREST PGRST203 ambiguity
DROP FUNCTION IF EXISTS public.create_order(UUID, UUID, TEXT, TEXT, NUMERIC, TEXT);
DROP FUNCTION IF EXISTS public.create_order(UUID, UUID, TEXT, TEXT, BIGINT, TEXT);

-- 5. Re-create the single create_order stored function using BIGINT and gateway_order_id
CREATE OR REPLACE FUNCTION public.create_order(
    p_user_id UUID,
    p_address_id UUID,
    p_voucher_code TEXT DEFAULT NULL,
    p_courier_name TEXT DEFAULT NULL,
    p_shipping_cost BIGINT DEFAULT 0,
    p_notes TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_cart_id UUID;
    v_order_id UUID;
    v_order_number TEXT;
    v_subtotal BIGINT := 0;
    v_discount_amount BIGINT := 0;
    v_total_amount BIGINT := 0;
    v_voucher_id UUID;
    v_user_address RECORD;
    v_cart_item RECORD;
    v_item_subtotal BIGINT;
    v_shipping_cost BIGINT := COALESCE(p_shipping_cost, 0);
BEGIN
    -- Get user cart
    SELECT id INTO v_cart_id FROM carts WHERE user_id = p_user_id LIMIT 1;
    IF v_cart_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Keranjang belanja tidak ditemukan');
    END IF;

    -- Ensure cart has items
    IF NOT EXISTS (SELECT 1 FROM cart_items WHERE cart_id = v_cart_id) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Keranjang belanja kosong');
    END IF;

    -- Fetch user address
    SELECT recipient_name, phone, full_address, province_name, city_name, district_name, postal_code
    INTO v_user_address
    FROM user_addresses
    WHERE id = p_address_id AND user_id = p_user_id;

    IF v_user_address IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Alamat pengiriman tidak ditemukan');
    END IF;

    -- Calculate subtotal & check stock
    FOR v_cart_item IN 
        SELECT ci.variant_id, ci.quantity, pv.stock, pv.price, pv.name as variant_name, p.name as product_name, pv.sku
        FROM cart_items ci
        JOIN product_variants pv ON ci.variant_id = pv.id
        JOIN products p ON pv.product_id = p.id
        WHERE ci.cart_id = v_cart_id
    LOOP
        IF v_cart_item.stock < v_cart_item.quantity THEN
            RETURN jsonb_build_object('success', false, 'message', 'Stok produk ' || v_cart_item.product_name || ' (' || v_cart_item.variant_name || ') tidak mencukupi');
        END IF;

        v_item_subtotal := v_cart_item.price * v_cart_item.quantity;
        v_subtotal := v_subtotal + v_item_subtotal;
    END LOOP;

    -- Validate voucher if provided
    IF p_voucher_code IS NOT NULL AND TRIM(p_voucher_code) <> '' THEN
        SELECT id, value
        INTO v_voucher_id, v_discount_amount
        FROM vouchers
        WHERE UPPER(code) = UPPER(p_voucher_code)
          AND is_active = true
          AND (starts_at IS NULL OR starts_at <= NOW())
          AND (expires_at IS NULL OR expires_at >= NOW())
          AND (min_purchase IS NULL OR min_purchase <= v_subtotal);

        IF v_voucher_id IS NULL THEN
            RETURN jsonb_build_object('success', false, 'message', 'Voucher tidak valid, sudah kedaluwarsa, atau tidak memenuhi syarat minimum pembelian');
        END IF;
    END IF;

    -- Final total
    v_total_amount := GREATEST(0, v_subtotal + v_shipping_cost - v_discount_amount);

    -- Generate order number (ORD-YYYYMMDD-XXXXX)
    v_order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');

    -- Create order record
    INSERT INTO orders (
        user_id, order_number, status, subtotal, shipping_cost, discount_amount, total_amount, notes
    ) VALUES (
        p_user_id, v_order_number, 'pending_payment', v_subtotal, v_shipping_cost, v_discount_amount, v_total_amount, p_notes
    ) RETURNING id INTO v_order_id;

    -- Insert order items & reduce stock
    FOR v_cart_item IN 
        SELECT ci.variant_id, ci.quantity, pv.price, pv.name as variant_name, p.name as product_name, pv.sku
        FROM cart_items ci
        JOIN product_variants pv ON ci.variant_id = pv.id
        JOIN products p ON pv.product_id = p.id
        WHERE ci.cart_id = v_cart_id
    LOOP
        v_item_subtotal := v_cart_item.price * v_cart_item.quantity;
        INSERT INTO order_items (
            order_id, variant_id, product_name, variant_name, sku, price, quantity, subtotal
        ) VALUES (
            v_order_id, v_cart_item.variant_id, v_cart_item.product_name, v_cart_item.variant_name, v_cart_item.sku, v_cart_item.price, v_cart_item.quantity, v_item_subtotal
        );

        -- Deduct stock
        UPDATE product_variants
        SET stock = stock - v_cart_item.quantity
        WHERE id = v_cart_item.variant_id;
    END LOOP;

    -- Insert order shipping details (shipping_cost is stored on orders table)
    INSERT INTO order_shipping (
        order_id, recipient_name, phone, full_address, province_name, city_name, district_name, postal_code, courier_name
    ) VALUES (
        v_order_id, v_user_address.recipient_name, v_user_address.phone, v_user_address.full_address, v_user_address.province_name, v_user_address.city_name, v_user_address.district_name, v_user_address.postal_code, COALESCE(p_courier_name, 'Standard')
    );

    -- Insert initial payment record using gateway_order_id (NOT midtrans_order_id)
    INSERT INTO payments (
        order_id, amount, status, gateway_order_id
    ) VALUES (
        v_order_id, v_total_amount, 'pending', v_order_number
    );

    -- Clear cart
    DELETE FROM cart_items WHERE cart_id = v_cart_id;

    RETURN jsonb_build_object(
        'success', true,
        'data', jsonb_build_object(
            'order_id', v_order_id,
            'order_number', v_order_number,
            'subtotal', v_subtotal,
            'shipping_cost', v_shipping_cost,
            'discount_amount', v_discount_amount,
            'total_amount', v_total_amount,
            'status', 'pending_payment'
        )
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
