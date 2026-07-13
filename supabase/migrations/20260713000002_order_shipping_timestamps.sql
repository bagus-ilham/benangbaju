-- Tambahkan created_at dan updated_at ke order_shipping

ALTER TABLE public.order_shipping
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now());

-- Buat trigger updated_at (bila belum ada fungsi umum, buat fungsi pemicu sederhana)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_order_shipping_updated_at ON public.order_shipping;
CREATE TRIGGER set_order_shipping_updated_at
  BEFORE UPDATE ON public.order_shipping
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
