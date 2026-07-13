-- ==========================================
-- LEDGER SCHEMA FIX MIGRATION (V3)
-- ==========================================
-- Fokus: Presisi Finansial, Keamanan Relasional, & Performa Query
-- Fix: Menangani dependency Trigger dan Generated Column.

BEGIN;

-- --------------------------------------------------------
-- 0. TANGANI DEPENDENSI (TRIGGER & GENERATED COLUMN)
-- --------------------------------------------------------
-- Postgres tidak mengizinkan mengubah kolom jika sedang
-- dipakai oleh Trigger atau Generated Column.

DROP TRIGGER IF EXISTS trg_variant_price_range ON product_variants;

-- Hapus sementara kolom generated yang menggunakan original_price
ALTER TABLE flash_sale_items DROP COLUMN IF EXISTS discount_percent;


-- --------------------------------------------------------
-- 1. UBAH TIPE DATA UANG MENJADI BIGINT (Untuk Rupiah)
-- --------------------------------------------------------

ALTER TABLE product_variants
  ALTER COLUMN price TYPE bigint USING price::bigint,
  ALTER COLUMN compare_price TYPE bigint USING compare_price::bigint;

ALTER TABLE products
  ALTER COLUMN min_price TYPE bigint USING min_price::bigint,
  ALTER COLUMN max_price TYPE bigint USING max_price::bigint;

ALTER TABLE flash_sale_items
  ALTER COLUMN original_price TYPE bigint USING original_price::bigint,
  ALTER COLUMN sale_price TYPE bigint USING sale_price::bigint;

ALTER TABLE orders
  ALTER COLUMN subtotal TYPE bigint USING subtotal::bigint,
  ALTER COLUMN shipping_cost TYPE bigint USING shipping_cost::bigint,
  ALTER COLUMN discount_amount TYPE bigint USING discount_amount::bigint,
  ALTER COLUMN total_amount TYPE bigint USING total_amount::bigint;

ALTER TABLE order_items
  ALTER COLUMN price TYPE bigint USING price::bigint,
  ALTER COLUMN subtotal TYPE bigint USING subtotal::bigint;

ALTER TABLE payments
  ALTER COLUMN amount TYPE bigint USING amount::bigint;

ALTER TABLE return_requests
  ALTER COLUMN refund_amount TYPE bigint USING refund_amount::bigint;

ALTER TABLE shipping_rates
  ALTER COLUMN price_per_kg TYPE bigint USING price_per_kg::bigint,
  ALTER COLUMN base_price TYPE bigint USING base_price::bigint;

ALTER TABLE vouchers
  ALTER COLUMN value TYPE bigint USING value::bigint,
  ALTER COLUMN min_purchase TYPE bigint USING min_purchase::bigint,
  ALTER COLUMN max_discount TYPE bigint USING max_discount::bigint;

ALTER TABLE voucher_usages
  ALTER COLUMN discount_amount TYPE bigint USING discount_amount::bigint;


-- --------------------------------------------------------
-- 2. KEMBALIKAN DEPENDENSI (FUNGSI, TRIGGER, GENERATED COL)
-- --------------------------------------------------------

-- Kembalikan Generated Column (Flash Sale)
ALTER TABLE flash_sale_items ADD COLUMN discount_percent integer 
  GENERATED ALWAYS AS (
    CASE 
      WHEN original_price > 0 THEN ((original_price - sale_price) * 100 / original_price)::integer
      ELSE 0
    END
  ) STORED;

-- Kembalikan Trigger Min/Max Price (Produk)
CREATE OR REPLACE FUNCTION update_product_price_range()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE products
    SET 
      min_price = (SELECT MIN(price) FROM product_variants WHERE product_id = OLD.product_id),
      max_price = (SELECT MAX(price) FROM product_variants WHERE product_id = OLD.product_id)
    WHERE id = OLD.product_id;
    RETURN OLD;
  ELSE
    UPDATE products
    SET 
      min_price = (SELECT MIN(price) FROM product_variants WHERE product_id = NEW.product_id),
      max_price = (SELECT MAX(price) FROM product_variants WHERE product_id = NEW.product_id)
    WHERE id = NEW.product_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_variant_price_range
