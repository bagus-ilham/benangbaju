-- =============================================================
-- Migration: 00003_create_products.sql
-- Domain: Katalog & Produk (part 2 — products & variants)
-- =============================================================

-- -------------------------------------------------------
-- Table: products
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(280) NOT NULL UNIQUE,
  description TEXT,
  short_description TEXT,
  weight_gram INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  meta_title VARCHAR(255),
  meta_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE products IS 'Main products table';

-- Full-text search vector (generated column)
ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector TSVECTOR
  GENERATED ALWAYS AS (
    setweight(to_tsvector('indonesian', COALESCE(name, '')), 'A') ||
    setweight(to_tsvector('indonesian', COALESCE(short_description, '')), 'B') ||
    setweight(to_tsvector('indonesian', COALESCE(description, '')), 'C')
  ) STORED;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_active, is_featured);
CREATE INDEX IF NOT EXISTS idx_products_search_vector ON products USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- Apply updated_at trigger
DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- -------------------------------------------------------
-- Table: collection_products (M:N junction)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS collection_products (
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (collection_id, product_id)
);

COMMENT ON TABLE collection_products IS 'Many-to-many: collections <-> products';

-- -------------------------------------------------------
-- Table: product_variants
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  price NUMERIC(15,2) NOT NULL CHECK (price >= 0),
  compare_price NUMERIC(15,2) CHECK (compare_price IS NULL OR compare_price >= 0),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  weight_gram INT,
  is_active BOOLEAN NOT NULL DEFAULT true
);

COMMENT ON TABLE product_variants IS 'Product variants with SKU, price, and stock';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_is_active ON product_variants(is_active);

-- -------------------------------------------------------
-- Table: product_variant_attrs
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_variant_attrs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  attr_name VARCHAR(50) NOT NULL,
  attr_value VARCHAR(100) NOT NULL
);

COMMENT ON TABLE product_variant_attrs IS 'Variant attributes (e.g. Warna: Merah, Ukuran: XL)';

-- Index
CREATE INDEX IF NOT EXISTS idx_product_variant_attrs_variant_id ON product_variant_attrs(variant_id);

-- -------------------------------------------------------
-- Table: product_images
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255),
  sort_order INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false
);

COMMENT ON TABLE product_images IS 'Product gallery images';

-- Index
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);

-- -------------------------------------------------------
-- Table: product_marketplace_links
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_marketplace_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL CHECK (platform IN ('shopee', 'tiktok', 'tokopedia', 'lazada', 'bukalapak', 'other')),
  url TEXT NOT NULL,
  label VARCHAR(100),
  sort_order INT NOT NULL DEFAULT 0
);

COMMENT ON TABLE product_marketplace_links IS 'Links to product on other marketplaces for price comparison';

-- Index
CREATE INDEX IF NOT EXISTS idx_product_marketplace_links_product_id ON product_marketplace_links(product_id);
