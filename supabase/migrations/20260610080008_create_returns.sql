-- =============================================================
-- Migration: 20260610080008_create_returns.sql
-- Domain 12: Return & Refund
-- =============================================================

-- -------------------------------------------------------
-- Table: return_requests
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS return_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected', 'completed')
  ),
  reason TEXT NOT NULL CHECK (
    reason IN ('wrong_item', 'damaged_item', 'missing_item', 'not_as_described', 'size_issue', 'other')
  ),
  customer_notes TEXT,
  admin_notes TEXT,
  refund_amount NUMERIC(15,2),
  refund_bank_name VARCHAR(100),
  refund_account_number VARCHAR(50),
  refund_account_name VARCHAR(100),
  refund_transferred_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE return_requests IS 'Customer return/refund requests (max 7 days after delivery)';

CREATE INDEX IF NOT EXISTS idx_return_requests_order_id ON return_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_user_id ON return_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_status ON return_requests(status);

DROP TRIGGER IF EXISTS trg_return_requests_updated_at ON return_requests;
CREATE TRIGGER trg_return_requests_updated_at
  BEFORE UPDATE ON return_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- -------------------------------------------------------
-- Table: return_items
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS return_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_request_id UUID NOT NULL REFERENCES return_requests(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE RESTRICT,
  quantity INT NOT NULL CHECK (quantity > 0),
  reason TEXT
);

COMMENT ON TABLE return_items IS 'Individual items being returned in a return request';

CREATE INDEX IF NOT EXISTS idx_return_items_return_request_id ON return_items(return_request_id);

-- -------------------------------------------------------
-- Table: return_media
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS return_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_request_id UUID NOT NULL REFERENCES return_requests(id) ON DELETE CASCADE,
  url VARCHAR(500) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

COMMENT ON TABLE return_media IS 'Photos of damaged/returned items as evidence';

CREATE INDEX IF NOT EXISTS idx_return_media_return_request_id ON return_media(return_request_id);
