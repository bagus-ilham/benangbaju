-- Ubah tipe data moneter dari float4/float8 ke numeric untuk presisi tinggi

ALTER TABLE public.product_variants
  ALTER COLUMN compare_price TYPE numeric USING compare_price::numeric;

-- Drop generated column that depends on original_price and sale_price first
ALTER TABLE public.flash_sale_items
  DROP COLUMN IF EXISTS discount_percent;

-- Alter types
ALTER TABLE public.flash_sale_items
  ALTER COLUMN original_price TYPE numeric USING original_price::numeric,
  ALTER COLUMN sale_price TYPE numeric USING sale_price::numeric;

-- Re-add the generated column
ALTER TABLE public.flash_sale_items
  ADD COLUMN discount_percent NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN original_price > 0
      THEN ROUND(((original_price - sale_price) / original_price) * 100, 2)
      ELSE 0
    END
  ) STORED;

ALTER TABLE public.shipping_rates
  ALTER COLUMN price_per_kg TYPE numeric USING price_per_kg::numeric,
  ALTER COLUMN base_price TYPE numeric USING base_price::numeric;
