CREATE TABLE IF NOT EXISTS public.checkout_locks (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (user_id)
);

ALTER TABLE public.checkout_locks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own lock" ON public.checkout_locks;
CREATE POLICY "Users can insert their own lock" ON public.checkout_locks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own lock" ON public.checkout_locks;
CREATE POLICY "Users can view their own lock" ON public.checkout_locks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own lock" ON public.checkout_locks;
CREATE POLICY "Users can delete their own lock" ON public.checkout_locks
  FOR DELETE USING (auth.uid() = user_id);
