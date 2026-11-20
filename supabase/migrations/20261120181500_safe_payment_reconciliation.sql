-- ==============================================================================
-- Safe Payment Reconciliation & Anti-Blind-Cancel Guard
--
-- Fixes incident where a paid QRIS order (DOKU transaction.status = SUCCESS)
-- was auto-cancelled by pg_cron after 90 minutes when the DOKU webhook did not
-- arrive.
--
-- New invariants:
--   1. SQL auto-cancel jobs (cancel_expired_pending_orders &
--      lazy_cancel_expired_orders) NEVER cancel orders that already have a DOKU
--      gateway session (payments.gateway_response IS NOT NULL) unless DOKU has
--      explicitly confirmed the payment failed/expired.
--   2. Every 5 minutes, pg_cron invokes the `reconcile-pending-orders` Edge
--      Function via pg_net (only when pending_payment orders exist), which
--      queries DOKU Check Status API first:
--        - DOKU SUCCESS  -> marks order `processing` + payment `success`
--        - DOKU EXPIRED/FAILED -> cancels order & restores stock
--        - DOKU PENDING/404 > 90m -> cancels order & restores stock
--        - DOKU unreachable/5xx -> skips (fail-safe; never cancels on error)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 1. Harden cancel_expired_pending_orders() so it NEVER blindly cancels DOKU-invoiced orders
CREATE OR REPLACE FUNCTION public.cancel_expired_pending_orders()
RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_cancelled_count INT := 0;
  v_res JSONB;
BEGIN
  FOR v_order IN
    SELECT o.id, o.order_number
    FROM public.orders o
    WHERE o.status = 'pending_payment'
      AND o.created_at < NOW() - INTERVAL '90 minutes'
      -- Only auto-cancel in pure SQL when NO DOKU checkout session was ever generated,
      -- OR DOKU already explicitly marked the payment as failed/expired.
      AND (
        NOT EXISTS (
          SELECT 1
          FROM public.payments p
          WHERE p.order_id = o.id
            AND p.gateway_response IS NOT NULL
        )
        OR EXISTS (
          SELECT 1
          FROM public.payments p
          WHERE p.order_id = o.id
            AND p.status IN ('expired', 'failed')
        )
      )
    FOR UPDATE OF o SKIP LOCKED
  LOOP
    v_res := public.cancel_order(
      v_order.id,
      'Otomatis dibatalkan - melewati batas waktu pembayaran (90 menit, tanpa pembayaran DOKU)'
    );
    IF (v_res->>'success')::BOOLEAN THEN
      v_cancelled_count := v_cancelled_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'cancelled_count', v_cancelled_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.cancel_expired_pending_orders IS
  'Safely auto-cancel pending_payment > 90m ONLY if no DOKU session exists or DOKU already confirmed failed/expired. Orders with active DOKU sessions are reconciled via reconcile-pending-orders Edge Function.';

-- 2. Harden lazy_cancel_expired_orders(p_user_id) with the exact same anti-blind-cancel guard
CREATE OR REPLACE FUNCTION public.lazy_cancel_expired_orders(
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_order RECORD;
  v_cancelled_count INT := 0;
  v_result JSONB;
BEGIN
  FOR v_order IN
    SELECT o.id, o.order_number
    FROM public.orders o
    WHERE o.user_id = p_user_id
      AND o.status = 'pending_payment'
      AND o.created_at < NOW() - INTERVAL '24 hours'
      AND (
        NOT EXISTS (
          SELECT 1
          FROM public.payments p
          WHERE p.order_id = o.id
            AND p.gateway_response IS NOT NULL
        )
        OR EXISTS (
          SELECT 1
          FROM public.payments p
          WHERE p.order_id = o.id
            AND p.status IN ('expired', 'failed')
        )
      )
    FOR UPDATE OF o SKIP LOCKED
  LOOP
    v_result := public.cancel_order(
      v_order.id,
      'Otomatis dibatalkan - pembayaran melewati batas waktu'
    );
    IF (v_result->>'success')::BOOLEAN THEN
      v_cancelled_count := v_cancelled_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'data', jsonb_build_object(
      'cancelled_count', v_cancelled_count
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.lazy_cancel_expired_orders IS
  'Safely auto-cancel orders pending > 24h ONLY when no DOKU payment session exists or DOKU confirmed expired/failed.';

-- 3. Trigger function called by pg_cron every 5 minutes to reconcile pending orders against DOKU
CREATE OR REPLACE FUNCTION public.trigger_reconcile_pending_orders()
RETURNS JSONB AS $$
DECLARE
  v_pending_count INT := 0;
  v_cron_secret TEXT;
  v_endpoint_url TEXT;
  v_request_id BIGINT;
BEGIN
  -- Short-circuit if there are no pending_payment orders older than 2 minutes
  SELECT COUNT(*) INTO v_pending_count
  FROM public.orders
  WHERE status = 'pending_payment'
    AND created_at < NOW() - INTERVAL '2 minutes';

  IF v_pending_count = 0 THEN
    RETURN jsonb_build_object('success', true, 'skipped', true, 'pending_count', 0);
  END IF;

  -- Fetch cron secret & endpoint from Supabase Vault (never hardcoded in migrations)
  SELECT decrypted_secret INTO v_cron_secret
  FROM vault.decrypted_secrets
  WHERE name = 'reconcile_cron_secret'
  LIMIT 1;

  SELECT decrypted_secret INTO v_endpoint_url
  FROM vault.decrypted_secrets
  WHERE name = 'reconcile_endpoint_url'
  LIMIT 1;

  IF v_cron_secret IS NULL OR length(trim(v_cron_secret)) = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Missing reconcile_cron_secret in vault.decrypted_secrets'
    );
  END IF;

  IF v_endpoint_url IS NULL OR length(trim(v_endpoint_url)) = 0 THEN
    v_endpoint_url := 'https://jwvbzuoatffoxaahdwdx.supabase.co/functions/v1/reconcile-pending-orders';
  END IF;

  SELECT net.http_post(
    url := v_endpoint_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', v_cron_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 15000
  ) INTO v_request_id;

  RETURN jsonb_build_object(
    'success', true,
    'pending_count', v_pending_count,
    'request_id', v_request_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, vault;

REVOKE ALL ON FUNCTION public.trigger_reconcile_pending_orders() FROM PUBLIC, anon, authenticated;

COMMENT ON FUNCTION public.trigger_reconcile_pending_orders IS
  'Invokes reconcile-pending-orders Edge Function via pg_net when pending_payment orders exist.';

-- 4. Schedule pg_cron job every 5 minutes for DOKU payment reconciliation
DO $$
BEGIN
  PERFORM cron.unschedule('reconcile-pending-orders');
EXCEPTION WHEN OTHERS THEN
  -- ignore if not already scheduled
END $$;

SELECT cron.schedule(
  'reconcile-pending-orders',
  '*/5 * * * *',
  $$SELECT public.trigger_reconcile_pending_orders()$$
);
