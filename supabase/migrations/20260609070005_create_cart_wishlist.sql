-- =============================================================
-- Migration: 00005_create_cart_wishlist.sql
-- Domain: Cart & Wishlist
-- =============================================================

-- -------------------------------------------------------
-- Table: carts
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Either user_id or session_id must be present
  CONSTRAINT chk_cart_owner CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

COMMENT ON TABLE carts IS 'Shopping carts for authenticated users and guests';
COMMENT ON COLUMN carts.session_id IS 'Session ID for guest carts (null for authenticated users)';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_session_id ON carts(session_id);

-- -------------------------------------------------------
-- Table: cart_items
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  UNIQUE (cart_id, variant_id)
);

COMMENT ON TABLE cart_items IS 'Items in a shopping cart';

-- Index
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);

-- -------------------------------------------------------
-- Table: wishlist_items
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS wishlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique index handling nullable variant_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_wishlist_unique_with_variant
  ON wishlist_items (user_id, product_id, variant_id)
  WHERE variant_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_wishlist_unique_without_variant
  ON wishlist_items (user_id, product_id)
  WHERE variant_id IS NULL;

COMMENT ON TABLE wishlist_items IS 'User product wishlist (auth required)';

-- Index
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id ON wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_product_id ON wishlist_items(product_id);
