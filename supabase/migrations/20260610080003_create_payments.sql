-- =============================================================
-- Migration: 20260610080003_create_payments.sql
-- Domain 7: Payment (Midtrans)
-- =============================================================

-- -------------------------------------------------------
-- Table: payments
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT UNIQUE,
  midtrans_transaction_id VARCHAR(100) UNIQUE,
  midtrans_order_id VARCHAR(100) UNIQUE,
  payment_type VARCHAR(50),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'success', 'failed', 'expired', 'refunded')
  ),
  amount NUMERIC(15,2) NOT NULL CHECK (amount >= 0),
  midtrans_response JSONB,
  paid_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  invoice_url VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE payments IS 'Payment records linked to Midtrans transactions';

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_midtrans_order_id ON payments(midtrans_order_id);

DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments;
CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- -------------------------------------------------------
-- Table: payment_logs
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  midtrans_order_id VARCHAR(100),
  event_type VARCHAR(50) NOT NULL,
  raw_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE payment_logs IS 'Audit log of all Midtrans webhook events for idempotency';
COMMENT ON COLUMN payment_logs.payment_id IS 'Can be null if the payment record is not yet created during webhook processing or if the linked payment was deleted';

CREATE INDEX IF NOT EXISTS idx_payment_logs_midtrans_order_id ON payment_logs(midtrans_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_event_type ON payment_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at DESC);
