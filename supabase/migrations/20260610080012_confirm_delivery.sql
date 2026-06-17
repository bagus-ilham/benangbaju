-- -------------------------------------------------------
-- RPC: confirm_delivery
-- Transition order from shipped to completed by customer
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.confirm_delivery(
  p_order_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
BEGIN
  -- Get order with lock
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Pesanan tidak ditemukan', 'code', 'ORDER_NOT_FOUND');
  END IF;

  -- Check ownership
  IF v_order.user_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'message', 'Akses ditolak', 'code', 'FORBIDDEN');
  END IF;

  -- Check status
  IF v_order.status != 'shipped' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Pesanan hanya dapat diselesaikan setelah dikirim',
      'code', 'ORDER_WRONG_STATUS'
    );
  END IF;

  -- Update order status to completed
  UPDATE orders
  SET status = 'completed',
      updated_at = now()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'order_id', p_order_id,
      'status', 'completed'
    )
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', 'Terjadi kesalahan saat mengonfirmasi penerimaan barang',
    'code', 'CONFIRM_ERROR'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.confirm_delivery IS 'Transition order status from shipped to completed securely';
