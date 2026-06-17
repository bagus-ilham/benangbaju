-- =============================================================
-- Migration: 20260610080009_create_extras.sql
-- Tambahan: stock_notifications, search_logs, rate_limit_logs
-- =============================================================

-- -------------------------------------------------------
-- Table: stock_notifications (Back-in-Stock)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  is_notified BOOLEAN NOT NULL DEFAULT false,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, variant_id)
);

COMMENT ON TABLE stock_notifications IS 'User subscriptions for back-in-stock notifications';

CREATE INDEX IF NOT EXISTS idx_stock_notifications_variant_id ON stock_notifications(variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_notifications_user_id ON stock_notifications(user_id);

-- -------------------------------------------------------
-- Trigger: notify_back_in_stock
-- When stock goes from 0 to >0, notify subscribed users
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_back_in_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when stock changes from 0 to > 0
  IF OLD.stock = 0 AND NEW.stock > 0 THEN
    -- Create in-app notifications for subscribed users
    INSERT INTO notifications (user_id, type, title, message, data)
    SELECT
      sn.user_id,
      'back_in_stock',
      'Produk Tersedia Kembali!',
      p.name || ' - ' || NEW.name || ' sudah tersedia kembali. Segera pesan sebelum kehabisan!',
      jsonb_build_object(
        'variant_id', NEW.id,
        'product_id', NEW.product_id,
        'product_slug', p.slug,
        'variant_name', NEW.name
      )
    FROM stock_notifications sn
    JOIN products p ON p.id = NEW.product_id
    WHERE sn.variant_id = NEW.id AND sn.is_notified = FALSE;

    -- Mark notifications as sent
    UPDATE stock_notifications
    SET is_notified = TRUE, notified_at = now()
    WHERE variant_id = NEW.id AND is_notified = FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_back_in_stock ON product_variants;
CREATE TRIGGER trg_back_in_stock
  AFTER UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION public.notify_back_in_stock();

-- -------------------------------------------------------
-- Table: search_logs (optional, analytics)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS search_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query VARCHAR(255) NOT NULL,
  results_count INT NOT NULL DEFAULT 0,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE search_logs IS 'Search query analytics (optional)';

CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON search_logs(created_at DESC);

-- -------------------------------------------------------
-- Table: rate_limit_logs
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS rate_limit_logs (
  key VARCHAR(200) PRIMARY KEY,
  count INT NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE rate_limit_logs IS 'Lightweight rate limiting tracker';
