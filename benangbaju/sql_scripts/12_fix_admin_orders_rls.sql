-- Migration script: Fix Admin Row Level Security (RLS) for Orders, Items, Shipping, Payments, Profiles & Returns
-- Allows authenticated users with role='admin' to view and manage all orders and customer data

DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'orders',
        'order_items',
        'order_shipping',
        'payments',
        'profiles',
        'return_requests',
        'return_items',
        'return_media'
    ];
BEGIN
    FOR i IN 1..array_length(tables, 1) LOOP
        tbl := tables[i];
        
        -- Enable RLS
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
        
        -- Drop existing policy if exists
        EXECUTE format('DROP POLICY IF EXISTS "Allow Admin All" ON %I;', tbl);
        
        -- Create policy for Admin full access
        EXECUTE format('CREATE POLICY "Allow Admin All" ON %I FOR ALL USING (EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin''));', tbl);
    END LOOP;
END $$;
