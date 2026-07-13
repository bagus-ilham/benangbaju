-- Protect return_requests bank data
ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all return requests" ON public.return_requests;
CREATE POLICY "Admins can view all return requests" ON public.return_requests
  FOR SELECT
  USING (
    public.is_admin()
  );

DROP POLICY IF EXISTS "Users can view their own return requests" ON public.return_requests;
CREATE POLICY "Users can view their own return requests" ON public.return_requests
  FOR SELECT
  USING (
    user_id = auth.uid()
  );
