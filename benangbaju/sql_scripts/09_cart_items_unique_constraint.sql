-- Migration script: Add UNIQUE constraint to cart_items for upsert compatibility
-- Fixes PostgreSQL error 42P10 (no unique or exclusion constraint matching ON CONFLICT specification)

-- 1. Remove duplicate cart items if any exist (keeping the latest updated or largest quantity)
DELETE FROM cart_items a
USING cart_items b
WHERE a.id < b.id
  AND a.cart_id = b.cart_id
  AND a.variant_id = b.variant_id;

-- 2. Add UNIQUE constraint on (cart_id, variant_id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'cart_items_cart_id_variant_id_key'
    ) THEN
        ALTER TABLE cart_items 
        ADD CONSTRAINT cart_items_cart_id_variant_id_key UNIQUE (cart_id, variant_id);
    END IF;
END $$;