AFTER INSERT OR UPDATE OF price OR DELETE
ON product_variants
FOR EACH ROW
EXECUTE FUNCTION update_product_price_range();


-- --------------------------------------------------------
-- 3. PENAMBAHAN INDEX UNTUK LOOKUP CEPAT
-- --------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_collections_slug ON collections(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_midtrans_order ON payments(midtrans_order_id);
CREATE INDEX IF NOT EXISTS idx_carts_session ON carts(session_id);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);


-- --------------------------------------------------------
-- 4. MENGAMANKAN RIWAYAT FINANSIAL (ON DELETE RESTRICT)
-- --------------------------------------------------------
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_variant_id_fkey;
ALTER TABLE order_items ADD CONSTRAINT order_items_variant_id_fkey 
  FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE RESTRICT;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE orders ADD CONSTRAINT orders_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE RESTRICT;

COMMIT;
-- Script to create a rate limiting table
-- Run this in your Supabase SQL Editor

DROP TABLE IF EXISTS public.rate_limit_logs;

CREATE TABLE public.rate_limit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address TEXT NOT NULL,
    route TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by IP and time
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_ip_created 
ON public.rate_limit_logs (ip_address, route, created_at);

-- Set up an automatic cleanup function (optional)
-- Or you can rely on the proxy.ts to delete old records or clean them up via pg_cron
-- ==========================================
-- LEDGER SCHEMA FIX MIGRATION (CONSTRAINTS V2)
-- ==========================================
-- Fokus: Mencegah Data Tidak Masuk Akal (Impossible States)

BEGIN;

-- 1. Cegah stok minus (Overselling / Race Condition)
ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS chk_stock_non_negative;
ALTER TABLE product_variants ADD CONSTRAINT chk_stock_non_negative CHECK (stock >= 0);

-- 2. Cegah harga minus
ALTER TABLE product_variants DROP CONSTRAINT IF EXISTS chk_price_non_negative;
ALTER TABLE product_variants ADD CONSTRAINT chk_price_non_negative CHECK (price >= 0);

-- 3. Cegah user memasukkan barang ke keranjang/order dengan quantity 0 atau minus
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS chk_order_qty_positive;
ALTER TABLE order_items ADD CONSTRAINT chk_order_qty_positive CHECK (quantity > 0);

ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS chk_cart_qty_positive;
ALTER TABLE cart_items ADD CONSTRAINT chk_cart_qty_positive CHECK (quantity > 0);

-- 4. Cegah Flash Sale berakhir sebelum dimulai
ALTER TABLE flash_sales DROP CONSTRAINT IF EXISTS chk_flash_sale_dates;
ALTER TABLE flash_sales ADD CONSTRAINT chk_flash_sale_dates CHECK (ends_at > starts_at);

-- 5. Cegah kuota flash sale minus
ALTER TABLE flash_sale_items DROP CONSTRAINT IF EXISTS chk_fs_quota_non_negative;
ALTER TABLE flash_sale_items ADD CONSTRAINT chk_fs_quota_non_negative CHECK (quota >= 0);

-- 6. Cegah nilai voucher minus
ALTER TABLE vouchers DROP CONSTRAINT IF EXISTS chk_voucher_val_positive;
ALTER TABLE vouchers ADD CONSTRAINT chk_voucher_val_positive CHECK (value > 0);

COMMIT;
-- Script to add CHECK constraints to the database to ensure data integrity
-- Run this in your Supabase SQL Editor

-- 1. Orders table: total amount and shipping cost cannot be negative
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_total_amount_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_total_amount_check CHECK (total_amount >= 0);

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_shipping_cost_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_shipping_cost_check CHECK (shipping_cost >= 0);

-- 2. Vouchers table: minimum purchase and discount amount cannot be negative
ALTER TABLE public.vouchers DROP CONSTRAINT IF EXISTS vouchers_min_purchase_check;
ALTER TABLE public.vouchers ADD CONSTRAINT vouchers_min_purchase_check CHECK (min_purchase >= 0);

