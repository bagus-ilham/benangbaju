-- =============================================================
-- Migration: 20260610080004_create_shipping.sql
-- Domain 8: Shipping (Custom Zones)
-- =============================================================

-- -------------------------------------------------------
-- Table: shipping_zones
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS shipping_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE shipping_zones IS 'Shipping zone groupings (e.g. Pulau Jawa, Luar Jawa)';

-- -------------------------------------------------------
-- Table: shipping_zone_coverage
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS shipping_zone_coverage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id UUID NOT NULL REFERENCES shipping_zones(id) ON DELETE CASCADE,
  province_name VARCHAR(100) NOT NULL,
  UNIQUE (zone_id, province_name)
);

COMMENT ON TABLE shipping_zone_coverage IS 'Maps provinces to shipping zones';

CREATE INDEX IF NOT EXISTS idx_shipping_zone_coverage_zone_id ON shipping_zone_coverage(zone_id);
CREATE INDEX IF NOT EXISTS idx_shipping_zone_coverage_province ON shipping_zone_coverage(province_name);

-- -------------------------------------------------------
-- Table: shipping_rates
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS shipping_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id UUID NOT NULL REFERENCES shipping_zones(id) ON DELETE CASCADE,
  courier_name VARCHAR(100) NOT NULL,
  price_per_kg NUMERIC(10,2) NOT NULL CHECK (price_per_kg >= 0),
  min_weight_gram INT NOT NULL DEFAULT 1000,
  base_price NUMERIC(10,2) NOT NULL CHECK (base_price >= 0),
  etd_days_min INT NOT NULL CHECK (etd_days_min >= 0),
  etd_days_max INT NOT NULL CHECK (etd_days_max >= etd_days_min),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE shipping_rates IS 'Shipping rates per zone per courier service';

CREATE INDEX IF NOT EXISTS idx_shipping_rates_zone_id ON shipping_rates(zone_id);
CREATE INDEX IF NOT EXISTS idx_shipping_rates_is_active ON shipping_rates(is_active);

-- -------------------------------------------------------
-- Table: districts
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS districts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  province_name VARCHAR(100) NOT NULL,
  city_name VARCHAR(100) NOT NULL,
  district_name VARCHAR(100) NOT NULL,
  postal_code VARCHAR(10),
  zone_id UUID REFERENCES shipping_zones(id) ON DELETE SET NULL
);

COMMENT ON TABLE districts IS 'Indonesian districts data for address input and zone mapping';

CREATE INDEX IF NOT EXISTS idx_districts_province ON districts(province_name);
CREATE INDEX IF NOT EXISTS idx_districts_city ON districts(city_name);
CREATE INDEX IF NOT EXISTS idx_districts_zone_id ON districts(zone_id);

-- Trigram index for ILIKE search on district_name
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_districts_district_trgm ON districts USING GIN (district_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_districts_city_trgm ON districts USING GIN (city_name gin_trgm_ops);

-- -------------------------------------------------------
-- Add FK: user_addresses.zone_id → shipping_zones
-- (deferred from Sprint 1)
-- -------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_addresses_zone_id_fkey'
  ) THEN
    ALTER TABLE user_addresses
      ADD CONSTRAINT user_addresses_zone_id_fkey
      FOREIGN KEY (zone_id) REFERENCES shipping_zones(id) ON DELETE SET NULL;
  END IF;
END $$;
