-- Migration: Add 'completed' status to orders check constraint
-- This fixes the constraint violation during confirm_delivery which transitions status from 'shipped' to 'completed'.

-- Drop the old constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Re-create the constraint with 'completed' added to the permitted list
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (
  status IN ('pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded')
);
