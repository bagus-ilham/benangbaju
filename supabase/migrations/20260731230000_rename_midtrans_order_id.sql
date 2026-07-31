-- Migration to rename midtrans_order_id to gateway_order_id for DOKU migration
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'midtrans_order_id'
    ) THEN
        ALTER TABLE public.orders RENAME COLUMN midtrans_order_id TO gateway_order_id;
    END IF;
END $$;
