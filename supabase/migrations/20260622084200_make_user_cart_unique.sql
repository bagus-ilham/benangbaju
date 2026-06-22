-- Clean up duplicate carts, keeping the most recent one
WITH duplicate_carts AS (
  SELECT id,
         ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY created_at DESC) as rn
  FROM carts
  WHERE user_id IS NOT NULL
)
DELETE FROM carts
WHERE id IN (
  SELECT id FROM duplicate_carts WHERE rn > 1
);

-- Add unique constraint to carts for user_id
-- We use a unique index to allow multiple guest carts (where user_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS carts_user_id_unique_idx ON carts(user_id) WHERE user_id IS NOT NULL;
