-- ==============================================================================
-- 23_malaysia_step2_localization.sql
-- Benangbaju E-Commerce: Malaysia Market Step 2 Localization & Bilingual Content
--
-- Features implemented:
-- 1. Products bilingual columns: short_description_en, description_en, care_guide_en
-- 2. Updated admin_create_product and admin_update_product RPCs to persist bilingual product fields
-- 3. Banners target market and bilingual text: target_market, title_en, subtitle_en
-- 4. Site setting for Shopee Malaysia store URL: shopee_my_url
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Products Bilingual Columns
-- ------------------------------------------------------------------------------
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS short_description_en TEXT NULL,
    ADD COLUMN IF NOT EXISTS description_en TEXT NULL,
    ADD COLUMN IF NOT EXISTS care_guide_en TEXT NULL;

-- ------------------------------------------------------------------------------
-- 2. Banners Target Market & Bilingual Columns
-- ------------------------------------------------------------------------------
ALTER TABLE public.banners
    ADD COLUMN IF NOT EXISTS target_market VARCHAR(10) NOT NULL DEFAULT 'ALL',
    ADD COLUMN IF NOT EXISTS title_en TEXT NULL,
    ADD COLUMN IF NOT EXISTS subtitle_en TEXT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'banners_target_market_check'
    ) THEN
        ALTER TABLE public.banners
            ADD CONSTRAINT banners_target_market_check
            CHECK (target_market IN ('ALL', 'ID', 'MY'));
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 3. Seed site_settings for Shopee Malaysia URL
-- ------------------------------------------------------------------------------
INSERT INTO public.site_settings (key, value, type, "group", label)
VALUES
    ('shopee_my_url', '', 'text', 'social', 'URL Toko Shopee Malaysia')
ON CONFLICT (key) DO UPDATE
SET label = EXCLUDED.label,
    "group" = EXCLUDED."group",
    type = EXCLUDED.type;

