-- =============================================================
-- Migration: 20260610080002_create_orders.sql
-- Domain 6: Order & Checkout
-- =============================================================

-- -------------------------------------------------------
-- Table: orders
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  voucher_id UUID REFERENCES vouchers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (
    status IN ('pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')
  ),
  subtotal NUMERIC(15,2) NOT NULL CHECK (subtotal >= 0),
  shipping_cost NUMERIC(15,2) NOT NULL CHECK (shipping_cost >= 0),
  discount_amount NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  total_amount NUMERIC(15,2) NOT NULL CHECK (total_amount >= 0),
  notes TEXT,
  cancel_reason VARCHAR(255),
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE orders IS 'Customer orders';

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- -------------------------------------------------------
-- Table: voucher_usages (depends on orders)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS voucher_usages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voucher_id UUID NOT NULL REFERENCES vouchers(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT UNIQUE,
  discount_amount NUMERIC(15,2) NOT NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE voucher_usages IS 'Tracks which user used which voucher on which order';

CREATE INDEX IF NOT EXISTS idx_voucher_usages_voucher_id ON voucher_usages(voucher_id);
CREATE INDEX IF NOT EXISTS idx_voucher_usages_user_id ON voucher_usages(user_id);

-- -------------------------------------------------------
-- Table: order_items
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  flash_sale_item_id UUID REFERENCES flash_sale_items(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  variant_name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) NOT NULL,
  price NUMERIC(15,2) NOT NULL CHECK (price >= 0),
  quantity INT NOT NULL CHECK (quantity > 0),
  subtotal NUMERIC(15,2) NOT NULL CHECK (subtotal >= 0)
);

COMMENT ON TABLE order_items IS 'Snapshot of products at time of order (price, name, SKU frozen)';

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON order_items(variant_id);

-- -------------------------------------------------------
-- Table: order_shipping
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_shipping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE UNIQUE,
  recipient_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  full_address TEXT NOT NULL,
  province_name VARCHAR(100) NOT NULL,
  city_name VARCHAR(100) NOT NULL,
  district_name VARCHAR(100) NOT NULL,
  postal_code VARCHAR(10) NOT NULL,
  courier_name VARCHAR(100),
  tracking_number VARCHAR(100),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'picked_up', 'in_transit', 'delivered')
  ),
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

COMMENT ON TABLE order_shipping IS 'Shipping details and tracking for each order';

CREATE INDEX IF NOT EXISTS idx_order_shipping_order_id ON order_shipping(order_id);
CREATE INDEX IF NOT EXISTS idx_order_shipping_status ON order_shipping(status);

-- -------------------------------------------------------
-- Add FK: stock_mutations.order_item_id → order_items
-- (deferred from Sprint 1)
-- -------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'stock_mutations_order_item_id_fkey'
  ) THEN
    ALTER TABLE stock_mutations
      ADD CONSTRAINT stock_mutations_order_item_id_fkey
      FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE SET NULL;
  END IF;
END $$;
