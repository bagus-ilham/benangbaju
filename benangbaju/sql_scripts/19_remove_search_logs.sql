-- =======================================================
-- Script 19: Remove Search Logs & Prevent Database Bloat
-- =======================================================
-- Deskripsi: Menghapus data dan tabel search_logs agar tidak
--            memenuhi database Supabase.

-- 1. Bersihkan data yang ada jika tabel masih ada
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'search_logs') THEN
    TRUNCATE TABLE public.search_logs CASCADE;
  END IF;
END $$;

-- 2. Drop RLS policies jika ada
DROP POLICY IF EXISTS "insert_search_logs_public" ON public.search_logs;
DROP POLICY IF EXISTS "select_search_logs_admin" ON public.search_logs;

-- 3. Drop tabel search_logs
DROP TABLE IF EXISTS public.search_logs CASCADE;

-- 4. Catatan: Logging pencarian di Next.js Server Actions telah dinonaktifkan.
