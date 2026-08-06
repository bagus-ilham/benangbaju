-- Migration script: Add UNIQUE constraint to carts(user_id) for upsert compatibility
-- Fixes PostgreSQL error 42P10 (there is no unique or exclusion constraint matching the ON CONFLICT specification)

-- 1. Deduplicate carts for the same user_id if any exist, keeping the latest cart
DO $$
DECLARE
    rec RECORD;
    keep_cart_id UUID;
BEGIN
    FOR rec IN 
        SELECT user_id 
        FROM carts 
        WHERE user_id IS NOT NULL 
        GROUP BY user_id 
        HAVING COUNT(*) > 1
    LOOP
        -- Find the newest cart for this user
        SELECT id INTO keep_cart_id 
        FROM carts 
        WHERE user_id = rec.user_id 
        ORDER BY created_at DESC 
        LIMIT 1;

        -- Reassign cart items from older carts to keep_cart_id (avoiding duplicate variant_id in target)
        UPDATE cart_items ci
        SET cart_id = keep_cart_id
        FROM carts c
        WHERE ci.cart_id = c.id
          AND c.user_id = rec.user_id
          AND c.id <> keep_cart_id
          AND NOT EXISTS (
              SELECT 1 FROM cart_items target_ci 
              WHERE target_ci.cart_id = keep_cart_id 
                AND target_ci.variant_id = ci.variant_id
          );

        -- Delete remaining cart_items in older carts
        DELETE FROM cart_items 
        WHERE cart_id IN (
            SELECT id FROM carts WHERE user_id = rec.user_id AND id <> keep_cart_id
        );

        -- Delete older duplicate carts
        DELETE FROM carts 
        WHERE user_id = rec.user_id AND id <> keep_cart_id;
    END LOOP;
END $$;

-- 2. Add UNIQUE constraint on carts(user_id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'carts_user_id_key'
    ) THEN
        ALTER TABLE carts 
        ADD CONSTRAINT carts_user_id_key UNIQUE (user_id);
    END IF;
END $$;
