-- ==============================================================================
-- 27_security_and_bugfixes.sql
-- Comprehensive Security Hardening & Bugfix Migration
--
-- Fixes included:
-- 1. Profiles RLS privilege escalation & PII exposure + staff role CHECK constraint + is_active in is_admin()
-- 2. Private invoices storage bucket & removal of public FOR ALL policy
-- 3. RLS fixes for vouchers (is_hidden), carts (remove unsafe guest session_id),
--    product_reviews (enforce completed order + product ownership), notifications,
--    notification_templates (DELETE policy), stock_notifications (admin + re-subscribe + per-market unique)
-- 4. Missing RPCs: increment_review_helpful, cleanup_checkout_locks
-- 5. Schema sync for rate_limit_logs + atomic advisory lock in check_rate_limit (service_role only)
-- 6. Hardened SECURITY DEFINER RPCs: bulk_update_stock, get_analytics_data, replace_cart_items, create_order
-- 7. admin_update_product variant_idx image mapping & admin_update_flash_sale banner_url clearing
-- 8. create_order: flash sale quota (sold_count + qty <= quota) + FOR UPDATE lock,
--    voucher row lock FOR UPDATE, single-pass pricing snapshot (no Loop1/Loop2 drift),
--    arithmetic consistency for IDR settlement totals
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Profiles: allow 'staff' role, enforce is_active in is_admin(), secure RLS
-- ------------------------------------------------------------------------------
DO $$
DECLARE
  v_conname TEXT;
BEGIN
  FOR v_conname IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%role%'
  LOOP
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS %I', v_conname);
  END LOOP;

  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check CHECK (role IN ('customer', 'admin', 'staff'));
END $$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND LOWER(role) IN ('admin', 'staff')
      AND COALESCE(is_active, true) = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = COALESCE(p_user_id, auth.uid())
      AND LOWER(role) IN ('admin', 'staff')
      AND COALESCE(is_active, true) = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "select_profiles_own" ON public.profiles;
DROP POLICY IF EXISTS "update_profiles_own" ON public.profiles;

CREATE POLICY "select_profiles_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "update_profiles_own" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
    AND is_active = (SELECT p.is_active FROM public.profiles p WHERE p.id = auth.uid())
  );

-- ------------------------------------------------------------------------------
-- 2. Storage Bucket 'invoices': Force Private & Remove Public FOR ALL Policy
-- ------------------------------------------------------------------------------
UPDATE storage.buckets
SET public = false
WHERE id = 'invoices';

DROP POLICY IF EXISTS "Allow public read access to invoices" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload access to invoices" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to read own invoices" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own invoices" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all invoices" ON storage.objects;

CREATE POLICY "Users can view their own invoices" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'invoices'
    AND (
      public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.user_id = auth.uid()
          AND (storage.objects.name = o.order_number || '.html' OR storage.objects.name LIKE o.order_number || '/%')
      )
    )
  );

-- ------------------------------------------------------------------------------
-- 3. RLS Policies: vouchers, carts, product_reviews, notifications,
--    notification_templates, stock_notifications
-- ------------------------------------------------------------------------------
ALTER TABLE public.vouchers
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "select_vouchers_public" ON public.vouchers;
CREATE POLICY "select_vouchers_public" ON public.vouchers
  FOR SELECT USING (COALESCE(is_hidden, false) = false OR public.is_admin());

-- Remove unsafe guest session_id cart access
DROP POLICY IF EXISTS "select_carts_own" ON public.carts;
DROP POLICY IF EXISTS "update_carts_own" ON public.carts;
DROP POLICY IF EXISTS "delete_carts_own" ON public.carts;

CREATE POLICY "select_carts_own" ON public.carts
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "update_carts_own" ON public.carts
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "delete_carts_own" ON public.carts
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- Strengthen product_reviews insert policy
DROP POLICY IF EXISTS "insert_product_reviews_auth" ON public.product_reviews;
CREATE POLICY "insert_product_reviews_auth" ON public.product_reviews
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (
      order_item_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.order_items oi
        JOIN public.orders o ON o.id = oi.order_id
        LEFT JOIN public.product_variants pv ON pv.id = oi.variant_id
        WHERE oi.id = product_reviews.order_item_id
          AND o.user_id = auth.uid()
          AND o.status = 'completed'
          AND (pv.product_id IS NULL OR pv.product_id = product_reviews.product_id)
      )
    )
  );

-- Notifications: allow admins to insert customer notifications
DROP POLICY IF EXISTS "insert_notifications_admin" ON public.notifications;
CREATE POLICY "insert_notifications_admin" ON public.notifications
  FOR INSERT WITH CHECK (public.is_admin());

-- Notification templates: allow admins to delete templates
DROP POLICY IF EXISTS "delete_notification_templates_admin" ON public.notification_templates;
CREATE POLICY "delete_notification_templates_admin" ON public.notification_templates
  FOR DELETE USING (public.is_admin());

-- Stock notifications: admin SELECT/UPDATE, owner UPDATE (for re-subscribe), per-market unique constraint
ALTER TABLE public.stock_notifications
  ADD COLUMN IF NOT EXISTS market VARCHAR(2) NOT NULL DEFAULT 'ID';

DO $$
DECLARE
  v_conname TEXT;
BEGIN
  FOR v_conname IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.stock_notifications'::regclass
      AND contype = 'u'
      AND pg_get_constraintdef(oid) NOT ILIKE '%market%'
  LOOP
    EXECUTE format('ALTER TABLE public.stock_notifications DROP CONSTRAINT IF EXISTS %I', v_conname);
  END LOOP;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.stock_notifications'::regclass
      AND conname = 'stock_notifications_user_variant_market_key'
  ) THEN
    ALTER TABLE public.stock_notifications
      ADD CONSTRAINT stock_notifications_user_variant_market_key UNIQUE (user_id, variant_id, market);
  END IF;
END $$;

