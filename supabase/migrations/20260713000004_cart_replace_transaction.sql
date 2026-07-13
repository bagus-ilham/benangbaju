-- Atomic Replace Cart Items RPC
CREATE OR REPLACE FUNCTION public.replace_cart_items(p_cart_id uuid, p_items jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item jsonb;
BEGIN
  -- Delete existing items
  DELETE FROM public.cart_items WHERE cart_id = p_cart_id;

  -- Insert new items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.cart_items (cart_id, variant_id, quantity)
    VALUES (
      p_cart_id, 
      (v_item->>'variant_id')::uuid, 
      (v_item->>'quantity')::integer
    );
  END LOOP;
END;
$$;
