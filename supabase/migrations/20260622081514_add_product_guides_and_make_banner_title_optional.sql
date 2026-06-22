-- Migration: 20260622081514_add_product_guides_and_make_banner_title_optional.sql
-- Add nullable columns size_guide and care_guide to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS size_guide TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS care_guide TEXT;

-- Drop NOT NULL constraint on banners.title to make it optional
ALTER TABLE banners ALTER COLUMN title DROP NOT NULL;