DROP POLICY IF EXISTS "select_stock_notifications_admin" ON public.stock_notifications;
CREATE POLICY "select_stock_notifications_admin" ON public.stock_notifications
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "update_stock_notifications_admin" ON public.stock_notifications;
CREATE POLICY "update_stock_notifications_admin" ON public.stock_notifications
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "update_stock_notifications_own" ON public.stock_notifications;
CREATE POLICY "update_stock_notifications_own" ON public.stock_notifications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 4. Missing RPCs: increment_review_helpful & cleanup_checkout_locks
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_review_helpful(p_review_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_count INT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  UPDATE public.product_reviews
  SET helpful_count = COALESCE(helpful_count, 0) + 1
  WHERE id = p_review_id
    AND status = 'approved'
  RETURNING helpful_count INTO v_new_count;

  IF v_new_count IS NULL THEN
    RAISE EXCEPTION 'Review not found or not approved';
  END IF;

  RETURN v_new_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_review_helpful(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_review_helpful(UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.cleanup_checkout_locks()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.checkout_locks
  WHERE created_at < now() - INTERVAL '5 minutes';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cleanup_checkout_locks() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cleanup_checkout_locks() TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 5. Fix rate_limit_logs Schema Drift & Harden check_rate_limit
-- ------------------------------------------------------------------------------
ALTER TABLE public.rate_limit_logs
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS route TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

DO $$
BEGIN
  -- If legacy schema created key VARCHAR(200) PRIMARY KEY NOT NULL, allow auto-generated key
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'rate_limit_logs' AND column_name = 'key'
  ) THEN
    ALTER TABLE public.rate_limit_logs
      ALTER COLUMN key SET DEFAULT gen_random_uuid()::TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_ip_route_created
  ON public.rate_limit_logs (ip_address, route, created_at DESC);

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_ip TEXT,
  p_route TEXT,
  p_window_sec INTEGER,
  p_max_requests INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  -- Serialize concurrent checks for the same (ip, route) within this transaction
  PERFORM pg_advisory_xact_lock(hashtext(COALESCE(p_ip, '') || ':' || COALESCE(p_route, '')));

  v_window_start := now() - make_interval(secs => GREATEST(1, p_window_sec));

  SELECT COUNT(*) INTO v_count
  FROM public.rate_limit_logs
  WHERE ip_address = p_ip
    AND route = p_route
    AND created_at >= v_window_start;

  IF v_count >= p_max_requests THEN
    RETURN false;
  END IF;

  INSERT INTO public.rate_limit_logs (ip_address, route, created_at)
  VALUES (p_ip, p_route, now());

  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_rate_limit(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, TEXT, INTEGER, INTEGER) TO service_role;

-- ------------------------------------------------------------------------------
-- 6. Harden SECURITY DEFINER RPCs: bulk_update_stock, get_analytics_data, replace_cart_items
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bulk_update_stock(updates JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.product_variants
  SET stock = GREATEST(0, u.stock),
      updated_at = NOW()
  FROM jsonb_to_recordset(updates) AS u(sku TEXT, stock INT)
  WHERE public.product_variants.sku = u.sku;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.bulk_update_stock(JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_update_stock(JSONB) TO service_role;

CREATE OR REPLACE FUNCTION public.get_analytics_data(
  p_start_date TIMESTAMPTZ,
  p_country_code VARCHAR DEFAULT 'ALL'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_revenue_trends JSONB;
  v_top_products JSONB;
  v_total_revenue BIGINT;
  v_total_orders BIGINT;
  v_country_breakdown JSONB;
  v_filter_country VARCHAR;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden: Admin access required';
  END IF;

  v_filter_country := UPPER(TRIM(COALESCE(p_country_code, 'ALL')));

  SELECT
    COALESCE(SUM(o.total_amount), 0),
    COUNT(*)
  INTO v_total_revenue, v_total_orders
  FROM public.orders o
  WHERE o.status IN ('paid', 'processing', 'shipped', 'delivered', 'completed')
    AND o.created_at >= p_start_date
    AND (
      v_filter_country = 'ALL' OR
      COALESCE(o.country_code, 'ID') = v_filter_country
    );

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'date', daily.d,
    'revenue', daily.rev
  )), '[]'::jsonb) INTO v_revenue_trends
  FROM (
    SELECT
      TO_CHAR(o.created_at, 'YYYY-MM-DD') AS d,
      COALESCE(SUM(o.total_amount), 0) AS rev
    FROM public.orders o
    WHERE o.status IN ('paid', 'processing', 'shipped', 'delivered', 'completed')
      AND o.created_at >= p_start_date
      AND (
        v_filter_country = 'ALL' OR
        COALESCE(o.country_code, 'ID') = v_filter_country
      )
    GROUP BY TO_CHAR(o.created_at, 'YYYY-MM-DD')
    ORDER BY d ASC
  ) daily;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'name', tp.product_name,
    'quantity', tp.total_qty,
    'revenue', tp.total_rev
  )), '[]'::jsonb) INTO v_top_products
  FROM (
    SELECT
      oi.product_name,
      SUM(oi.quantity) AS total_qty,
      SUM(oi.subtotal) AS total_rev
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE o.status IN ('paid', 'processing', 'shipped', 'delivered', 'completed')
      AND o.created_at >= p_start_date
      AND (
        v_filter_country = 'ALL' OR
        COALESCE(o.country_code, 'ID') = v_filter_country
      )
    GROUP BY oi.product_name
    ORDER BY total_qty DESC
    LIMIT 5
  ) tp;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'country_code', cb.c_code,
    'orders_count', cb.c_orders,
    'revenue', cb.c_revenue,
    'revenue_myr', cb.c_revenue_myr
  )), '[]'::jsonb) INTO v_country_breakdown
  FROM (
    SELECT
      COALESCE(o.country_code, os.country_code, 'ID') AS c_code,
      COUNT(DISTINCT o.id) AS c_orders,
      COALESCE(SUM(o.total_amount), 0) AS c_revenue,
      COALESCE(SUM(o.total_myr), 0) AS c_revenue_myr
    FROM public.orders o
    LEFT JOIN public.order_shipping os ON os.order_id = o.id
    WHERE o.status IN ('paid', 'processing', 'shipped', 'delivered', 'completed')
      AND o.created_at >= p_start_date
    GROUP BY COALESCE(o.country_code, os.country_code, 'ID')
    ORDER BY c_code ASC
  ) cb;

  RETURN jsonb_build_object(
    'revenue_trends', v_revenue_trends,
    'top_products', v_top_products,
    'total_revenue', v_total_revenue,
    'total_orders', v_total_orders,
    'country_breakdown', v_country_breakdown
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_analytics_data(TIMESTAMPTZ, VARCHAR) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_analytics_data(TIMESTAMPTZ, VARCHAR) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.replace_cart_items(p_cart_id UUID, p_items JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item RECORD;
BEGIN
  -- Verify cart ownership when called by an authenticated user
  IF auth.uid() IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.carts
      WHERE id = p_cart_id AND user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'Unauthorized cart access';
    END IF;
  END IF;

  DELETE FROM public.cart_items WHERE cart_id = p_cart_id;

  -- Deduplicate variant_id entries and enforce quantity > 0
  FOR v_item IN
    SELECT
      (elem->>'variant_id')::UUID AS variant_id,
      MAX(GREATEST(1, COALESCE((elem->>'quantity')::INTEGER, 1))) AS quantity
    FROM jsonb_array_elements(COALESCE(p_items, '[]'::jsonb)) AS elem
    WHERE NULLIF(elem->>'variant_id', '') IS NOT NULL
    GROUP BY (elem->>'variant_id')::UUID
  LOOP
    INSERT INTO public.cart_items (cart_id, variant_id, quantity)
    VALUES (p_cart_id, v_item.variant_id, v_item.quantity);
  END LOOP;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.replace_cart_items(UUID, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.replace_cart_items(UUID, JSONB) TO authenticated, service_role;

-- ------------------------------------------------------------------------------
-- 7. Fix admin_update_product (preserve image variant_idx for newly inserted variants)
--    & admin_update_flash_sale (allow clearing banner_url)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_update_product(
  p_product_id UUID,
  p_product JSONB,
  p_variants_to_upsert JSONB,
  p_variant_ids_to_delete UUID[],
  p_images_to_upsert JSONB,
  p_image_ids_to_delete UUID[],
  p_links_to_upsert JSONB,
  p_link_ids_to_delete UUID[],
  p_collections TEXT[]
) RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_variant_idx INT;
  v_variant JSONB;
  v_variant_id UUID;
  v_variant_ids UUID[] := ARRAY[]::UUID[];
  v_attr JSONB;
  v_image JSONB;
  v_resolved_variant_id UUID;
  v_link JSONB;
  v_collection_id UUID;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', jsonb_build_object('code', '42501', 'message', 'Forbidden'));
  END IF;

  IF p_product IS NOT NULL AND p_product != '{}'::jsonb THEN
    UPDATE public.products SET
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
      size_guide = CASE WHEN p_product ? 'size_guide' THEN NULLIF(p_product->>'size_guide', '') ELSE size_guide END,
      size_guide_inch = CASE WHEN p_product ? 'size_guide_inch' THEN NULLIF(p_product->>'size_guide_inch', '') ELSE size_guide_inch END,
      care_guide = CASE WHEN p_product ? 'care_guide' THEN NULLIF(p_product->>'care_guide', '') ELSE care_guide END,
      hs_code = CASE WHEN p_product ? 'hs_code' THEN NULLIF(p_product->>'hs_code', '') ELSE hs_code END,
      short_description_en = CASE WHEN p_product ? 'short_description_en' THEN NULLIF(p_product->>'short_description_en', '') ELSE short_description_en END,
      description_en = CASE WHEN p_product ? 'description_en' THEN NULLIF(p_product->>'description_en', '') ELSE description_en END,
      care_guide_en = CASE WHEN p_product ? 'care_guide_en' THEN NULLIF(p_product->>'care_guide_en', '') ELSE care_guide_en END,
      updated_at = NOW()
    WHERE id = p_product_id;
  END IF;

  IF array_length(p_variant_ids_to_delete, 1) > 0 THEN
    DELETE FROM public.product_variants WHERE id = ANY(p_variant_ids_to_delete);
  END IF;

  IF array_length(p_image_ids_to_delete, 1) > 0 THEN
    DELETE FROM public.product_images WHERE id = ANY(p_image_ids_to_delete);
  END IF;

  IF array_length(p_link_ids_to_delete, 1) > 0 THEN
    DELETE FROM public.product_marketplace_links WHERE id = ANY(p_link_ids_to_delete);
  END IF;

  IF jsonb_array_length(p_variants_to_upsert) > 0 THEN
    FOR v_variant_idx IN 0 .. jsonb_array_length(p_variants_to_upsert) - 1 LOOP
      v_variant := p_variants_to_upsert->v_variant_idx;

      IF v_variant->>'id' IS NOT NULL THEN
        UPDATE public.product_variants SET
          sku = COALESCE(v_variant->>'sku', sku),
          name = COALESCE(v_variant->>'name', name),
          price = COALESCE((v_variant->>'price')::bigint, price),
          compare_price = CASE WHEN v_variant ? 'compare_price' THEN NULLIF(v_variant->>'compare_price', '')::bigint ELSE compare_price END,
          stock = COALESCE((v_variant->>'stock')::int, stock),
          price_myr = CASE WHEN v_variant ? 'price_myr' THEN NULLIF(v_variant->>'price_myr', '')::numeric(12,2) ELSE price_myr END,
          compare_price_myr = CASE WHEN v_variant ? 'compare_price_myr' THEN NULLIF(v_variant->>'compare_price_myr', '')::numeric(12,2) ELSE compare_price_myr END,
          stock_my = CASE WHEN v_variant ? 'stock_my' THEN COALESCE(NULLIF(v_variant->>'stock_my', '')::int, 0) ELSE stock_my END,
          weight_gram = CASE WHEN v_variant ? 'weight_gram' THEN NULLIF(v_variant->>'weight_gram', '')::numeric ELSE weight_gram END,
          is_active = COALESCE((v_variant->>'is_active')::boolean, is_active)
        WHERE id = (v_variant->>'id')::uuid;
        v_variant_id := (v_variant->>'id')::uuid;

        DELETE FROM public.product_variant_attrs WHERE variant_id = v_variant_id;
      ELSE
        INSERT INTO public.product_variants (
          product_id, sku, name, price, compare_price, stock,
          price_myr, compare_price_myr, stock_my,
          weight_gram, is_active
        ) VALUES (
          p_product_id,
          v_variant->>'sku',
          v_variant->>'name',
          (v_variant->>'price')::bigint,
          NULLIF(v_variant->>'compare_price', '')::bigint,
          COALESCE((v_variant->>'stock')::int, 0),
          NULLIF(v_variant->>'price_myr', '')::numeric(12,2),
          NULLIF(v_variant->>'compare_price_myr', '')::numeric(12,2),
          COALESCE(NULLIF(v_variant->>'stock_my', '')::int, 0),
          NULLIF(v_variant->>'weight_gram', '')::numeric,
          COALESCE((v_variant->>'is_active')::boolean, true)
        ) RETURNING id INTO v_variant_id;
      END IF;

      v_variant_ids := array_append(v_variant_ids, v_variant_id);

      IF v_variant ? 'attrs' AND jsonb_array_length(v_variant->'attrs') > 0 THEN
        FOR v_attr IN SELECT * FROM jsonb_array_elements(v_variant->'attrs') LOOP
          INSERT INTO public.product_variant_attrs (variant_id, attr_name, attr_value)
          VALUES (v_variant_id, v_attr->>'attr_name', v_attr->>'attr_value');
        END LOOP;
      END IF;
    END LOOP;
  END IF;

  IF jsonb_array_length(p_images_to_upsert) > 0 THEN
    FOR v_image IN SELECT * FROM jsonb_array_elements(p_images_to_upsert) LOOP
      v_resolved_variant_id := NULLIF(v_image->>'variant_id', '')::uuid;
      IF v_resolved_variant_id IS NULL AND v_image->>'variant_idx' IS NOT NULL THEN
        v_resolved_variant_id := v_variant_ids[(v_image->>'variant_idx')::int + 1];
      END IF;

      IF v_image->>'id' IS NOT NULL THEN
        UPDATE public.product_images SET
          variant_id = v_resolved_variant_id,
          url = COALESCE(v_image->>'url', url),
          alt_text = v_image->>'alt_text',
          is_primary = COALESCE((v_image->>'is_primary')::boolean, is_primary),
          sort_order = COALESCE((v_image->>'sort_order')::int, sort_order)
        WHERE id = (v_image->>'id')::uuid;
      ELSE
        INSERT INTO public.product_images (product_id, variant_id, url, alt_text, is_primary, sort_order)
        VALUES (
          p_product_id,
          v_resolved_variant_id,
          v_image->>'url',
          v_image->>'alt_text',
          COALESCE((v_image->>'is_primary')::boolean, false),
          COALESCE((v_image->>'sort_order')::int, 0)
        );
      END IF;
    END LOOP;
  END IF;

  IF jsonb_array_length(p_links_to_upsert) > 0 THEN
    FOR v_link IN SELECT * FROM jsonb_array_elements(p_links_to_upsert) LOOP
      IF v_link->>'id' IS NOT NULL THEN
        UPDATE public.product_marketplace_links SET
          platform = COALESCE(v_link->>'platform', platform),
          url = COALESCE(v_link->>'url', url),
          label = v_link->>'label',
          sort_order = COALESCE((v_link->>'sort_order')::int, sort_order)
        WHERE id = (v_link->>'id')::uuid;
      ELSE
        INSERT INTO public.product_marketplace_links (product_id, platform, url, label, sort_order)
        VALUES (
          p_product_id,
          v_link->>'platform',
          v_link->>'url',
          v_link->>'label',
          COALESCE((v_link->>'sort_order')::int, 0)
        );
      END IF;
    END LOOP;
  END IF;

  DELETE FROM public.collection_products WHERE product_id = p_product_id;
  IF array_length(p_collections, 1) > 0 THEN
    FOREACH v_collection_id IN ARRAY p_collections LOOP
      INSERT INTO public.collection_products (product_id, collection_id)
      VALUES (p_product_id, v_collection_id::uuid);
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', true, 'data', jsonb_build_object('id', p_product_id));
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', jsonb_build_object('code', SQLSTATE, 'message', SQLERRM));
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_flash_sale(
  p_flash_sale_id UUID,
  p_flash_sale JSONB,
  p_items_to_upsert JSONB,
  p_variant_ids_to_delete UUID[]
) RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_item JSONB;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', jsonb_build_object('code', '42501', 'message', 'Forbidden'));
  END IF;

  IF p_flash_sale IS NOT NULL AND p_flash_sale != '{}'::jsonb THEN
    UPDATE public.flash_sales SET
      name = COALESCE(p_flash_sale->>'name', name),
      description = CASE WHEN p_flash_sale ? 'description' THEN NULLIF(p_flash_sale->>'description', '') ELSE description END,
      banner_url = CASE WHEN p_flash_sale ? 'banner_url' THEN NULLIF(p_flash_sale->>'banner_url', '') ELSE banner_url END,
      starts_at = COALESCE((p_flash_sale->>'starts_at')::timestamptz, starts_at),
      ends_at = COALESCE((p_flash_sale->>'ends_at')::timestamptz, ends_at),
      is_active = COALESCE((p_flash_sale->>'is_active')::boolean, is_active),
      target_market = COALESCE(p_flash_sale->>'target_market', target_market)
    WHERE id = p_flash_sale_id;
  END IF;

  IF array_length(p_variant_ids_to_delete, 1) > 0 THEN
    DELETE FROM public.flash_sale_items
    WHERE flash_sale_id = p_flash_sale_id
      AND variant_id = ANY(p_variant_ids_to_delete);
  END IF;

  IF jsonb_array_length(p_items_to_upsert) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items_to_upsert) LOOP
      INSERT INTO public.flash_sale_items (
        flash_sale_id, variant_id, original_price, sale_price,
        original_price_myr, sale_price_myr, quota, sold_count
      ) VALUES (
        p_flash_sale_id,
        (v_item->>'variant_id')::uuid,
        COALESCE(NULLIF(v_item->>'original_price', '')::numeric, 0),
        COALESCE(NULLIF(v_item->>'sale_price', '')::numeric, 0),
        NULLIF(v_item->>'original_price_myr', '')::numeric(12,2),
        NULLIF(v_item->>'sale_price_myr', '')::numeric(12,2),
        COALESCE((v_item->>'quota')::int, 0),
        COALESCE((v_item->>'sold_count')::int, 0)
      )
      ON CONFLICT (flash_sale_id, variant_id) DO UPDATE SET
        original_price = EXCLUDED.original_price,
        sale_price = EXCLUDED.sale_price,
        original_price_myr = EXCLUDED.original_price_myr,
        sale_price_myr = EXCLUDED.sale_price_myr,
        quota = EXCLUDED.quota;
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', true, 'data', jsonb_build_object('id', p_flash_sale_id));
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', jsonb_build_object('code', SQLSTATE, 'message', SQLERRM));
END;
$$;

-- ------------------------------------------------------------------------------
-- 8. Harden & Fix create_order RPC
--    - Restrict direct execution to service_role (called via createSecureOrderAction)
--    - Lock flash_sale_items FOR UPDATE & check sold_count + quantity <= quota
--    - Lock voucher row FOR UPDATE before validation/usage increment
--    - Single-pass pricing snapshot (no Loop 1 vs Loop 2 drift)
--    - Arithmetically consistent IDR totals
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_order(
    p_user_id UUID,
    p_address_id UUID,
    p_voucher_code TEXT DEFAULT NULL,
    p_courier_name TEXT DEFAULT NULL,
    p_shipping_cost BIGINT DEFAULT 0,
    p_notes TEXT DEFAULT NULL,
    p_payment_fee BIGINT DEFAULT 0,
    p_payment_channel TEXT DEFAULT NULL,
    p_shipping_cost_myr NUMERIC DEFAULT NULL,
    p_payment_fee_myr NUMERIC DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cart_id UUID;
    v_order_id UUID;
    v_order_number TEXT;
    v_subtotal BIGINT := 0;
    v_discount_amount BIGINT := 0;
    v_payment_fee BIGINT := COALESCE(p_payment_fee, 0);
    v_total_amount BIGINT := 0;
    v_shipping_cost BIGINT := COALESCE(p_shipping_cost, 0);

    -- Malaysia native RM amounts
    v_subtotal_myr NUMERIC(12,2) := 0;
    v_shipping_cost_myr NUMERIC(12,2) := 0;
    v_discount_amount_myr NUMERIC(12,2) := 0;
    v_payment_fee_myr NUMERIC(12,2) := 0;
    v_total_myr NUMERIC(12,2) := NULL;
    v_myr_rate NUMERIC := 3600;

    v_voucher_id UUID;
    v_voucher_result JSONB;
    v_user_address RECORD;
    v_cart_item RECORD;
    v_snap_item JSONB;
    v_items_snapshot JSONB := '[]'::jsonb;
    v_actual_price BIGINT;
    v_actual_price_myr NUMERIC(12,2);
    v_flash_sale_item_id UUID;
    v_item_subtotal BIGINT;
    v_address_country VARCHAR(2);
    v_postcode_num INT;
    v_is_east_state BOOLEAN := false;
    v_date TEXT;
    v_random TEXT;
    v_exists BOOLEAN;
    v_cancelled_count INT;
    v_order_item_id UUID;
    v_available_stock INT;
BEGIN
    -- Defense-in-depth auth check
    IF auth.uid() IS NOT NULL AND p_user_id <> auth.uid() THEN
        RETURN jsonb_build_object('success', false, 'message', 'Unauthorized', 'code', 'UNAUTHORIZED');
    END IF;

    -- 0. Validate non-negative financial inputs
    IF COALESCE(p_shipping_cost, 0) < 0 OR COALESCE(p_shipping_cost_myr, 0) < 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Ongkos kirim tidak valid', 'code', 'INVALID_SHIPPING');
    END IF;

    IF COALESCE(p_payment_fee, 0) < 0 OR COALESCE(p_payment_fee_myr, 0) < 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Biaya pembayaran tidak valid', 'code', 'INVALID_PAYMENT_FEE');
    END IF;

    -- 1. Fraud check
    SELECT COUNT(*) INTO v_cancelled_count
    FROM public.orders
    WHERE user_id = p_user_id
      AND status = 'cancelled'
      AND cancelled_at > now() - INTERVAL '24 hours';

    IF v_cancelled_count > 3 THEN
        RETURN jsonb_build_object(
          'success', false,
          'message', 'Terlalu banyak pesanan dibatalkan. Silakan coba lagi nanti.',
          'code', 'FRAUD_DETECTED'
        );
    END IF;

    -- 2. Check user cart
    SELECT id INTO v_cart_id FROM public.carts WHERE user_id = p_user_id LIMIT 1;
    IF v_cart_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Keranjang belanja tidak ditemukan', 'code', 'CART_EMPTY');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.cart_items WHERE cart_id = v_cart_id) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Keranjang belanja kosong', 'code', 'CART_EMPTY');
    END IF;

    -- 3. Fetch user address
    SELECT id, recipient_name, phone, full_address, province_name, city_name, district_name, postal_code, country_code, zone_id
    INTO v_user_address
    FROM public.user_addresses
    WHERE id = p_address_id AND user_id = p_user_id;

    IF v_user_address IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Alamat pengiriman tidak ditemukan', 'code', 'ADDRESS_NOT_FOUND');
    END IF;

    v_address_country := UPPER(TRIM(COALESCE(v_user_address.country_code, 'ID')));

    -- 4. Specific validation for Malaysia addresses
    IF v_address_country = 'MY' THEN
        IF v_user_address.postal_code !~ '^(0[1-9]|[1-8][0-9]|9[0-8])[0-9]{3}$' THEN
            RETURN jsonb_build_object(
              'success', false,
              'message', 'Poskod Malaysia harus berupa 5 digit angka yang valid (01000–98999).',
              'code', 'INVALID_POSTAL_CODE'
            );
        END IF;

        v_postcode_num := v_user_address.postal_code::INT;

        v_is_east_state := (
            LOWER(v_user_address.province_name) LIKE '%sabah%' OR
            LOWER(v_user_address.province_name) LIKE '%sarawak%' OR
            LOWER(v_user_address.province_name) LIKE '%labuan%'
        );

        IF v_is_east_state THEN
            IF v_postcode_num < 87000 OR v_postcode_num > 98999 THEN
                RETURN jsonb_build_object(
                  'success', false,
                  'message', 'Poskod tidak sesuai dengan negeri Malaysia Timur (Sabah, Sarawak, Labuan: 87000–98999).',
                  'code', 'INVALID_POSTAL_CODE_REGION'
                );
            END IF;

            IF LOWER(v_user_address.province_name) LIKE '%labuan%' AND (v_postcode_num < 87000 OR v_postcode_num > 87999) THEN
                RETURN jsonb_build_object(
                  'success', false,
                  'message', 'Poskod Wilayah Persekutuan Labuan harus berada pada rentang 87000–87999.',
                  'code', 'INVALID_POSTAL_CODE_REGION'
                );
            END IF;

            IF LOWER(v_user_address.province_name) LIKE '%sabah%' AND (v_postcode_num < 88000 OR v_postcode_num > 91999) THEN
                RETURN jsonb_build_object(
                  'success', false,
                  'message', 'Poskod Negeri Sabah harus berada pada rentang 88000–91999.',
                  'code', 'INVALID_POSTAL_CODE_REGION'
                );
            END IF;

            IF LOWER(v_user_address.province_name) LIKE '%sarawak%' AND (v_postcode_num < 93000 OR v_postcode_num > 98999) THEN
                RETURN jsonb_build_object(
                  'success', false,
                  'message', 'Poskod Negeri Sarawak harus berada pada rentang 93000–98999.',
                  'code', 'INVALID_POSTAL_CODE_REGION'
                );
            END IF;
        ELSE
            IF v_postcode_num >= 87000 AND v_postcode_num <= 98999 THEN
                RETURN jsonb_build_object(
                  'success', false,
                  'message', 'Poskod 87000–98999 merupakan wilayah Malaysia Timur. Sila pilih negeri Sabah, Sarawak, atau Labuan.',
                  'code', 'INVALID_POSTAL_CODE_REGION'
                );
            END IF;
        END IF;

        IF v_user_address.full_address ~* '(p\.?\s*o\.?\s*box|peti\s*surat|karung\s*berkunci)' THEN
            RETURN jsonb_build_object(
              'success', false,
              'message', 'Alamat P.O. Box tidak didukung untuk pengiriman internasional.',
              'code', 'PO_BOX_REJECTED'
            );
        END IF;

        IF LOWER(COALESCE(p_payment_channel, '')) <> 'qris' THEN
            RETURN jsonb_build_object(
              'success', false,
              'message', 'Metode pembayaran untuk pesanan ke Malaysia wajib menggunakan QRIS Cross-Border (DuitNow).',
              'code', 'INVALID_PAYMENT_CHANNEL'
            );
        END IF;

        SELECT COALESCE(NULLIF(value, '')::NUMERIC, 3600) INTO v_myr_rate
        FROM public.site_settings WHERE key = 'myr_exchange_rate' LIMIT 1;
        IF v_myr_rate IS NULL OR v_myr_rate <= 0 THEN v_myr_rate := 3600; END IF;
    END IF;

    -- 5. Lock variants & flash_sale_items, verify stock & snapshot prices in a single pass
    FOR v_cart_item IN
        SELECT
            ci.variant_id,
            ci.quantity,
            pv.stock,
            pv.stock_my,
            pv.price AS regular_price,
            pv.price_myr AS regular_price_myr,
            pv.name AS variant_name,
            p.name AS product_name,
            pv.sku,
            pv.is_active AS variant_active,
            p.is_active AS product_active
        FROM public.cart_items ci
        JOIN public.product_variants pv ON ci.variant_id = pv.id
        JOIN public.products p ON pv.product_id = p.id
        WHERE ci.cart_id = v_cart_id
        ORDER BY ci.variant_id ASC
        FOR UPDATE OF pv
    LOOP
        IF v_cart_item.quantity <= 0 THEN
            RETURN jsonb_build_object(
              'success', false,
              'message', 'Kuantitas produk tidak valid.',
              'code', 'INVALID_QUANTITY'
            );
        END IF;

        IF NOT v_cart_item.product_active OR NOT v_cart_item.variant_active THEN
            RETURN jsonb_build_object(
              'success', false,
              'message', 'Produk "' || v_cart_item.product_name || '" saat ini tidak aktif.',
              'code', 'PRODUCT_INACTIVE'
            );
        END IF;

        v_flash_sale_item_id := NULL;
        v_actual_price_myr := NULL;

        IF v_address_country = 'MY' THEN
            IF v_cart_item.regular_price_myr IS NULL OR v_cart_item.regular_price_myr <= 0 THEN
                RETURN jsonb_build_object(
                  'success', false,
                  'message', 'Product "' || v_cart_item.product_name || ' (' || v_cart_item.variant_name || ')" is not available for Malaysia shipping.',
                  'code', 'PRODUCT_UNAVAILABLE_MY'
                );
            END IF;

            IF v_cart_item.stock_my < v_cart_item.quantity THEN
                RETURN jsonb_build_object(
                  'success', false,
                  'message', 'Insufficient Malaysia stock for ' || v_cart_item.product_name || ' (' || v_cart_item.variant_name || ') (remaining: ' || v_cart_item.stock_my || ').',
                  'code', 'STOCK_INSUFFICIENT'
                );
            END IF;

            v_actual_price_myr := v_cart_item.regular_price_myr;

            SELECT fsi.id, fsi.sale_price_myr INTO v_flash_sale_item_id, v_actual_price_myr
            FROM public.flash_sale_items fsi
            JOIN public.flash_sales fs ON fs.id = fsi.flash_sale_id
            WHERE fsi.variant_id = v_cart_item.variant_id
              AND fs.is_active = true
              AND fs.starts_at <= now()
              AND fs.ends_at > now()
              AND (fsi.quota = 0 OR (fsi.sold_count + v_cart_item.quantity) <= fsi.quota)
              AND (fs.target_market = 'ALL' OR fs.target_market = 'MY')
              AND fsi.sale_price_myr IS NOT NULL AND fsi.sale_price_myr > 0
            ORDER BY fs.starts_at DESC
            LIMIT 1
            FOR UPDATE OF fsi;

            IF v_actual_price_myr IS NULL OR v_actual_price_myr <= 0 THEN
                v_actual_price_myr := v_cart_item.regular_price_myr;
                v_flash_sale_item_id := NULL;
            END IF;

            v_subtotal_myr := v_subtotal_myr + ROUND(v_actual_price_myr * v_cart_item.quantity, 2);
            v_actual_price := ROUND(v_actual_price_myr * v_myr_rate)::BIGINT;
            v_subtotal := v_subtotal + (v_actual_price * v_cart_item.quantity);
            v_available_stock := v_cart_item.stock_my;
        ELSE
            IF v_cart_item.stock < v_cart_item.quantity THEN
                RETURN jsonb_build_object(
                  'success', false,
                  'message', 'Stok produk ' || v_cart_item.product_name || ' (' || v_cart_item.variant_name || ') tidak mencukupi (sisa: ' || v_cart_item.stock || ').',
                  'code', 'STOCK_INSUFFICIENT'
                );
            END IF;

            v_actual_price := v_cart_item.regular_price;

            SELECT fsi.id, fsi.sale_price INTO v_flash_sale_item_id, v_actual_price
            FROM public.flash_sale_items fsi
            JOIN public.flash_sales fs ON fs.id = fsi.flash_sale_id
            WHERE fsi.variant_id = v_cart_item.variant_id
              AND fs.is_active = true
              AND fs.starts_at <= now()
              AND fs.ends_at > now()
              AND (fsi.quota = 0 OR (fsi.sold_count + v_cart_item.quantity) <= fsi.quota)
              AND (fs.target_market = 'ALL' OR fs.target_market = 'ID')
            ORDER BY fs.starts_at DESC
            LIMIT 1
            FOR UPDATE OF fsi;

            IF v_actual_price IS NULL THEN
                v_actual_price := v_cart_item.regular_price;
                v_flash_sale_item_id := NULL;
            END IF;

            v_subtotal := v_subtotal + (v_actual_price * v_cart_item.quantity);
            v_available_stock := v_cart_item.stock;
        END IF;

        -- Snapshot locked price & flash_sale_item_id so Step 10 cannot drift from Step 5
        v_items_snapshot := v_items_snapshot || jsonb_build_array(jsonb_build_object(
            'variant_id', v_cart_item.variant_id,
            'quantity', v_cart_item.quantity,
            'product_name', v_cart_item.product_name,
            'variant_name', v_cart_item.variant_name,
            'sku', v_cart_item.sku,
            'actual_price', v_actual_price,
            'actual_price_myr', v_actual_price_myr,
            'flash_sale_item_id', v_flash_sale_item_id,
            'available_stock', v_available_stock
        ));
    END LOOP;

    -- 6. Lock voucher row FOR UPDATE & validate if provided
    IF p_voucher_code IS NOT NULL AND TRIM(p_voucher_code) <> '' THEN
        PERFORM 1
        FROM public.vouchers
        WHERE UPPER(code) = UPPER(TRIM(p_voucher_code))
        FOR UPDATE;

        IF v_address_country = 'MY' THEN
            v_voucher_result := public.validate_voucher(p_voucher_code, v_subtotal_myr, p_user_id, 'MY');
            IF (v_voucher_result->>'valid')::BOOLEAN = true THEN
                v_voucher_id := (v_voucher_result->>'voucher_id')::UUID;
                v_discount_amount_myr := ROUND((v_voucher_result->>'discount_amount')::NUMERIC, 2);
                v_discount_amount := ROUND(v_discount_amount_myr * v_myr_rate)::BIGINT;
            ELSE
                RETURN jsonb_build_object(
                  'success', false,
                  'message', COALESCE(v_voucher_result->>'message', 'Invalid voucher code.'),
                  'code', COALESCE(v_voucher_result->>'code', 'VOUCHER_INVALID')
                );
            END IF;
        ELSE
            v_voucher_result := public.validate_voucher(p_voucher_code, v_subtotal, p_user_id, 'ID');
            IF (v_voucher_result->>'valid')::BOOLEAN = true THEN
                v_voucher_id := (v_voucher_result->>'voucher_id')::UUID;
                v_discount_amount := (v_voucher_result->>'discount_amount')::BIGINT;
            ELSE
                RETURN jsonb_build_object(
                  'success', false,
                  'message', COALESCE(v_voucher_result->>'message', 'Voucher tidak valid.'),
                  'code', COALESCE(v_voucher_result->>'code', 'VOUCHER_INVALID')
                );
            END IF;
        END IF;
    END IF;

    -- 7. Final totals (pure RM for MY, IDR for ID; keep IDR columns arithmetically consistent)
    IF v_address_country = 'MY' THEN
        v_shipping_cost_myr := COALESCE(p_shipping_cost_myr, ROUND(v_shipping_cost::NUMERIC / v_myr_rate, 2));
        v_payment_fee_myr := COALESCE(p_payment_fee_myr, ROUND(v_payment_fee::NUMERIC / v_myr_rate, 2));
        v_total_myr := GREATEST(0, ROUND(v_subtotal_myr + v_shipping_cost_myr + v_payment_fee_myr - v_discount_amount_myr, 2));

        -- Convert to IDR for DOKU QRIS settlement (consistent sum)
        v_shipping_cost := ROUND(v_shipping_cost_myr * v_myr_rate)::BIGINT;
        v_payment_fee := ROUND(v_payment_fee_myr * v_myr_rate)::BIGINT;
        v_total_amount := GREATEST(0, v_subtotal + v_shipping_cost + v_payment_fee - v_discount_amount);

        IF v_total_amount > 10000000 THEN
            RETURN jsonb_build_object(
              'success', false,
              'message', 'Total transaksi melebihi batas regulasi QRIS Antarnegara (Rp 10.000.000). Silakan bagi menjadi 2 pesanan.',
              'code', 'QRIS_LIMIT_EXCEEDED'
            );
        END IF;
    ELSE
        v_total_amount := GREATEST(0, v_subtotal + v_shipping_cost + v_payment_fee - v_discount_amount);
    END IF;

    -- 8. Generate order number
    v_date := TO_CHAR(NOW(), 'YYYYMMDD');
    LOOP
        v_random := LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
        v_order_number := CASE WHEN v_address_country = 'MY'
          THEN 'ORD-MY-' || v_date || '-' || v_random
          ELSE 'ORD-' || v_date || '-' || v_random
        END;
        SELECT EXISTS(SELECT 1 FROM public.orders WHERE order_number = v_order_number) INTO v_exists;
        EXIT WHEN NOT v_exists;
    END LOOP;

    -- 9. Insert orders record
    INSERT INTO public.orders (
        user_id, order_number, status,
        subtotal, shipping_cost, discount_amount, total_amount, payment_fee, payment_channel, notes, voucher_id,
        country_code, exchange_rate_at_order, markup_percent_at_order,
        subtotal_myr, shipping_cost_myr, discount_amount_myr, payment_fee_myr, total_myr
    ) VALUES (
        p_user_id, v_order_number, 'pending_payment',
        v_subtotal, v_shipping_cost, v_discount_amount, v_total_amount, v_payment_fee, p_payment_channel, p_notes, v_voucher_id,
        v_address_country,
        CASE WHEN v_address_country = 'MY' THEN v_myr_rate ELSE NULL END,
        NULL,
        CASE WHEN v_address_country = 'MY' THEN v_subtotal_myr ELSE NULL END,
        CASE WHEN v_address_country = 'MY' THEN v_shipping_cost_myr ELSE NULL END,
        CASE WHEN v_address_country = 'MY' THEN v_discount_amount_myr ELSE NULL END,
        CASE WHEN v_address_country = 'MY' THEN v_payment_fee_myr ELSE NULL END,
        v_total_myr
    ) RETURNING id INTO v_order_id;

    -- 10. Insert order items from snapshot, deduct market-specific stock, log mutation & update flash sale quota
    FOR v_snap_item IN SELECT * FROM jsonb_array_elements(v_items_snapshot) LOOP
        v_actual_price := (v_snap_item->>'actual_price')::BIGINT;
        v_actual_price_myr := NULLIF(v_snap_item->>'actual_price_myr', '')::NUMERIC(12,2);
        v_flash_sale_item_id := NULLIF(v_snap_item->>'flash_sale_item_id', '')::UUID;
        v_available_stock := (v_snap_item->>'available_stock')::INT;
        v_item_subtotal := v_actual_price * (v_snap_item->>'quantity')::INT;

        INSERT INTO public.order_items (
            order_id, variant_id, flash_sale_item_id, product_name, variant_name, sku, price, quantity, subtotal, unit_price_myr
        ) VALUES (
            v_order_id,
            (v_snap_item->>'variant_id')::UUID,
            v_flash_sale_item_id,
            v_snap_item->>'product_name',
            v_snap_item->>'variant_name',
            v_snap_item->>'sku',
            v_actual_price,
            (v_snap_item->>'quantity')::INT,
            v_item_subtotal,
            v_actual_price_myr
        ) RETURNING id INTO v_order_item_id;

        IF v_address_country = 'MY' THEN
            UPDATE public.product_variants
            SET stock_my = stock_my - (v_snap_item->>'quantity')::INT
            WHERE id = (v_snap_item->>'variant_id')::UUID;
        ELSE
            UPDATE public.product_variants
            SET stock = stock - (v_snap_item->>'quantity')::INT
            WHERE id = (v_snap_item->>'variant_id')::UUID;
        END IF;

        INSERT INTO public.stock_mutations (variant_id, order_item_id, type, qty, qty_before, qty_after, note, market)
        VALUES (
          (v_snap_item->>'variant_id')::UUID,
          v_order_item_id,
          'out',
          (v_snap_item->>'quantity')::INT,
          v_available_stock,
          v_available_stock - (v_snap_item->>'quantity')::INT,
          'Order: ' || v_order_number,
          v_address_country
        );

        IF v_flash_sale_item_id IS NOT NULL THEN
            UPDATE public.flash_sale_items
            SET sold_count = sold_count + (v_snap_item->>'quantity')::INT
            WHERE id = v_flash_sale_item_id;
        END IF;
    END LOOP;

    -- 11. Insert order shipping snapshot
    INSERT INTO public.order_shipping (
        order_id, recipient_name, phone, full_address, province_name, city_name, district_name, postal_code, country_code, courier_name
    ) VALUES (
        v_order_id,
        v_user_address.recipient_name,
        v_user_address.phone,
        v_user_address.full_address,
        v_user_address.province_name,
        v_user_address.city_name,
        v_user_address.district_name,
        v_user_address.postal_code,
        v_address_country,
        COALESCE(p_courier_name, CASE WHEN v_address_country = 'MY' THEN 'International Express (MY)' ELSE 'Standard' END)
    );

    -- 12. Record voucher usage
    IF v_voucher_id IS NOT NULL THEN
        INSERT INTO public.voucher_usages (voucher_id, user_id, order_id, discount_amount)
        VALUES (v_voucher_id, p_user_id, v_order_id, v_discount_amount);

        UPDATE public.vouchers
        SET used_count = used_count + 1
        WHERE id = v_voucher_id;
    END IF;

    -- 13. Insert initial payment record
    INSERT INTO public.payments (
        order_id, amount, payment_fee, payment_channel, status, gateway_order_id
    ) VALUES (
        v_order_id, v_total_amount, v_payment_fee, p_payment_channel, 'pending', v_order_number
    );

    -- 14. Clear cart
    DELETE FROM public.cart_items WHERE cart_id = v_cart_id;

    RETURN jsonb_build_object(
        'success', true,
        'data', jsonb_build_object(
            'order_id', v_order_id,
            'order_number', v_order_number,
            'country_code', v_address_country,
            'subtotal', v_subtotal,
            'shipping_cost', v_shipping_cost,
            'discount_amount', v_discount_amount,
            'payment_fee', v_payment_fee,
            'payment_channel', p_payment_channel,
            'total_amount', v_total_amount,
            'subtotal_myr', CASE WHEN v_address_country = 'MY' THEN v_subtotal_myr ELSE NULL END,
            'shipping_cost_myr', CASE WHEN v_address_country = 'MY' THEN v_shipping_cost_myr ELSE NULL END,
            'discount_amount_myr', CASE WHEN v_address_country = 'MY' THEN v_discount_amount_myr ELSE NULL END,
            'payment_fee_myr', CASE WHEN v_address_country = 'MY' THEN v_payment_fee_myr ELSE NULL END,
            'total_myr', v_total_myr,
            'status', 'pending_payment'
        )
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'message', 'Terjadi kesalahan: ' || SQLERRM, 'code', 'ORDER_ERROR');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_order(
  UUID, UUID, TEXT, TEXT, BIGINT, TEXT, BIGINT, TEXT, NUMERIC, NUMERIC
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order(
  UUID, UUID, TEXT, TEXT, BIGINT, TEXT, BIGINT, TEXT, NUMERIC, NUMERIC
) TO service_role;

COMMIT;
