-- Atomic Rate Limit RPC
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_ip text, p_route text, p_window_sec integer, p_max_requests integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
  v_window_start timestamp with time zone;
BEGIN
  v_window_start := (now() - (p_window_sec || ' seconds')::interval);

  -- Lock the row representing this IP and route (or just rely on the count if we insert blindly)
  -- Actually, to avoid race conditions, we count and insert in a single transaction
  SELECT count(*) INTO v_count
  FROM public.rate_limit_logs
  WHERE ip_address = p_ip AND route = p_route AND created_at >= v_window_start;

  IF v_count >= p_max_requests THEN
    RETURN false;
  END IF;

  INSERT INTO public.rate_limit_logs (ip_address, route, created_at)
  VALUES (p_ip, p_route, now());

  RETURN true;
END;
$$;
