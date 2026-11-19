-- ==============================================================================
-- 26_malaysia_manual_pricing_stock_orders.sql
-- Migration: Manual MYR Pricing, Isolated MY Stock, RM Shipping/Vouchers & Separated Orders
--
-- Features implemented:
-- 1. product_variants: price_myr, compare_price_myr, stock_my (manual website stock)
-- 2. products: min_price_myr, max_price_myr + trigger update_product_price_range()
-- 3. notify_back_in_stock(): market-aware trigger (stock -> ID, stock_my -> MY)
-- 4. admin_create_product & admin_update_product: persist price_myr, compare_price_myr, stock_my
-- 5. flash_sale_items: sale_price_myr, original_price_myr + updated admin flash sale RPCs
-- 6. shipping_rates: base_price_myr, price_per_kg_myr + updated calculate_shipping RPC (RM for MY zones)
-- 7. vouchers: currency ('IDR'/'MYR'), NUMERIC(12,2) amounts + updated validate_voucher RPC (native RM for MY)
-- 8. orders: subtotal_myr, shipping_cost_myr, discount_amount_myr, payment_fee_myr
-- 9. stock_mutations: market ('ID' | 'MY')
-- 10. create_order & cancel_order: pure manual RM math + ORD-MY- prefix + stock_my isolation + DOKU IDR settlement
-- 11. site_settings: remove obsolete markup/rounding keys & clarify myr_exchange_rate as DOKU QRIS settlement rate
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. product_variants & products: Manual MYR pricing & isolated MY stock
-- ------------------------------------------------------------------------------
ALTER TABLE public.product_variants
  ADD COLUMN IF NOT EXISTS price_myr NUMERIC(12,2) NULL,
  ADD COLUMN IF NOT EXISTS compare_price_myr NUMERIC(12,2) NULL,
  ADD COLUMN IF NOT EXISTS stock_my INT NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_variants_price_myr_check') THEN
    ALTER TABLE public.product_variants
      ADD CONSTRAINT product_variants_price_myr_check CHECK (price_myr IS NULL OR price_myr >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_variants_compare_price_myr_check') THEN
    ALTER TABLE public.product_variants
      ADD CONSTRAINT product_variants_compare_price_myr_check CHECK (compare_price_myr IS NULL OR compare_price_myr >= 0);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_variants_stock_my_check') THEN
    ALTER TABLE public.product_variants
      ADD CONSTRAINT product_variants_stock_my_check CHECK (stock_my >= 0);
  END IF;
END $$;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS min_price_myr NUMERIC(12,2) NULL,
  ADD COLUMN IF NOT EXISTS max_price_myr NUMERIC(12,2) NULL;

CREATE INDEX IF NOT EXISTS idx_product_variants_price_myr
  ON public.product_variants (product_id, price_myr)
  WHERE price_myr IS NOT NULL AND price_myr > 0 AND is_active = true;

-- ------------------------------------------------------------------------------
-- 2. Trigger Functions: update_product_price_range & notify_back_in_stock
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_product_price_range()
RETURNS TRIGGER AS $$
DECLARE
  v_prod_id UUID;
BEGIN
  v_prod_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.product_id ELSE NEW.product_id END;

  UPDATE public.products
  SET
    min_price = (SELECT MIN(price) FROM public.product_variants WHERE product_id = v_prod_id AND is_active = true),
    max_price = (SELECT MAX(price) FROM public.product_variants WHERE product_id = v_prod_id AND is_active = true),
    min_price_myr = (SELECT MIN(price_myr) FROM public.product_variants WHERE product_id = v_prod_id AND is_active = true AND price_myr IS NOT NULL AND price_myr > 0),
    max_price_myr = (SELECT MAX(price_myr) FROM public.product_variants WHERE product_id = v_prod_id AND is_active = true AND price_myr IS NOT NULL AND price_myr > 0)
  WHERE id = v_prod_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_variant_price_range ON public.product_variants;
CREATE TRIGGER trg_variant_price_range
  AFTER INSERT OR DELETE OR UPDATE OF price, price_myr, is_active
  ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_price_range();

CREATE OR REPLACE FUNCTION public.notify_back_in_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Indonesia stock restocked (0 -> > 0)
  IF OLD.stock = 0 AND NEW.stock > 0 THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    SELECT
      sn.user_id,
      'back_in_stock',
      'Produk Tersedia Kembali!',
      p.name || ' - ' || NEW.name || ' sudah tersedia kembali. Segera pesan sebelum kehabisan!',
      jsonb_build_object(
        'variant_id', NEW.id,
        'product_id', NEW.product_id,
        'product_slug', p.slug,
        'variant_name', NEW.name,
        'market', 'ID'
      )
    FROM public.stock_notifications sn
    JOIN public.products p ON p.id = NEW.product_id
    WHERE sn.variant_id = NEW.id
      AND sn.is_notified = FALSE
      AND COALESCE(sn.market, 'ID') = 'ID';

    UPDATE public.stock_notifications
    SET is_notified = TRUE, notified_at = now()
    WHERE variant_id = NEW.id
      AND is_notified = FALSE
      AND COALESCE(market, 'ID') = 'ID';
  END IF;

  -- 2. Malaysia stock restocked (0 -> > 0)
  IF OLD.stock_my = 0 AND NEW.stock_my > 0 THEN
    INSERT INTO public.notifications (user_id, type, title, message, data)
    SELECT
      sn.user_id,
      'back_in_stock',
      'Back in Stock! ✨',
      p.name || ' - ' || NEW.name || ' is back in stock for Malaysia. Order now before it sells out!',
      jsonb_build_object(
        'variant_id', NEW.id,
        'product_id', NEW.product_id,
        'product_slug', p.slug,
        'variant_name', NEW.name,
        'market', 'MY'
      )
    FROM public.stock_notifications sn
    JOIN public.products p ON p.id = NEW.product_id
    WHERE sn.variant_id = NEW.id
      AND sn.is_notified = FALSE
      AND sn.market = 'MY';

    UPDATE public.stock_notifications
    SET is_notified = TRUE, notified_at = now()
    WHERE variant_id = NEW.id
      AND is_notified = FALSE
      AND market = 'MY';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 3. Update admin_create_product & admin_update_product RPCs
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_create_product(
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
  INSERT INTO public.products (
    category_id, name, slug, description, short_description, weight_gram,
    is_featured, is_active, meta_title, meta_description, size_guide, size_guide_inch, care_guide, hs_code,
    short_description_en, description_en, care_guide_en
  ) VALUES (
    (p_product->>'category_id')::uuid,
    p_product->>'name',
    p_product->>'slug',
    p_product->>'description',
    p_product->>'short_description',
    (p_product->>'weight_gram')::numeric,
    COALESCE((p_product->>'is_featured')::boolean, false),
    COALESCE((p_product->>'is_active')::boolean, true),
    p_product->>'meta_title',
    p_product->>'meta_description',
    NULLIF(p_product->>'size_guide', ''),
    NULLIF(p_product->>'size_guide_inch', ''),
    NULLIF(p_product->>'care_guide', ''),
    NULLIF(p_product->>'hs_code', ''),
    NULLIF(p_product->>'short_description_en', ''),
    NULLIF(p_product->>'description_en', ''),
    NULLIF(p_product->>'care_guide_en', '')
  ) RETURNING id INTO v_product_id;

  IF jsonb_array_length(p_variants) > 0 THEN
    FOR v_variant_idx IN 0 .. jsonb_array_length(p_variants) - 1 LOOP
      v_variant := p_variants->v_variant_idx;

      INSERT INTO public.product_variants (
        product_id, sku, name, price, compare_price, stock,
        price_myr, compare_price_myr, stock_my,
        weight_gram, is_active
      ) VALUES (
        v_product_id,
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

      v_variant_ids := array_append(v_variant_ids, v_variant_id);

      IF v_variant ? 'attrs' AND jsonb_array_length(v_variant->'attrs') > 0 THEN
        FOR v_attr IN SELECT * FROM jsonb_array_elements(v_variant->'attrs') LOOP
          INSERT INTO public.product_variant_attrs (variant_id, attr_name, attr_value)
          VALUES (v_variant_id, v_attr->>'attr_name', v_attr->>'attr_value');
        END LOOP;
      END IF;
    END LOOP;
  END IF;

  IF jsonb_array_length(p_images) > 0 THEN
    FOR v_image IN SELECT * FROM jsonb_array_elements(p_images) LOOP
      INSERT INTO public.product_images (product_id, variant_id, url, alt_text, is_primary, sort_order)
      VALUES (
        v_product_id,
        CASE WHEN v_image->>'variant_idx' IS NOT NULL THEN v_variant_ids[(v_image->>'variant_idx')::int + 1] ELSE NULL END,
        v_image->>'url',
        v_image->>'alt_text',
        COALESCE((v_image->>'is_primary')::boolean, false),
        COALESCE((v_image->>'sort_order')::int, 0)
      );
    END LOOP;
  END IF;

  IF jsonb_array_length(p_links) > 0 THEN
    FOR v_link IN SELECT * FROM jsonb_array_elements(p_links) LOOP
      INSERT INTO public.product_marketplace_links (product_id, platform, url, label, sort_order)
      VALUES (
        v_product_id,
        v_link->>'platform',
        v_link->>'url',
        v_link->>'label',
        COALESCE((v_link->>'sort_order')::int, 0)
      );
    END LOOP;
  END IF;

  IF array_length(p_collections, 1) > 0 THEN
    FOREACH v_collection_id IN ARRAY p_collections LOOP
      INSERT INTO public.collection_products (product_id, collection_id)
      VALUES (v_product_id, v_collection_id::uuid);
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', true, 'data', jsonb_build_object('id', v_product_id));
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', jsonb_build_object('code', SQLSTATE, 'message', SQLERRM));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.admin_update_product(
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
    FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants_to_upsert) LOOP
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
      IF v_image->>'id' IS NOT NULL THEN
        UPDATE public.product_images SET
          variant_id = NULLIF(v_image->>'variant_id', '')::uuid,
          url = COALESCE(v_image->>'url', url),
          alt_text = v_image->>'alt_text',
          is_primary = COALESCE((v_image->>'is_primary')::boolean, is_primary),
          sort_order = COALESCE((v_image->>'sort_order')::int, sort_order)
        WHERE id = (v_image->>'id')::uuid;
      ELSE
        INSERT INTO public.product_images (product_id, variant_id, url, alt_text, is_primary, sort_order)
        VALUES (
          p_product_id,
          NULLIF(v_image->>'variant_id', '')::uuid,
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
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 4. flash_sale_items: Manual RM sale price
-- ------------------------------------------------------------------------------
ALTER TABLE public.flash_sale_items
  ADD COLUMN IF NOT EXISTS original_price_myr NUMERIC(12,2) NULL,
  ADD COLUMN IF NOT EXISTS sale_price_myr NUMERIC(12,2) NULL;

CREATE OR REPLACE FUNCTION public.admin_create_flash_sale(
  p_flash_sale jsonb,
  p_items jsonb
) RETURNS jsonb AS $$
DECLARE
  v_flash_sale_id uuid;
  v_item jsonb;
BEGIN
  INSERT INTO public.flash_sales (
    name, description, banner_url, starts_at, ends_at, is_active, target_market
  ) VALUES (
    p_flash_sale->>'name',
    p_flash_sale->>'description',
    p_flash_sale->>'banner_url',
    (p_flash_sale->>'starts_at')::timestamptz,
    (p_flash_sale->>'ends_at')::timestamptz,
    COALESCE((p_flash_sale->>'is_active')::boolean, true),
    COALESCE(NULLIF(p_flash_sale->>'target_market', ''), 'ALL')
  ) RETURNING id INTO v_flash_sale_id;

  IF jsonb_array_length(p_items) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
      INSERT INTO public.flash_sale_items (
        flash_sale_id, variant_id, original_price, sale_price,
        original_price_myr, sale_price_myr, quota, sold_count
      ) VALUES (
        v_flash_sale_id,
        (v_item->>'variant_id')::uuid,
        COALESCE(NULLIF(v_item->>'original_price', '')::numeric, 0),
        COALESCE(NULLIF(v_item->>'sale_price', '')::numeric, 0),
        NULLIF(v_item->>'original_price_myr', '')::numeric(12,2),
        NULLIF(v_item->>'sale_price_myr', '')::numeric(12,2),
        COALESCE((v_item->>'quota')::int, 0),
        COALESCE((v_item->>'sold_count')::int, 0)
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object('success', true, 'data', jsonb_build_object('id', v_flash_sale_id));
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', jsonb_build_object('code', SQLSTATE, 'message', SQLERRM));
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.admin_update_flash_sale(
  p_flash_sale_id uuid,
  p_flash_sale jsonb,
  p_items_to_upsert jsonb,
  p_variant_ids_to_delete uuid[]
) RETURNS jsonb AS $$
DECLARE
  v_item jsonb;
BEGIN
  IF p_flash_sale IS NOT NULL AND p_flash_sale != '{}'::jsonb THEN
    UPDATE public.flash_sales SET
      name = COALESCE(p_flash_sale->>'name', name),
      description = COALESCE(p_flash_sale->>'description', description),
      banner_url = COALESCE(p_flash_sale->>'banner_url', banner_url),
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
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 5. shipping_rates: Native RM rates for Malaysia zones + calculate_shipping RPC
-- ------------------------------------------------------------------------------
ALTER TABLE public.shipping_rates
  ADD COLUMN IF NOT EXISTS base_price_myr NUMERIC(12,2) NULL,
  ADD COLUMN IF NOT EXISTS price_per_kg_myr NUMERIC(12,2) NULL;

-- Backfill initial RM rates for existing Malaysia zones (Zone 6 & Zone 7) if NULL
UPDATE public.shipping_rates sr
SET
  base_price_myr = COALESCE(sr.base_price_myr, ROUND(sr.base_price / 3600.0, 2)),
  price_per_kg_myr = COALESCE(sr.price_per_kg_myr, ROUND(sr.price_per_kg / 3600.0, 2))
WHERE EXISTS (
  SELECT 1 FROM public.shipping_zone_coverage szc
  WHERE szc.zone_id = sr.zone_id AND szc.country_code = 'MY'
);

CREATE OR REPLACE FUNCTION public.calculate_shipping(
  p_zone_id UUID,
  p_weight_gram INT
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_is_my_zone BOOLEAN := false;
  v_myr_rate NUMERIC := 3600;
BEGIN
  IF p_zone_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Zona pengiriman tidak valid', 'code', 'INVALID_ZONE');
  END IF;

  IF p_weight_gram <= 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Berat harus lebih dari 0', 'code', 'INVALID_WEIGHT');
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.shipping_zone_coverage
    WHERE zone_id = p_zone_id AND country_code = 'MY'
  ) INTO v_is_my_zone;

  IF v_is_my_zone THEN
    SELECT COALESCE(NULLIF(value, '')::NUMERIC, 3600) INTO v_myr_rate
    FROM public.site_settings WHERE key = 'myr_exchange_rate' LIMIT 1;
    IF v_myr_rate IS NULL OR v_myr_rate <= 0 THEN v_myr_rate := 3600; END IF;

    SELECT jsonb_build_object(
      'success', true,
      'data', COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', sr.id,
          'courier_name', sr.courier_name,
          'currency', 'MYR',
          'price_myr', ROUND(GREATEST(
            COALESCE(sr.base_price_myr, ROUND(sr.base_price / v_myr_rate, 2)),
            CEIL(GREATEST(p_weight_gram, sr.min_weight_gram)::NUMERIC / 1000) * COALESCE(sr.price_per_kg_myr, ROUND(sr.price_per_kg / v_myr_rate, 2))
          ), 2),
          'price', ROUND(GREATEST(
            COALESCE(sr.base_price_myr, ROUND(sr.base_price / v_myr_rate, 2)),
            CEIL(GREATEST(p_weight_gram, sr.min_weight_gram)::NUMERIC / 1000) * COALESCE(sr.price_per_kg_myr, ROUND(sr.price_per_kg / v_myr_rate, 2))
          ) * v_myr_rate)::BIGINT,
          'etd_min', sr.etd_days_min,
          'etd_max', sr.etd_days_max,
          'weight_used_gram', GREATEST(p_weight_gram, sr.min_weight_gram),
          'max_weight_gram', sr.max_weight_gram
        )
      ), '[]'::jsonb)
    ) INTO v_result
    FROM public.shipping_rates sr
    WHERE sr.zone_id = p_zone_id
      AND sr.is_active = true
      AND (sr.max_weight_gram IS NULL OR p_weight_gram <= sr.max_weight_gram);
  ELSE
    SELECT jsonb_build_object(
      'success', true,
      'data', COALESCE(jsonb_agg(
        jsonb_build_object(
          'id', sr.id,
          'courier_name', sr.courier_name,
          'currency', 'IDR',
          'price_myr', NULL,
          'price', GREATEST(
            sr.base_price,
            CEIL(GREATEST(p_weight_gram, sr.min_weight_gram)::NUMERIC / 1000) * sr.price_per_kg
          )::BIGINT,
          'etd_min', sr.etd_days_min,
          'etd_max', sr.etd_days_max,
          'weight_used_gram', GREATEST(p_weight_gram, sr.min_weight_gram),
          'max_weight_gram', sr.max_weight_gram
        )
      ), '[]'::jsonb)
    ) INTO v_result
    FROM public.shipping_rates sr
    WHERE sr.zone_id = p_zone_id
      AND sr.is_active = true
      AND (sr.max_weight_gram IS NULL OR p_weight_gram <= sr.max_weight_gram);
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 6. vouchers: Support decimal RM amounts & currency column + validate_voucher RPC
-- ------------------------------------------------------------------------------
ALTER TABLE public.vouchers
  ALTER COLUMN value TYPE NUMERIC(12,2),
  ALTER COLUMN min_purchase TYPE NUMERIC(12,2),
  ALTER COLUMN max_discount TYPE NUMERIC(12,2);

ALTER TABLE public.vouchers
  ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'IDR';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vouchers_currency_check') THEN
    ALTER TABLE public.vouchers
      ADD CONSTRAINT vouchers_currency_check CHECK (currency IN ('IDR', 'MYR'));
  END IF;
END $$;

-- Auto-mark existing MY-only vouchers as MYR if any
UPDATE public.vouchers
SET currency = 'MYR'
WHERE applicable_countries = ARRAY['MY']::text[] AND currency = 'IDR';

CREATE OR REPLACE FUNCTION public.validate_voucher(
  p_code TEXT,
  p_subtotal NUMERIC,
  p_user_id UUID,
  p_country_code VARCHAR DEFAULT 'ID'
)
RETURNS JSONB AS $$
DECLARE
  v_voucher RECORD;
  v_user_usage_count INT;
  v_discount_amount NUMERIC;
  v_country VARCHAR(2);
  v_myr_rate NUMERIC := 3600;
  v_eff_min_purchase NUMERIC;
  v_eff_value NUMERIC;
  v_eff_max_discount NUMERIC;
  v_min_spend_msg TEXT;
BEGIN
  IF p_code IS NULL OR TRIM(p_code) = '' THEN
    RETURN jsonb_build_object('success', false, 'valid', false, 'message', 'Kode voucher tidak boleh kosong', 'code', 'VOUCHER_INVALID');
  END IF;

  v_country := UPPER(TRIM(COALESCE(p_country_code, 'ID')));

  SELECT * INTO v_voucher
  FROM public.vouchers
  WHERE code = UPPER(TRIM(p_code))
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', true, 'valid', false,
      'message', CASE WHEN v_country = 'MY' THEN 'Voucher code not found' ELSE 'Kode voucher tidak ditemukan' END,
      'code', 'VOUCHER_INVALID'
    );
  END IF;

  IF NOT v_voucher.is_active THEN
    RETURN jsonb_build_object(
      'success', true, 'valid', false,
      'message', CASE WHEN v_country = 'MY' THEN 'Voucher is not active' ELSE 'Voucher tidak aktif' END,
      'code', 'VOUCHER_INVALID'
    );
  END IF;

  IF v_voucher.starts_at IS NOT NULL AND v_voucher.starts_at > now() THEN
    RETURN jsonb_build_object(
      'success', true, 'valid', false,
      'message', CASE WHEN v_country = 'MY' THEN 'Voucher is not valid yet' ELSE 'Voucher belum berlaku' END,
      'code', 'VOUCHER_INVALID'
    );
  END IF;

  IF v_voucher.expires_at IS NOT NULL AND v_voucher.expires_at < now() THEN
    RETURN jsonb_build_object(
      'success', true, 'valid', false,
      'message', CASE WHEN v_country = 'MY' THEN 'Voucher has expired' ELSE 'Voucher sudah kadaluarsa' END,
      'code', 'VOUCHER_EXPIRED'
    );
  END IF;

  IF v_voucher.applicable_countries IS NOT NULL AND NOT (v_country = ANY(v_voucher.applicable_countries)) THEN
    RETURN jsonb_build_object(
      'success', true, 'valid', false,
      'message', CASE WHEN v_country = 'MY'
        THEN 'This voucher is not applicable for orders shipped to Malaysia'
        ELSE 'Voucher ini tidak berlaku untuk negara tujuan pengiriman Anda' END,
      'code', 'VOUCHER_COUNTRY_MISMATCH'
    );
  END IF;

  IF v_voucher.usage_limit IS NOT NULL AND v_voucher.used_count >= v_voucher.usage_limit THEN
    RETURN jsonb_build_object(
      'success', true, 'valid', false,
      'message', CASE WHEN v_country = 'MY' THEN 'Voucher usage limit reached' ELSE 'Kuota voucher sudah habis' END,
      'code', 'VOUCHER_QUOTA_EXCEEDED'
    );
  END IF;

  IF p_user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_user_usage_count
    FROM public.voucher_usages
    WHERE voucher_id = v_voucher.id
      AND user_id = p_user_id;

    IF v_user_usage_count >= v_voucher.usage_per_user THEN
      RETURN jsonb_build_object(
        'success', true, 'valid', false,
        'message', CASE WHEN v_country = 'MY' THEN 'You have already used this voucher' ELSE 'Anda sudah menggunakan voucher ini' END,
        'code', 'VOUCHER_USER_LIMIT'
      );
    END IF;
  END IF;

  -- Resolve effective thresholds & values in the caller's currency (MY -> RM, ID -> IDR)
  IF v_country = 'MY' THEN
    IF COALESCE(v_voucher.currency, 'IDR') = 'MYR' THEN
      v_eff_min_purchase := COALESCE(v_voucher.min_purchase, 0);
      v_eff_value := COALESCE(v_voucher.value, 0);
      v_eff_max_discount := v_voucher.max_discount;
    ELSE
      -- Cross-market voucher configured in IDR (e.g. ['ID', 'MY'] percentage voucher)
      SELECT COALESCE(NULLIF(value, '')::NUMERIC, 3600) INTO v_myr_rate
      FROM public.site_settings WHERE key = 'myr_exchange_rate' LIMIT 1;
      IF v_myr_rate IS NULL OR v_myr_rate <= 0 THEN v_myr_rate := 3600; END IF;

      v_eff_min_purchase := ROUND(COALESCE(v_voucher.min_purchase, 0) / v_myr_rate, 2);
      v_eff_value := CASE WHEN v_voucher.discount_type = 'fixed' THEN ROUND(COALESCE(v_voucher.value, 0) / v_myr_rate, 2) ELSE COALESCE(v_voucher.value, 0) END;
      v_eff_max_discount := CASE WHEN v_voucher.max_discount IS NOT NULL AND v_voucher.max_discount > 0 THEN ROUND(v_voucher.max_discount / v_myr_rate, 2) ELSE NULL END;
    END IF;
  ELSE
    v_eff_min_purchase := COALESCE(v_voucher.min_purchase, 0);
    v_eff_value := COALESCE(v_voucher.value, 0);
    v_eff_max_discount := v_voucher.max_discount;
  END IF;

  -- Minimum purchase check
  IF v_eff_min_purchase > 0 AND p_subtotal < v_eff_min_purchase THEN
    IF v_country = 'MY' THEN
      v_min_spend_msg := format('Minimum spend RM %s for this voucher', to_char(v_eff_min_purchase, 'FM999,990.00'));
    ELSE
      v_min_spend_msg := format('Minimum belanja Rp %s untuk voucher ini', to_char(v_eff_min_purchase, 'FM999,999,999'));
    END IF;

    RETURN jsonb_build_object(
      'success', true, 'valid', false,
      'message', v_min_spend_msg,
      'code', 'VOUCHER_MIN_PURCHASE'
    );
  END IF;

  -- Calculate discount
  IF v_voucher.discount_type = 'fixed' THEN
    v_discount_amount := LEAST(v_eff_value, p_subtotal);
  ELSIF v_voucher.discount_type = 'percentage' THEN
    v_discount_amount := p_subtotal * (v_eff_value / 100.0);
    IF v_eff_max_discount IS NOT NULL AND v_eff_max_discount > 0 THEN
      v_discount_amount := LEAST(v_discount_amount, v_eff_max_discount);
    END IF;
  ELSE
    v_discount_amount := 0;
  END IF;

  IF v_country = 'MY' THEN
    v_discount_amount := ROUND(v_discount_amount, 2);
  ELSE
    v_discount_amount := ROUND(v_discount_amount);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'valid', true,
    'voucher_id', v_voucher.id,
    'code', v_voucher.code,
    'currency', CASE WHEN v_country = 'MY' THEN 'MYR' ELSE 'IDR' END,
    'discount_type', v_voucher.discount_type,
    'discount_amount', v_discount_amount,
    'final_total', GREATEST(p_subtotal - v_discount_amount, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 7. orders & stock_mutations: Native RM columns & market stock tracking
-- ------------------------------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS subtotal_myr NUMERIC(12,2) NULL,
  ADD COLUMN IF NOT EXISTS shipping_cost_myr NUMERIC(12,2) NULL,
  ADD COLUMN IF NOT EXISTS discount_amount_myr NUMERIC(12,2) NULL,
  ADD COLUMN IF NOT EXISTS payment_fee_myr NUMERIC(12,2) NULL;

ALTER TABLE public.stock_mutations
  ADD COLUMN IF NOT EXISTS market VARCHAR(2) NOT NULL DEFAULT 'ID';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_mutations_market_check') THEN
    ALTER TABLE public.stock_mutations
      ADD CONSTRAINT stock_mutations_market_check CHECK (market IN ('ID', 'MY'));
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 8. site_settings: Remove markup & rounding, clarify DOKU settlement rate label
-- ------------------------------------------------------------------------------
DELETE FROM public.site_settings
WHERE key IN ('my_price_markup_percent', 'my_price_rounding');

UPDATE public.site_settings
SET label = 'Kurs Settlement DOKU QRIS (1 RM ke Rupiah)'
WHERE key = 'myr_exchange_rate';

-- ------------------------------------------------------------------------------
-- 9. Update create_order RPC (Manual MYR Pricing, Isolated stock_my, ORD-MY- prefix)
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.create_order(UUID, UUID, TEXT, TEXT, BIGINT, TEXT, BIGINT, TEXT);
DROP FUNCTION IF EXISTS public.create_order(UUID, UUID, TEXT, TEXT, BIGINT, TEXT, BIGINT, TEXT, NUMERIC, NUMERIC);

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
) RETURNS JSONB AS $$
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

        -- Fetch DOKU QRIS settlement conversion rate (1 RM -> IDR)
        SELECT COALESCE(NULLIF(value, '')::NUMERIC, 3600) INTO v_myr_rate
        FROM public.site_settings WHERE key = 'myr_exchange_rate' LIMIT 1;
        IF v_myr_rate IS NULL OR v_myr_rate <= 0 THEN v_myr_rate := 3600; END IF;
    END IF;

    -- 5. Lock variants, verify stock & calculate subtotal (ID -> stock & price; MY -> stock_my & price_myr)
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
        FOR UPDATE OF pv
    LOOP
        IF NOT v_cart_item.product_active OR NOT v_cart_item.variant_active THEN
            RETURN jsonb_build_object(
              'success', false,
              'message', 'Produk "' || v_cart_item.product_name || '" saat ini tidak aktif.',
              'code', 'PRODUCT_INACTIVE'
            );
        END IF;

        IF v_address_country = 'MY' THEN
            -- Must have manual MYR price
            IF v_cart_item.regular_price_myr IS NULL OR v_cart_item.regular_price_myr <= 0 THEN
                RETURN jsonb_build_object(
                  'success', false,
                  'message', 'Product "' || v_cart_item.product_name || ' (' || v_cart_item.variant_name || ')" is not available for Malaysia shipping.',
                  'code', 'PRODUCT_UNAVAILABLE_MY'
                );
            END IF;

            -- Check isolated MY stock
            IF v_cart_item.stock_my < v_cart_item.quantity THEN
                RETURN jsonb_build_object(
                  'success', false,
                  'message', 'Insufficient Malaysia stock for ' || v_cart_item.product_name || ' (' || v_cart_item.variant_name || ') (remaining: ' || v_cart_item.stock_my || ').',
                  'code', 'STOCK_INSUFFICIENT'
                );
            END IF;

            v_actual_price_myr := v_cart_item.regular_price_myr;
            v_flash_sale_item_id := NULL;

            SELECT fsi.id, fsi.sale_price_myr INTO v_flash_sale_item_id, v_actual_price_myr
            FROM public.flash_sale_items fsi
            JOIN public.flash_sales fs ON fs.id = fsi.flash_sale_id
            WHERE fsi.variant_id = v_cart_item.variant_id
              AND fs.is_active = true
              AND fs.starts_at <= now()
              AND fs.ends_at > now()
              AND (fsi.quota = 0 OR fsi.sold_count < fsi.quota)
              AND (fs.target_market = 'ALL' OR fs.target_market = 'MY')
              AND fsi.sale_price_myr IS NOT NULL AND fsi.sale_price_myr > 0
            LIMIT 1;

            IF v_actual_price_myr IS NULL OR v_actual_price_myr <= 0 THEN
                v_actual_price_myr := v_cart_item.regular_price_myr;
            END IF;

            v_subtotal_myr := v_subtotal_myr + ROUND(v_actual_price_myr * v_cart_item.quantity, 2);
            v_actual_price := ROUND(v_actual_price_myr * v_myr_rate)::BIGINT;
            v_subtotal := v_subtotal + (v_actual_price * v_cart_item.quantity);
        ELSE
            IF v_cart_item.stock < v_cart_item.quantity THEN
                RETURN jsonb_build_object(
                  'success', false,
                  'message', 'Stok produk ' || v_cart_item.product_name || ' (' || v_cart_item.variant_name || ') tidak mencukupi (sisa: ' || v_cart_item.stock || ').',
                  'code', 'STOCK_INSUFFICIENT'
                );
            END IF;

            v_actual_price := v_cart_item.regular_price;
            v_flash_sale_item_id := NULL;

            SELECT fsi.id, fsi.sale_price INTO v_flash_sale_item_id, v_actual_price
            FROM public.flash_sale_items fsi
            JOIN public.flash_sales fs ON fs.id = fsi.flash_sale_id
            WHERE fsi.variant_id = v_cart_item.variant_id
              AND fs.is_active = true
              AND fs.starts_at <= now()
              AND fs.ends_at > now()
              AND (fsi.quota = 0 OR fsi.sold_count < fsi.quota)
              AND (fs.target_market = 'ALL' OR fs.target_market = 'ID')
            LIMIT 1;

            IF v_actual_price IS NULL THEN
                v_actual_price := v_cart_item.regular_price;
            END IF;

            v_subtotal := v_subtotal + (v_actual_price * v_cart_item.quantity);
        END IF;
    END LOOP;

    -- 6. Validate voucher if provided (MY validates in RM; ID validates in IDR)
    IF p_voucher_code IS NOT NULL AND TRIM(p_voucher_code) <> '' THEN
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

    -- 7. Final totals (pure RM for MY, IDR for ID)
    IF v_address_country = 'MY' THEN
        v_shipping_cost_myr := COALESCE(p_shipping_cost_myr, ROUND(v_shipping_cost::NUMERIC / v_myr_rate, 2));
        v_payment_fee_myr := COALESCE(p_payment_fee_myr, ROUND(v_payment_fee::NUMERIC / v_myr_rate, 2));
        v_total_myr := GREATEST(0, ROUND(v_subtotal_myr + v_shipping_cost_myr + v_payment_fee_myr - v_discount_amount_myr, 2));

        -- Convert to IDR for DOKU QRIS settlement
        v_shipping_cost := ROUND(v_shipping_cost_myr * v_myr_rate)::BIGINT;
        v_payment_fee := ROUND(v_payment_fee_myr * v_myr_rate)::BIGINT;
        v_total_amount := ROUND(v_total_myr * v_myr_rate)::BIGINT;

        -- Validate QRIS cross-border transaction limit (max Rp 10.000.000)
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

    -- 8. Generate order number (ORD-MY-YYYYMMDD-XXXXX for MY, ORD-YYYYMMDD-XXXXX for ID)
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

    -- 10. Insert order items, deduct market-specific stock, log mutation & update flash sale quota
    FOR v_cart_item IN
        SELECT
            ci.variant_id,
            ci.quantity,
            pv.price AS regular_price,
            pv.price_myr AS regular_price_myr,
            pv.name AS variant_name,
            p.name AS product_name,
            pv.sku,
            pv.stock,
            pv.stock_my
        FROM public.cart_items ci
        JOIN public.product_variants pv ON ci.variant_id = pv.id
        JOIN public.products p ON pv.product_id = p.id
        WHERE ci.cart_id = v_cart_id
    LOOP
        v_flash_sale_item_id := NULL;
        v_actual_price_myr := NULL;

        IF v_address_country = 'MY' THEN
            v_actual_price_myr := v_cart_item.regular_price_myr;
            SELECT fsi.id, fsi.sale_price_myr INTO v_flash_sale_item_id, v_actual_price_myr
            FROM public.flash_sale_items fsi
            JOIN public.flash_sales fs ON fs.id = fsi.flash_sale_id
            WHERE fsi.variant_id = v_cart_item.variant_id
              AND fs.is_active = true
              AND fs.starts_at <= now()
              AND fs.ends_at > now()
              AND (fsi.quota = 0 OR fsi.sold_count < fsi.quota)
              AND (fs.target_market = 'ALL' OR fs.target_market = 'MY')
              AND fsi.sale_price_myr IS NOT NULL AND fsi.sale_price_myr > 0
            LIMIT 1;

            IF v_actual_price_myr IS NULL OR v_actual_price_myr <= 0 THEN
                v_actual_price_myr := v_cart_item.regular_price_myr;
            END IF;

            v_actual_price := ROUND(v_actual_price_myr * v_myr_rate)::BIGINT;
            v_available_stock := v_cart_item.stock_my;
        ELSE
            v_actual_price := v_cart_item.regular_price;
            SELECT fsi.id, fsi.sale_price INTO v_flash_sale_item_id, v_actual_price
            FROM public.flash_sale_items fsi
            JOIN public.flash_sales fs ON fs.id = fsi.flash_sale_id
            WHERE fsi.variant_id = v_cart_item.variant_id
              AND fs.is_active = true
              AND fs.starts_at <= now()
              AND fs.ends_at > now()
              AND (fsi.quota = 0 OR fsi.sold_count < fsi.quota)
              AND (fs.target_market = 'ALL' OR fs.target_market = 'ID')
            LIMIT 1;

            IF v_actual_price IS NULL THEN
                v_actual_price := v_cart_item.regular_price;
            END IF;

            v_available_stock := v_cart_item.stock;
        END IF;

        v_item_subtotal := v_actual_price * v_cart_item.quantity;

        INSERT INTO public.order_items (
            order_id, variant_id, flash_sale_item_id, product_name, variant_name, sku, price, quantity, subtotal, unit_price_myr
        ) VALUES (
            v_order_id,
            v_cart_item.variant_id,
            v_flash_sale_item_id,
            v_cart_item.product_name,
            v_cart_item.variant_name,
            v_cart_item.sku,
            v_actual_price,
            v_cart_item.quantity,
            v_item_subtotal,
            v_actual_price_myr
        ) RETURNING id INTO v_order_item_id;

        -- Deduct isolated market stock
        IF v_address_country = 'MY' THEN
            UPDATE public.product_variants
            SET stock_my = stock_my - v_cart_item.quantity
            WHERE id = v_cart_item.variant_id;
        ELSE
            UPDATE public.product_variants
            SET stock = stock - v_cart_item.quantity
            WHERE id = v_cart_item.variant_id;
        END IF;

        -- Record market-aware stock mutation
        INSERT INTO public.stock_mutations (variant_id, order_item_id, type, qty, qty_before, qty_after, note, market)
        VALUES (
          v_cart_item.variant_id,
          v_order_item_id,
          'out',
          v_cart_item.quantity,
          v_available_stock,
          v_available_stock - v_cart_item.quantity,
          'Order: ' || v_order_number,
          v_address_country
        );

        IF v_flash_sale_item_id IS NOT NULL THEN
            UPDATE public.flash_sale_items
            SET sold_count = sold_count + v_cart_item.quantity
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

    -- 13. Insert initial payment record (amount in IDR for DOKU settlement)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 10. Update cancel_order RPC (Restore market-specific stock: stock vs stock_my)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_order(
  p_order_id UUID,
  p_cancel_reason TEXT DEFAULT 'Dibatalkan oleh customer'
)
RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
  v_order_country VARCHAR(2);
  v_curr_stock INT;