ALTER TABLE public.vouchers DROP CONSTRAINT IF EXISTS vouchers_value_check;
ALTER TABLE public.vouchers ADD CONSTRAINT vouchers_value_check CHECK (value >= 0);

ALTER TABLE public.vouchers DROP CONSTRAINT IF EXISTS vouchers_max_discount_check;
ALTER TABLE public.vouchers ADD CONSTRAINT vouchers_max_discount_check CHECK (max_discount IS NULL OR max_discount >= 0);

-- 3. Shipping Rates table: prices cannot be negative
ALTER TABLE public.shipping_rates DROP CONSTRAINT IF EXISTS shipping_rates_price_per_kg_check;
ALTER TABLE public.shipping_rates ADD CONSTRAINT shipping_rates_price_per_kg_check CHECK (price_per_kg >= 0);

ALTER TABLE public.shipping_rates DROP CONSTRAINT IF EXISTS shipping_rates_base_price_check;
ALTER TABLE public.shipping_rates ADD CONSTRAINT shipping_rates_base_price_check CHECK (base_price >= 0);

-- 4. Banners table: start date must be before end date
ALTER TABLE public.banners DROP CONSTRAINT IF EXISTS banners_dates_check;
ALTER TABLE public.banners ADD CONSTRAINT banners_dates_check CHECK (starts_at IS NULL OR ends_at IS NULL OR starts_at < ends_at);

-- 5. Flash Sales table: start date must be before end date
ALTER TABLE public.flash_sales DROP CONSTRAINT IF EXISTS flash_sales_dates_check;
ALTER TABLE public.flash_sales ADD CONSTRAINT flash_sales_dates_check CHECK (starts_at < ends_at);
-- Script to ensure webhook idempotency for Midtrans payments
-- Run this in your Supabase SQL Editor

-- 1. Ensure the payment_logs table has a unique constraint on transaction ID + event type
-- This prevents the same webhook from being processed twice.
ALTER TABLE public.payment_logs 
DROP CONSTRAINT IF EXISTS payment_logs_midtrans_order_id_event_type_key;

ALTER TABLE public.payment_logs 
ADD CONSTRAINT payment_logs_midtrans_order_id_event_type_key 
UNIQUE (midtrans_order_id, event_type);
-- Script to add missing composite and heavily queried indexes
-- Run this in your Supabase SQL Editor

-- 1. Order Items (often queried by order_id to fetch details)
CREATE INDEX IF NOT EXISTS idx_order_items_order_id 
ON public.order_items (order_id);

-- 2. Product Reviews (often queried by product_id to fetch all reviews for a product)
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id 
ON public.product_reviews (product_id);

-- 3. Notifications (often queried by user_id and is_read to fetch unread notifications)
CREATE INDEX IF NOT EXISTS idx_notifications_user_is_read 
ON public.notifications (user_id, is_read);
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
        EXECUTE format('CREATE POLICY "Allow Admin All" ON %I FOR ALL USING (EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin''));', tbl);
    END LOOP;
END $$;
-- Script to create a trigger that auto-updates product_rating_summary
-- Run this in your Supabase SQL Editor

-- 1. Create the trigger function
CREATE OR REPLACE FUNCTION public.update_product_rating_summary()
RETURNS TRIGGER AS $$
DECLARE
    target_product_id UUID;
BEGIN
    -- Determine the product_id based on the operation
    IF TG_OP = 'DELETE' THEN
        target_product_id := OLD.product_id;
    ELSE
        target_product_id := NEW.product_id;
    END IF;

    -- Upsert the summary table
    INSERT INTO public.product_rating_summary (product_id, average_rating, total_reviews)
    SELECT 
        target_product_id,
        COALESCE(AVG(rating), 0) as average_rating,
        COUNT(id) as total_reviews
    FROM public.product_reviews
    WHERE product_id = target_product_id
    ON CONFLICT (product_id) DO UPDATE SET
        average_rating = EXCLUDED.average_rating,
        total_reviews = EXCLUDED.total_reviews,
        updated_at = NOW();

    RETURN NULL; -- After triggers don't need to return a row
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger on product_reviews table
DROP TRIGGER IF EXISTS trg_update_rating_summary ON public.product_reviews;

