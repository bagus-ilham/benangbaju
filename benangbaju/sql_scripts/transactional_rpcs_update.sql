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
