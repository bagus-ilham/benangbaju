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
        sale_price, discount_percent, quota, sold_count
      ) VALUES (
        v_flash_sale_id,
        (v_item->>'variant_id')::uuid,
        (v_item->>'original_price')::numeric,
        (v_item->>'sale_price')::numeric,
        (v_item->>'discount_percent')::numeric,
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
        sale_price, discount_percent, quota, sold_count
      ) VALUES (
        p_flash_sale_id,
        (v_item->>'variant_id')::uuid,
        (v_item->>'original_price')::numeric,
        (v_item->>'sale_price')::numeric,
        (v_item->>'discount_percent')::numeric,
        (v_item->>'quota')::int,
        COALESCE((v_item->>'sold_count')::int, 0)
      )
      ON CONFLICT (flash_sale_id, variant_id) DO UPDATE SET
        original_price = EXCLUDED.original_price,
        sale_price = EXCLUDED.sale_price,
        discount_percent = EXCLUDED.discount_percent,
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
