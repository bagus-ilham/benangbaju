-- Add unique constraint for idempotent district seed upserts
CREATE UNIQUE INDEX IF NOT EXISTS idx_districts_province_city_district_unique
  ON districts (province_name, city_name, district_name);
