-- Migration 16: DOKU Direct API & Payment Fee Config
BEGIN;

-- 1. Table payment_fee_config
CREATE TABLE IF NOT EXISTS public.payment_fee_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_code TEXT NOT NULL UNIQUE,          -- e.g. 'bca_va', 'mandiri_va', 'bni_va', 'bri_va', 'qris', 'ovo', 'dana', 'shopeepay', 'alfamart', 'indomaret'
    category TEXT NOT NULL CHECK (category IN ('virtual_account', 'qris', 'ewallet', 'minimarket')),
    channel_name TEXT NOT NULL,                 -- e.g. 'BCA Virtual Account', 'QRIS (All Bank & E-Wallet)', 'DANA', 'Alfamart'
    logo_url TEXT,                              -- optional logo url/icon name
    fee_type TEXT NOT NULL CHECK (fee_type IN ('flat', 'percentage', 'flat_and_percentage')),
    fee_flat BIGINT DEFAULT 0,                  -- nominal flat fee (dalam rupiah)
    fee_percentage NUMERIC(5,3) DEFAULT 0,      -- persentase fee (misal 0.777%)
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default fee configs (sesuai estimasi tarif DOKU + PPN 11%)
INSERT INTO public.payment_fee_config (channel_code, category, channel_name, fee_type, fee_flat, fee_percentage, sort_order)
VALUES
  ('bca_va', 'virtual_account', 'BCA Virtual Account', 'flat', 4440, 0, 1),
  ('mandiri_va', 'virtual_account', 'Mandiri Virtual Account', 'flat', 4440, 0, 2),
  ('bni_va', 'virtual_account', 'BNI Virtual Account', 'flat', 4440, 0, 3),
  ('bri_va', 'virtual_account', 'BRI Virtual Account', 'flat', 4440, 0, 4),
  ('permata_va', 'virtual_account', 'Permata Virtual Account', 'flat', 4440, 0, 5),
  ('cimb_va', 'virtual_account', 'CIMB Virtual Account', 'flat', 4440, 0, 6),
  ('qris', 'qris', 'QRIS (Semua Bank & E-Wallet)', 'percentage', 0, 0.777, 10),
  ('dana', 'ewallet', 'DANA', 'percentage', 0, 1.665, 20),
  ('ovo', 'ewallet', 'OVO', 'percentage', 0, 2.220, 21),
  ('shopeepay', 'ewallet', 'ShopeePay', 'percentage', 0, 2.220, 22),
  ('alfamart', 'minimarket', 'Alfamart / Alfamidi', 'flat', 5550, 0, 30),
  ('indomaret', 'minimarket', 'Indomaret', 'flat', 5550, 0, 31)
ON CONFLICT (channel_code) DO NOTHING;

-- 2. Add columns to orders and payments
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS payment_fee BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_channel TEXT;

ALTER TABLE public.payments 
  ADD COLUMN IF NOT EXISTS payment_fee BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_channel TEXT,
  ADD COLUMN IF NOT EXISTS payment_instructions JSONB;

-- 3. Update RLS policies
ALTER TABLE public.payment_fee_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Payment fee configs are viewable by everyone" ON public.payment_fee_config;
CREATE POLICY "Payment fee configs are viewable by everyone" 
  ON public.payment_fee_config FOR SELECT USING (true);

DROP POLICY IF EXISTS "Payment fee configs are editable by admins" ON public.payment_fee_config;
CREATE POLICY "Payment fee configs are editable by admins" 
  ON public.payment_fee_config FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

COMMIT;

-- 4. Re-create create_order RPC function with payment_fee and payment_channel
DROP FUNCTION IF EXISTS public.create_order(UUID, UUID, TEXT, TEXT, BIGINT, TEXT);
DROP FUNCTION IF EXISTS public.create_order(UUID, UUID, TEXT, TEXT, BIGINT, TEXT, BIGINT, TEXT);

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

    -- Final total including shipping cost and payment fee
    v_total_amount := GREATEST(0, v_subtotal + v_shipping_cost + v_payment_fee - v_discount_amount);

    -- Generate order number (ORD-YYYYMMDD-XXXXX)
    v_order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');

    -- Create order record
    INSERT INTO orders (
        user_id, order_number, status, subtotal, shipping_cost, discount_amount, total_amount, payment_fee, payment_channel, notes
    ) VALUES (
        p_user_id, v_order_number, 'pending_payment', v_subtotal, v_shipping_cost, v_discount_amount, v_total_amount, v_payment_fee, p_payment_channel, p_notes
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

    -- Insert order shipping details
    INSERT INTO order_shipping (
        order_id, recipient_name, phone, full_address, province_name, city_name, district_name, postal_code, courier_name
    ) VALUES (
        v_order_id, v_user_address.recipient_name, v_user_address.phone, v_user_address.full_address, v_user_address.province_name, v_user_address.city_name, v_user_address.district_name, v_user_address.postal_code, COALESCE(p_courier_name, 'Standard')
    );

    -- Insert initial payment record
    INSERT INTO payments (
        order_id, amount, payment_fee, payment_channel, status, gateway_order_id
    ) VALUES (
        v_order_id, v_total_amount, v_payment_fee, p_payment_channel, 'pending', v_order_number
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
            'payment_fee', v_payment_fee,
            'payment_channel', p_payment_channel,
            'total_amount', v_total_amount,
            'status', 'pending_payment'
        )
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
