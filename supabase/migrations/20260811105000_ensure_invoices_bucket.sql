-- Migration: Ensure invoices storage bucket exists and is publicly readable for getPublicUrl
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public read access for invoices
DROP POLICY IF EXISTS "Allow public read access to invoices" ON storage.objects;
CREATE POLICY "Allow public read access to invoices" ON storage.objects
  FOR SELECT USING (bucket_id = 'invoices');

-- Allow service role and authenticated users to upload/update invoices
DROP POLICY IF EXISTS "Allow upload access to invoices" ON storage.objects;
CREATE POLICY "Allow upload access to invoices" ON storage.objects
  FOR ALL USING (bucket_id = 'invoices');