CREATE TRIGGER trg_update_rating_summary
AFTER INSERT OR UPDATE OF rating OR DELETE
ON public.product_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_product_rating_summary();
-- Script to setup data retention cleanup (Pruning old logs)
-- Run this in your Supabase SQL Editor, or set it up as a pg_cron job.

-- Create a function to clean up old logs
CREATE OR REPLACE FUNCTION public.cleanup_old_logs()
RETURNS void AS $$
BEGIN
    -- Delete search logs older than 90 days
    DELETE FROM public.search_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';

    -- Delete admin activity logs older than 1 year (365 days)
    DELETE FROM public.admin_activity_logs 
    WHERE created_at < NOW() - INTERVAL '365 days';

    -- Delete rate limit logs older than 7 days
    DELETE FROM public.rate_limit_logs 
    WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Note: To automate this, you would typically use pg_cron (if enabled in Supabase)
-- Example: SELECT cron.schedule('0 0 * * *', $$SELECT public.cleanup_old_logs()$$);
-- RPC for creating a product and its related entities transactionally
CREATE OR REPLACE FUNCTION admin_create_product(
  p_product jsonb,
  p_variants jsonb,
  p_images jsonb,
  p_links jsonb,
  p_collections text[]
) RETURNS jsonb AS $$
DECLARE
  v_product_id uuid;
  v_variant_idx int;
  v_variant jsonb;
  v_variant_id uuid;
  v_variant_ids uuid[];
  v_attr jsonb;
  v_image jsonb;
  v_link jsonb;
  v_collection_id uuid;