BEGIN
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Pesanan tidak ditemukan', 'code', 'ORDER_NOT_FOUND');
  END IF;

  IF auth.uid() IS NOT NULL AND v_order.user_id != auth.uid() AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak', 'code', 'FORBIDDEN');
  END IF;

  IF v_order.status != 'pending_payment' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Pesanan hanya bisa dibatalkan saat status menunggu pembayaran',
      'code', 'ORDER_WRONG_STATUS'
    );
  END IF;

  v_order_country := UPPER(COALESCE(v_order.country_code, 'ID'));

  FOR v_item IN
    SELECT oi.*, pv.stock AS current_stock_id, pv.stock_my AS current_stock_my
    FROM public.order_items oi
    JOIN public.product_variants pv ON pv.id = oi.variant_id
    WHERE oi.order_id = p_order_id
    FOR UPDATE OF pv
  LOOP
    IF v_order_country = 'MY' THEN
      v_curr_stock := v_item.current_stock_my;
      UPDATE public.product_variants
      SET stock_my = stock_my + v_item.quantity
      WHERE id = v_item.variant_id;
    ELSE
      v_curr_stock := v_item.current_stock_id;
      UPDATE public.product_variants
      SET stock = stock + v_item.quantity
      WHERE id = v_item.variant_id;
    END IF;

    INSERT INTO public.stock_mutations (variant_id, order_item_id, type, qty, qty_before, qty_after, note, market)
    VALUES (
      v_item.variant_id,
      v_item.id,
      'released',
      v_item.quantity,
      v_curr_stock,
      v_curr_stock + v_item.quantity,
      'Order cancelled: ' || v_order.order_number,
      v_order_country
    );

    IF v_item.flash_sale_item_id IS NOT NULL THEN
      UPDATE public.flash_sale_items
      SET sold_count = GREATEST(sold_count - v_item.quantity, 0)
      WHERE id = v_item.flash_sale_item_id;
    END IF;
  END LOOP;

  UPDATE public.orders
  SET status = 'cancelled',
      cancel_reason = p_cancel_reason,
      cancelled_at = now(),
      updated_at = now()
  WHERE id = p_order_id;

  UPDATE public.payments
  SET status = 'expired',
      updated_at = now()
  WHERE order_id = p_order_id AND status = 'pending';

  IF v_order.voucher_id IS NOT NULL THEN
    DELETE FROM public.voucher_usages WHERE order_id = p_order_id;
    UPDATE public.vouchers SET used_count = GREATEST(used_count - 1, 0) WHERE id = v_order.voucher_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'order_id', p_order_id,
      'order_number', v_order.order_number,
      'status', 'cancelled'
    )
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', 'Terjadi kesalahan saat membatalkan pesanan: ' || SQLERRM,
    'code', 'CANCEL_ERROR'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
