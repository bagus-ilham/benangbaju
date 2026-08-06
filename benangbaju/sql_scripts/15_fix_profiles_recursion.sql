-- ============================================================
-- FIX: Hapus policy "Allow Admin All" dari tabel profiles
-- yang menyebabkan infinite recursion
-- ============================================================
-- 
-- MASALAH:
-- Policy "Allow Admin All" pada tabel profiles melakukan:
--   EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
-- Ini adalah subquery ke tabel profiles sendiri, sehingga saat Postgres
-- evaluate policy untuk SELECT pada profiles, ia harus SELECT lagi dari
-- profiles → trigger policy lagi → infinite recursion.
--
-- SOLUSI:
-- Hapus policy ini. Admin access sudah ditangani oleh:
-- - select_profiles_admin (pakai is_admin() SECURITY DEFINER)
-- - update_profiles_admin (pakai is_admin() SECURITY DEFINER)
-- - "Allow authenticated read profiles" (USING true)
-- - "Users can read own profile" (USING true)
-- ============================================================

-- Hapus policy yang menyebabkan infinite recursion
DROP POLICY IF EXISTS "Allow Admin All" ON public.profiles;

-- Verifikasi: Pastikan policy sudah hilang
SELECT policyname, cmd, qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;
