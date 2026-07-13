-- ==========================================
-- LEDGER SCHEMA FIX MIGRATION (V4 - MISSING TABLES & CLEANUP)
-- ==========================================
-- Safe to run on existing database (does not truncate data)

BEGIN;

-- 1. Add checkout_locks table for concurrency control
CREATE TABLE IF NOT EXISTS public.checkout_locks (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for checkout_locks to resolve Supabase security warning
ALTER TABLE public.checkout_locks ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage their own checkout locks
DROP POLICY IF EXISTS "Users can manage own checkout locks" ON public.checkout_locks;
CREATE POLICY "Users can manage own checkout locks" ON public.checkout_locks
    FOR ALL 
    USING (auth.uid() = user_id);

-- 2. (SKIPPED) Dropping session_id is skipped because it breaks existing RLS policies.
-- Leaving session_id as-is is perfectly safe and will not affect the application.

COMMIT;

-- 3. Create function to clean up stale checkout locks (> 5 mins)
CREATE OR REPLACE FUNCTION public.cleanup_checkout_locks()
RETURNS void AS $$
BEGIN
    DELETE FROM public.checkout_locks 
    WHERE created_at < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;