-- ------------------------------------------------------------------------------
-- 4. Update admin_create_product RPC
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
  -- 1. Insert product
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

  -- 2. Insert variants and attributes
  IF jsonb_array_length(p_variants) > 0 THEN
    FOR v_variant_idx IN 0 .. jsonb_array_length(p_variants) - 1 LOOP
      v_variant := p_variants->v_variant_idx;
      
      INSERT INTO public.product_variants (
        product_id, sku, name, price, compare_price, stock, weight_gram, is_active
      ) VALUES (
        v_product_id,
        v_variant->>'sku',
        v_variant->>'name',
        (v_variant->>'price')::bigint,
        (v_variant->>'compare_price')::bigint,
        (v_variant->>'stock')::int,
        (v_variant->>'weight_gram')::numeric,
        COALESCE((v_variant->>'is_active')::boolean, true)
      ) RETURNING id INTO v_variant_id;
      
      v_variant_ids := array_append(v_variant_ids, v_variant_id);

      IF v_variant ? 'attrs' AND jsonb_array_length(v_variant->'attrs') > 0 THEN
        FOR v_attr IN SELECT * FROM jsonb_array_elements(v_variant->'attrs') LOOP
          INSERT INTO public.product_variant_attrs (
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
      INSERT INTO public.product_images (
        product_id, variant_id, url, alt_text, is_primary, sort_order
      ) VALUES (
        v_product_id,
        CASE 
          WHEN v_image->>'variant_idx' IS NOT NULL THEN v_variant_ids[(v_image->>'variant_idx')::int + 1]
          ELSE NULL
        END,
        v_image->>'url',
        v_image->>'alt_text',
        COALESCE((v_image->>'is_primary')::boolean, false),
        COALESCE((v_image->>'sort_order')::int, 0)
      );
    END LOOP;
  END IF;

  -- 4. Insert marketplace links
  IF jsonb_array_length(p_links) > 0 THEN
    FOR v_link IN SELECT * FROM jsonb_array_elements(p_links) LOOP
      INSERT INTO public.product_marketplace_links (
        product_id, platform, url, label, sort_order
      ) VALUES (
        v_product_id,
        v_link->>'platform',
        v_link->>'url',
        v_link->>'label',
        COALESCE((v_link->>'sort_order')::int, 0)
      );
    END LOOP;
  END IF;

  -- 5. Insert collections
  IF array_length(p_collections, 1) > 0 THEN
    FOREACH v_collection_id IN ARRAY p_collections LOOP
      INSERT INTO public.collection_products (
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

-- ------------------------------------------------------------------------------
-- 5. Update admin_update_product RPC
-- ------------------------------------------------------------------------------
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
  -- 1. Update product (support clearing nullable fields by checking key existence)
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

  -- 2. Delete components
  IF array_length(p_variant_ids_to_delete, 1) > 0 THEN
    DELETE FROM public.product_variants WHERE id = ANY(p_variant_ids_to_delete);
  END IF;
  
  IF array_length(p_image_ids_to_delete, 1) > 0 THEN
    DELETE FROM public.product_images WHERE id = ANY(p_image_ids_to_delete);
  END IF;
  
  IF array_length(p_link_ids_to_delete, 1) > 0 THEN
    DELETE FROM public.product_marketplace_links WHERE id = ANY(p_link_ids_to_delete);
  END IF;

  -- 3. Upsert variants and attributes
  IF jsonb_array_length(p_variants_to_upsert) > 0 THEN
    FOR v_variant IN SELECT * FROM jsonb_array_elements(p_variants_to_upsert) LOOP
      IF v_variant->>'id' IS NOT NULL THEN
        UPDATE public.product_variants SET
          sku = COALESCE(v_variant->>'sku', sku),
          name = COALESCE(v_variant->>'name', name),
          price = COALESCE((v_variant->>'price')::bigint, price),
          compare_price = (v_variant->>'compare_price')::bigint,
          stock = COALESCE((v_variant->>'stock')::int, stock),
          weight_gram = COALESCE((v_variant->>'weight_gram')::numeric, weight_gram),
          is_active = COALESCE((v_variant->>'is_active')::boolean, is_active)
        WHERE id = (v_variant->>'id')::uuid;
        v_variant_id := (v_variant->>'id')::uuid;
        
        DELETE FROM public.product_variant_attrs WHERE variant_id = v_variant_id;
      ELSE
        INSERT INTO public.product_variants (
          product_id, sku, name, price, compare_price, stock, weight_gram, is_active
        ) VALUES (
          p_product_id,
          v_variant->>'sku',
          v_variant->>'name',
          (v_variant->>'price')::bigint,
          (v_variant->>'compare_price')::bigint,
          (v_variant->>'stock')::int,
          (v_variant->>'weight_gram')::numeric,
          COALESCE((v_variant->>'is_active')::boolean, true)
        ) RETURNING id INTO v_variant_id;
      END IF;

      IF v_variant ? 'attrs' AND jsonb_array_length(v_variant->'attrs') > 0 THEN
        FOR v_attr IN SELECT * FROM jsonb_array_elements(v_variant->'attrs') LOOP
          INSERT INTO public.product_variant_attrs (
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
        UPDATE public.product_images SET
          variant_id = (v_image->>'variant_id')::uuid,
          url = COALESCE(v_image->>'url', url),
          alt_text = v_image->>'alt_text',
          is_primary = COALESCE((v_image->>'is_primary')::boolean, is_primary),
          sort_order = COALESCE((v_image->>'sort_order')::int, sort_order)
        WHERE id = (v_image->>'id')::uuid;
      ELSE
        INSERT INTO public.product_images (
          product_id, variant_id, url, alt_text, is_primary, sort_order
        ) VALUES (
          p_product_id,
          (v_image->>'variant_id')::uuid,
          v_image->>'url',
          v_image->>'alt_text',
          COALESCE((v_image->>'is_primary')::boolean, false),
          COALESCE((v_image->>'sort_order')::int, 0)
        );
      END IF;
    END LOOP;
  END IF;

  -- 5. Upsert marketplace links
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
        INSERT INTO public.product_marketplace_links (
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

  -- 6. Replace collection associations
  DELETE FROM public.collection_products WHERE product_id = p_product_id;
  IF array_length(p_collections, 1) > 0 THEN
    FOREACH v_collection_id IN ARRAY p_collections LOOP
      INSERT INTO public.collection_products (
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

COMMIT;

-- ==============================================================================
-- ROLLBACK SCRIPT (Run only to rollback this migration)
-- ==============================================================================
-- NOTE: Before dropping the bilingual columns on public.products, re-run Section 1
--       of 21_malaysia_shipping_step1_fixes.sql to restore admin_create_product
--       and admin_update_product without the *_en column references.
-- BEGIN;
-- ALTER TABLE public.products
--     DROP COLUMN IF EXISTS short_description_en,
--     DROP COLUMN IF EXISTS description_en,
--     DROP COLUMN IF EXISTS care_guide_en;
--
-- ALTER TABLE public.banners
--     DROP CONSTRAINT IF EXISTS banners_target_market_check,
--     DROP COLUMN IF EXISTS target_market,
--     DROP COLUMN IF EXISTS title_en,
--     DROP COLUMN IF EXISTS subtitle_en;
--
-- DELETE FROM public.site_settings WHERE key = 'shopee_my_url';
-- COMMIT;