BEGIN
  -- 1. Insert product
  INSERT INTO products (
    category_id, name, slug, description, short_description, weight_gram,
    is_featured, is_active, meta_title, meta_description, size_guide, care_guide
  ) VALUES (
    (p_product->>'category_id')::uuid,
    p_product->>'name',
    p_product->>'slug',
    p_product->>'description',
    p_product->>'short_description',
    (p_product->>'weight_gram')::numeric,
    (p_product->>'is_featured')::boolean,
    (p_product->>'is_active')::boolean,
    p_product->>'meta_title',
    p_product->>'meta_description',
    p_product->>'size_guide',
    p_product->>'care_guide'
  ) RETURNING id INTO v_product_id;

  -- 2. Insert variants and their attributes
  IF jsonb_array_length(p_variants) > 0 THEN
    FOR v_variant_idx IN 0 .. jsonb_array_length(p_variants) - 1 LOOP
      v_variant := p_variants->v_variant_idx;
      
      INSERT INTO product_variants (
        product_id, sku, name, price, compare_price, stock, weight_gram, is_active
      ) VALUES (
        v_product_id,
        v_variant->>'sku',
        v_variant->>'name',
        (v_variant->>'price')::numeric,
        (v_variant->>'compare_price')::numeric,
        (v_variant->>'stock')::int,
        (v_variant->>'weight_gram')::numeric,
        COALESCE((v_variant->>'is_active')::boolean, true)
      ) RETURNING id INTO v_variant_id;
      
      v_variant_ids := array_append(v_variant_ids, v_variant_id);

      -- Insert variant attributes
      IF v_variant ? 'attrs' AND jsonb_array_length(v_variant->'attrs') > 0 THEN
        FOR v_attr IN SELECT * FROM jsonb_array_elements(v_variant->'attrs') LOOP
          INSERT INTO product_variant_attrs (
            variant_id, attr_name, attr_value
          ) VALUES (
            v_variant_id,
            v_attr->>'attr_name',
            v_attr->>'attr_value'
          );
        END LOOP;
      END IF;
    END LOOP;
  END IF;

  -- 3. Insert images
  IF jsonb_array_length(p_images) > 0 THEN
    FOR v_image IN SELECT * FROM jsonb_array_elements(p_images) LOOP
      INSERT INTO product_images (
        product_id, variant_id, url, alt_text, is_primary, sort_order
      ) VALUES (
        v_product_id,
        CASE 
          WHEN v_image->>'variant_idx' IS NOT NULL THEN v_variant_ids[(v_image->>'variant_idx')::int + 1]
          ELSE NULL
        END,
        v_image->>'url',
        v_image->>'alt_text',
        (v_image->>'is_primary')::boolean,
        (v_image->>'sort_order')::int
      );
    END LOOP;
  END IF;

  -- 4. Insert marketplace links
  IF jsonb_array_length(p_links) > 0 THEN
    FOR v_link IN SELECT * FROM jsonb_array_elements(p_links) LOOP
      INSERT INTO product_marketplace_links (
        product_id, platform, url, label, sort_order
      ) VALUES (
        v_product_id,
        v_link->>'platform',
        v_link->>'url',
        v_link->>'label',
        (v_link->>'sort_order')::int
      );
    END LOOP;
  END IF;

  -- 5. Insert collections
  IF array_length(p_collections, 1) > 0 THEN
    FOREACH v_collection_id IN ARRAY p_collections LOOP
      INSERT INTO collection_products (
        product_id, collection_id
      ) VALUES (
        v_product_id,
        v_collection_id::uuid
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', true, 'data', jsonb_build_object('id', v_product_id));
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', jsonb_build_object('code', SQLSTATE, 'message', SQLERRM));
END;
$$ LANGUAGE plpgsql;
-- RPC for updating a product and its related entities transactionally
CREATE OR REPLACE FUNCTION admin_update_product(
  p_product_id uuid,
  p_product jsonb,
  p_variants_to_upsert jsonb,
  p_variant_ids_to_delete uuid[],
  p_images_to_upsert jsonb,
  p_image_ids_to_delete uuid[],
  p_links_to_upsert jsonb,
  p_link_ids_to_delete uuid[],
  p_collections text[]
) RETURNS jsonb AS $$
DECLARE
  v_variant jsonb;
  v_variant_id uuid;
  v_attr jsonb;
  v_image jsonb;
  v_link jsonb;
  v_collection_id uuid;
BEGIN
  -- 1. Update product
  IF p_product IS NOT NULL AND p_product != '{}'::jsonb THEN
    UPDATE products SET
      category_id = COALESCE((p_product->>'category_id')::uuid, category_id),
      name = COALESCE(p_product->>'name', name),
      slug = COALESCE(p_product->>'slug', slug),
      description = COALESCE(p_product->>'description', description),
      short_description = COALESCE(p_product->>'short_description', short_description),
      weight_gram = COALESCE((p_product->>'weight_gram')::numeric, weight_gram),
      is_featured = COALESCE((p_product->>'is_featured')::boolean, is_featured),
      is_active = COALESCE((p_product->>'is_active')::boolean, is_active),
      meta_title = COALESCE(p_product->>'meta_title', meta_title),
      meta_description = COALESCE(p_product->>'meta_description', meta_description),
      size_guide = COALESCE(p_product->>'size_guide', size_guide),
      care_guide = COALESCE(p_product->>'care_guide', care_guide),
      updated_at = NOW()
    WHERE id = p_product_id;
  END IF;

  -- 2. Delete components
  IF array_length(p_variant_ids_to_delete, 1) > 0 THEN
    DELETE FROM product_variants WHERE id = ANY(p_variant_ids_to_delete);
  END IF;
  
  IF array_length(p_image_ids_to_delete, 1) > 0 THEN
    DELETE FROM product_images WHERE id = ANY(p_image_ids_to_delete);
  END IF;
  
  IF array_length(p_link_ids_to_delete, 1) > 0 THEN
    DELETE FROM product_marketplace_links WHERE id = ANY(p_link_ids_to_delete);
  END IF;

  -- 3. Upsert variants and attributes
  IF jsonb_array_length(p_variants_to_upsert) > 0 THEN
    FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants_to_upsert) LOOP
      IF v_variant->>'id' IS NOT NULL THEN
        -- Update
        UPDATE product_variants SET
          sku = COALESCE(v_variant->>'sku', sku),
          name = COALESCE(v_variant->>'name', name),
          price = COALESCE((v_variant->>'price')::numeric, price),
          compare_price = (v_variant->>'compare_price')::numeric,
          stock = COALESCE((v_variant->>'stock')::int, stock),
          weight_gram = COALESCE((v_variant->>'weight_gram')::numeric, weight_gram),
          is_active = COALESCE((v_variant->>'is_active')::boolean, is_active)
        WHERE id = (v_variant->>'id')::uuid;
        v_variant_id := (v_variant->>'id')::uuid;
        
        -- Wipe and recreate attributes for this variant (simplest safe approach)
        DELETE FROM product_variant_attrs WHERE variant_id = v_variant_id;
      ELSE
        -- Insert
        INSERT INTO product_variants (
          product_id, sku, name, price, compare_price, stock, weight_gram, is_active
        ) VALUES (
          p_product_id,
          v_variant->>'sku',
          v_variant->>'name',
          (v_variant->>'price')::numeric,
          (v_variant->>'compare_price')::numeric,
          (v_variant->>'stock')::int,
          (v_variant->>'weight_gram')::numeric,
          COALESCE((v_variant->>'is_active')::boolean, true)
        ) RETURNING id INTO v_variant_id;
      END IF;

      -- Insert variant attributes
      IF v_variant ? 'attrs' AND jsonb_array_length(v_variant->'attrs') > 0 THEN
        FOR v_attr IN SELECT * FROM jsonb_array_elements(v_variant->'attrs') LOOP
          INSERT INTO product_variant_attrs (
            variant_id, attr_name, attr_value
          ) VALUES (
            v_variant_id,
            v_attr->>'attr_name',
            v_attr->>'attr_value'
          );
        END LOOP;
      END IF;
    END LOOP;
  END IF;

  -- 4. Upsert images
  IF jsonb_array_length(p_images_to_upsert) > 0 THEN
    FOR v_image IN SELECT * FROM jsonb_array_elements(p_images_to_upsert) LOOP
      IF v_image->>'id' IS NOT NULL THEN
        UPDATE product_images SET
          variant_id = (v_image->>'variant_id')::uuid,
          url = COALESCE(v_image->>'url', url),
          alt_text = COALESCE(v_image->>'alt_text', alt_text),
          is_primary = COALESCE((v_image->>'is_primary')::boolean, is_primary),
          sort_order = COALESCE((v_image->>'sort_order')::int, sort_order)
        WHERE id = (v_image->>'id')::uuid;
      ELSE
        INSERT INTO product_images (
          product_id, variant_id, url, alt_text, is_primary, sort_order
        ) VALUES (
          p_product_id,
          (v_image->>'variant_id')::uuid,
          v_image->>'url',
          v_image->>'alt_text',
          (v_image->>'is_primary')::boolean,
          (v_image->>'sort_order')::int
        );
      END IF;
    END LOOP;
  END IF;

  -- 5. Upsert marketplace links
  IF jsonb_array_length(p_links_to_upsert) > 0 THEN
    FOR v_link IN SELECT * FROM jsonb_array_elements(p_links_to_upsert) LOOP
      IF v_link->>'id' IS NOT NULL THEN
        UPDATE product_marketplace_links SET
          platform = COALESCE(v_link->>'platform', platform),
          url = COALESCE(v_link->>'url', url),
          label = COALESCE(v_link->>'label', label),
          sort_order = COALESCE((v_link->>'sort_order')::int, sort_order)
        WHERE id = (v_link->>'id')::uuid;
      ELSE
        INSERT INTO product_marketplace_links (
          product_id, platform, url, label, sort_order
        ) VALUES (
          p_product_id,
          v_link->>'platform',
          v_link->>'url',
          v_link->>'label',
          COALESCE((v_link->>'sort_order')::int, 0)
        );
      END IF;
    END LOOP;
  END IF;

  -- 6. Update collections (wipe and recreate)
  DELETE FROM collection_products WHERE product_id = p_product_id;
  IF array_length(p_collections, 1) > 0 THEN
    FOREACH v_collection_id IN ARRAY p_collections LOOP
      INSERT INTO collection_products (
        product_id, collection_id
      ) VALUES (
        p_product_id,
        v_collection_id::uuid
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', true, 'data', jsonb_build_object('id', p_product_id));
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', jsonb_build_object('code', SQLSTATE, 'message', SQLERRM));
END;
$$ LANGUAGE plpgsql;
-- RPC for creating a flash sale and its items transactionally
CREATE OR REPLACE FUNCTION admin_create_flash_sale(
  p_flash_sale jsonb,
  p_items jsonb
) RETURNS jsonb AS $$
DECLARE
  v_flash_sale_id uuid;
  v_item jsonb;
BEGIN
  -- 1. Insert flash sale
  INSERT INTO flash_sales (
    name, description, banner_url, starts_at, ends_at, is_active
  ) VALUES (
    p_flash_sale->>'name',
    p_flash_sale->>'description',
    p_flash_sale->>'banner_url',
    (p_flash_sale->>'starts_at')::timestamptz,
    (p_flash_sale->>'ends_at')::timestamptz,
    (p_flash_sale->>'is_active')::boolean
  ) RETURNING id INTO v_flash_sale_id;

  -- 2. Insert items
  IF jsonb_array_length(p_items) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
      INSERT INTO flash_sale_items (
        flash_sale_id, variant_id, original_price,
        sale_price, quota, sold_count
      ) VALUES (
        v_flash_sale_id,
        (v_item->>'variant_id')::uuid,
        (v_item->>'original_price')::numeric,
        (v_item->>'sale_price')::numeric,
        (v_item->>'quota')::int,
        COALESCE((v_item->>'sold_count')::int, 0)
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', true, 'data', jsonb_build_object('id', v_flash_sale_id));
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', jsonb_build_object('code', SQLSTATE, 'message', SQLERRM));
END;
$$ LANGUAGE plpgsql;

-- RPC for updating a flash sale transactionally
CREATE OR REPLACE FUNCTION admin_update_flash_sale(
  p_flash_sale_id uuid,
  p_flash_sale jsonb,
  p_items_to_upsert jsonb,
  p_variant_ids_to_delete uuid[]
) RETURNS jsonb AS $$
DECLARE
  v_item jsonb;
BEGIN
  -- 1. Update flash sale
  IF p_flash_sale IS NOT NULL AND p_flash_sale != '{}'::jsonb THEN
    UPDATE flash_sales SET
      name = COALESCE(p_flash_sale->>'name', name),
      description = COALESCE(p_flash_sale->>'description', description),
      banner_url = COALESCE(p_flash_sale->>'banner_url', banner_url),
      starts_at = COALESCE((p_flash_sale->>'starts_at')::timestamptz, starts_at),
      ends_at = COALESCE((p_flash_sale->>'ends_at')::timestamptz, ends_at),
      is_active = COALESCE((p_flash_sale->>'is_active')::boolean, is_active)
    WHERE id = p_flash_sale_id;
  END IF;

  -- 2. Delete items
  IF array_length(p_variant_ids_to_delete, 1) > 0 THEN
    DELETE FROM flash_sale_items 
    WHERE flash_sale_id = p_flash_sale_id 
    AND variant_id = ANY(p_variant_ids_to_delete);
  END IF;

  -- 3. Upsert items
  IF jsonb_array_length(p_items_to_upsert) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items_to_upsert) LOOP
      INSERT INTO flash_sale_items (
        flash_sale_id, variant_id, original_price,
        sale_price, quota, sold_count
      ) VALUES (
        p_flash_sale_id,
        (v_item->>'variant_id')::uuid,
        (v_item->>'original_price')::numeric,
        (v_item->>'sale_price')::numeric,
        (v_item->>'quota')::int,
        COALESCE((v_item->>'sold_count')::int, 0)
      )
      ON CONFLICT (flash_sale_id, variant_id) DO UPDATE SET
        original_price = EXCLUDED.original_price,
        sale_price = EXCLUDED.sale_price,
        quota = EXCLUDED.quota,
        sold_count = EXCLUDED.sold_count;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', true, 'data', jsonb_build_object('id', p_flash_sale_id));
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', jsonb_build_object('code', SQLSTATE, 'message', SQLERRM));
END;
$$ LANGUAGE plpgsql;

-- RPC for creating a shipping zone
CREATE OR REPLACE FUNCTION admin_create_shipping_zone(
  p_zone jsonb,
  p_provinces text[]
) RETURNS jsonb AS $$
DECLARE
  v_zone_id uuid;
  v_province text;
BEGIN
  INSERT INTO shipping_zones (
    name, description, is_active
  ) VALUES (
    p_zone->>'name',
    p_zone->>'description',
    COALESCE((p_zone->>'is_active')::boolean, true)
  ) RETURNING id INTO v_zone_id;

  IF array_length(p_provinces, 1) > 0 THEN
    FOREACH v_province IN ARRAY p_provinces LOOP
      INSERT INTO shipping_zone_coverage (
        zone_id, province_name
      ) VALUES (
        v_zone_id,
        v_province
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', true, 'data', jsonb_build_object('id', v_zone_id, 'name', p_zone->>'name', 'description', p_zone->>'description', 'is_active', COALESCE((p_zone->>'is_active')::boolean, true)));
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', jsonb_build_object('code', SQLSTATE, 'message', SQLERRM));
END;
$$ LANGUAGE plpgsql;

-- RPC for updating a shipping zone
CREATE OR REPLACE FUNCTION admin_update_shipping_zone(
  p_zone_id uuid,
  p_zone jsonb,
  p_provinces text[]
) RETURNS jsonb AS $$
DECLARE
  v_province text;
BEGIN
  IF p_zone IS NOT NULL AND p_zone != '{}'::jsonb THEN
    UPDATE shipping_zones SET
      name = COALESCE(p_zone->>'name', name),
      description = COALESCE(p_zone->>'description', description),
      is_active = COALESCE((p_zone->>'is_active')::boolean, is_active),
      updated_at = NOW()
    WHERE id = p_zone_id;
  END IF;

  IF p_provinces IS NOT NULL THEN
    -- Delete existing coverages
    DELETE FROM shipping_zone_coverage WHERE zone_id = p_zone_id;

    -- Insert new coverages
    IF array_length(p_provinces, 1) > 0 THEN
      FOREACH v_province IN ARRAY p_provinces LOOP
        INSERT INTO shipping_zone_coverage (
          zone_id, province_name
        ) VALUES (
          p_zone_id,
          v_province
        );
      END LOOP;
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'data', jsonb_build_object('id', p_zone_id));
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', jsonb_build_object('code', SQLSTATE, 'message', SQLERRM));
END;
$$ LANGUAGE plpgsql;
-- ==========================================
-- 05: Log Cleanup Script
-- ==========================================

-- Function to delete rate limit logs older than 30 days
CREATE OR REPLACE FUNCTION clean_old_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Hapus log rate limit yang lebih lama dari 30 hari
  DELETE FROM public.rate_limit_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  -- Tambahkan tabel log lainnya di sini jika ada di masa depan
END;
$$;

-- Note: Untuk menjalankan fungsi ini secara otomatis, Anda bisa mengaktifkan ekstensi pg_cron di Supabase
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('0 0 * * *', $$SELECT clean_old_logs()$$);


-- ==========================================
-- LEDGER SCHEMA FIX MIGRATION (V4 - MISSING TABLES & CLEANUP)
-- ==========================================

BEGIN;

-- 1. Add checkout_locks table for concurrency control
CREATE TABLE IF NOT EXISTS public.checkout_locks (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Drop session_id from carts (Guest cart is not implemented)
ALTER TABLE public.carts DROP COLUMN IF EXISTS session_id;

COMMIT;

-- 3. Create function to clean up stale checkout locks (> 5 mins)
CREATE OR REPLACE FUNCTION public.cleanup_checkout_locks()
RETURNS void AS 
BEGIN
    DELETE FROM public.checkout_locks 
    WHERE created_at < NOW() - INTERVAL '5 minutes';
END;
 LANGUAGE plpgsql;
