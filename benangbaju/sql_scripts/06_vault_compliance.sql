-- ==========================================
-- VAULT SCHEMA FIX MIGRATION (V5 - COMPLIANCE & PRIVACY)
-- ==========================================
-- Safe to run on existing database (does not truncate data)

BEGIN;

-- 1. Sync auth.users email to public.profiles
-- Ensures that if a user changes their email in Supabase Auth, it is reflected in profiles.
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

-- Create trigger on auth.users for updates
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_email();


-- 2. Data Retention Policy (Log Pruning)
-- Creates an RPC that can be called via pg_cron or an Edge Function to delete old logs.
CREATE OR REPLACE FUNCTION public.prune_audit_logs(days_old INT DEFAULT 90)
RETURNS void AS $$
BEGIN
  -- We don't know the exact names of the log tables since they weren't in the schema,
  -- but we'll try to delete from the ones mentioned in the codebase review safely.
  
  -- Use dynamic SQL to safely execute if tables exist
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'search_logs') THEN
    EXECUTE format('DELETE FROM public.search_logs WHERE created_at < NOW() - INTERVAL ''%s days''', days_old);
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_activity_logs') THEN
    EXECUTE format('DELETE FROM public.admin_activity_logs WHERE created_at < NOW() - INTERVAL ''%s days''', days_old);
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payment_logs') THEN
    EXECUTE format('DELETE FROM public.payment_logs WHERE created_at < NOW() - INTERVAL ''%s days''', days_old);
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'rate_limit_logs') THEN
    EXECUTE format('DELETE FROM public.rate_limit_logs WHERE created_at < NOW() - INTERVAL ''%s days''', days_old);
  END IF;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
