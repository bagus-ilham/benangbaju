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
