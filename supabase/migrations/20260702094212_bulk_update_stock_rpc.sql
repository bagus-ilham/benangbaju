-- Create an RPC to bulk update stock levels via an array of JSON objects
-- JSON format expected: '[{"sku": "SKU-1", "stock": 10}, {"sku": "SKU-2", "stock": 5}]'

CREATE OR REPLACE FUNCTION bulk_update_stock(updates jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Bulk update using a single SQL query joined against a JSONB recordset
  UPDATE public.product_variants
  SET stock = u.stock,
      updated_at = NOW()
  FROM jsonb_to_recordset(updates) AS u(sku text, stock int)
  WHERE public.product_variants.sku = u.sku;
END;
$$;
