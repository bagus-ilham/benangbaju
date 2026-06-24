/*
🛡️ SENTINEL FIX
Vulnerability: Invoices storage bucket is public, exposing sensitive user data (PII, order details, addresses).
Severity: High
Fix: Set bucket to private and scoped read access to the order owner and admins.
Impact: Prevents unauthorized public access and cross-user data leakage.
*/

-- 1. Make the bucket private
UPDATE storage.buckets
SET public = false
WHERE id = 'invoices';

-- 2. Drop the overly permissive public read policy
DROP POLICY IF EXISTS "Allow public read access to invoices" ON storage.objects;

-- 3. Create a restrictive policy for the order owner
CREATE POLICY "Allow owner to read invoice" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'invoices' AND 
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE user_id = auth.uid() 
        AND storage.objects.name LIKE '%' || order_number || '.html'
    )
  );

-- 4. Create a policy to allow admins to read invoices
CREATE POLICY "Allow admin to read invoice" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'invoices' AND 
    public.is_admin()
  );
