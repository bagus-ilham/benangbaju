-- Migration: Create invoices storage bucket and set policies
-- This ensures that the invoices storage bucket exists for generate-invoice edge function and can be accessed publicly.

INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public read access to the invoices bucket
DROP POLICY IF EXISTS "Allow public read access to invoices" ON storage.objects;
CREATE POLICY "Allow public read access to invoices" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'invoices');
