-- Script RLS untuk Admin (Allow All for authenticated users)
-- Jalankan ini di menu SQL Editor Supabase.

DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'categories',
        'collections',
        'collection_products',
        'banners',
        'products',
        'product_variants',
        'product_variant_attrs',
        'product_images',
        'product_marketplace_links',
        'vouchers',
        'flash_sales',
        'flash_sale_items',
        'site_settings',
        'redirects',
        'landing_pages',
        'admin_activity_logs',
        'shipping_zones',
        'shipping_zone_coverage',
        'shipping_rates'
    ];
BEGIN
    FOR i IN 1..array_length(tables, 1) LOOP
        tbl := tables[i];
        
        -- Aktifkan RLS di tabel
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
        
        -- Hapus policy "Allow Admin All" jika sudah ada (mencegah duplikat)
        EXECUTE format('DROP POLICY IF EXISTS "Allow Admin All" ON %I;', tbl);
        
        -- Buat policy baru
        EXECUTE format('CREATE POLICY "Allow Admin All" ON %I FOR ALL USING (auth.role() = ''authenticated'');', tbl);
    END LOOP;
END $$;
