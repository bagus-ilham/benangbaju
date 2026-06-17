-- =============================================================
-- Migration: 20260610080001_create_promotions.sql
-- Domain 5: Promosi (Voucher & Flash Sale)
-- =============================================================

-- -------------------------------------------------------
-- Table: vouchers
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  value NUMERIC(15,2) NOT NULL CHECK (value > 0),
  min_purchase NUMERIC(15,2) NOT NULL DEFAULT 0,
  max_discount NUMERIC(15,2),
  usage_limit INT,
  usage_per_user INT NOT NULL DEFAULT 1,
  used_count INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_voucher_dates CHECK (expires_at > starts_at)
);

COMMENT ON TABLE vouchers IS 'Discount voucher codes';

CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code);
CREATE INDEX IF NOT EXISTS idx_vouchers_is_active ON vouchers(is_active);

DROP TRIGGER IF EXISTS trg_vouchers_updated_at ON vouchers;
CREATE TRIGGER trg_vouchers_updated_at
  BEFORE UPDATE ON vouchers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- -------------------------------------------------------
-- Table: flash_sales
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS flash_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  description TEXT,
  banner_url VARCHAR(500),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_flash_sale_dates CHECK (ends_at > starts_at)
);

COMMENT ON TABLE flash_sales IS 'Flash sale events with time-limited discounts';

CREATE INDEX IF NOT EXISTS idx_flash_sales_is_active ON flash_sales(is_active);
CREATE INDEX IF NOT EXISTS idx_flash_sales_dates ON flash_sales(starts_at, ends_at);

-- -------------------------------------------------------
-- Table: flash_sale_items
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS flash_sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flash_sale_id UUID NOT NULL REFERENCES flash_sales(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  original_price NUMERIC(15,2) NOT NULL,
  sale_price NUMERIC(15,2) NOT NULL CHECK (sale_price >= 0),
  discount_percent NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN original_price > 0
      THEN ROUND(((original_price - sale_price) / original_price) * 100, 2)
      ELSE 0
    END
  ) STORED,
  quota INT NOT NULL DEFAULT 0,
  sold_count INT NOT NULL DEFAULT 0,
  UNIQUE (flash_sale_id, variant_id),
  CONSTRAINT chk_flash_sale_price CHECK (sale_price <= original_price)
);

COMMENT ON TABLE flash_sale_items IS 'Products/variants in a flash sale with discounted prices';

CREATE INDEX IF NOT EXISTS idx_flash_sale_items_flash_sale_id ON flash_sale_items(flash_sale_id);
CREATE INDEX IF NOT EXISTS idx_flash_sale_items_variant_id ON flash_sale_items(variant_id);
