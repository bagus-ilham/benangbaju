-- =============================================================
-- Migration: 00004_create_inventory.sql
-- Domain: Inventori & Stok
-- =============================================================

-- -------------------------------------------------------
-- Table: stock_mutations
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_mutations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  order_item_id UUID, -- FK ke order_items, ditambahkan nanti via ALTER
  type TEXT NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'reserved', 'released')),
  qty INT NOT NULL,
  qty_before INT NOT NULL,
  qty_after INT NOT NULL,
  note VARCHAR(255),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE stock_mutations IS 'Stock mutation audit trail for all inventory changes';
COMMENT ON COLUMN stock_mutations.type IS 'in=restock, out=sold, adjustment=manual, reserved=held, released=restored';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stock_mutations_variant_id ON stock_mutations(variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_mutations_created_at ON stock_mutations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_mutations_type ON stock_mutations(type);
