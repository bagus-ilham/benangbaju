-- ============================================================
-- Script Diagnostik: Kenapa Admin Panel Tidak Muncul?
-- Jalankan query-query ini SATU PER SATU di Supabase SQL Editor
-- ============================================================

-- 1. Cek SEMUA users dan role mereka
-- Perhatikan kolom "role" — apakah benar-benar 'admin'?
SELECT 
    u.id,
    u.email,
    p.name,
    p.role AS role_exact,
    LOWER(p.role) AS role_lowered,
    LENGTH(p.role) AS role_length,  -- Jika > 5 untuk 'admin', ada karakter tersembunyi!
    p.is_active,
    p.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
ORDER BY p.created_at DESC;

-- 2. Cek apakah ada karakter tersembunyi (spasi, tab, newline) di kolom role
-- Jika hasil ini berbeda dari query di atas, ada karakter tersembunyi!
SELECT 
    id,
    role,
    LENGTH(role) AS role_length,
    ENCODE(role::bytea, 'hex') AS role_hex,
    TRIM(role) AS role_trimmed,
    TRIM(role) = 'admin' AS is_really_admin
FROM public.profiles
WHERE LOWER(TRIM(role)) IN ('admin', 'staff');

-- 3. Cek RLS policies pada tabel profiles
SELECT 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 4. Test: Apakah is_admin() function berfungsi dengan benar?
-- (Ini akan mengembalikan FALSE karena kamu menjalankannya sebagai service role di SQL Editor,
--  tapi harusnya tidak error)
SELECT public.is_admin();

-- 5. FIX: Bersihkan role dari karakter tersembunyi dan set ke 'admin'
-- GANTI email di bawah dengan email kamu yang benar!
UPDATE public.profiles
SET role = 'admin', is_active = true
WHERE id IN (
    SELECT id FROM auth.users 
    WHERE LOWER(email) = LOWER('EMAIL_AKUN_ANDA@GMAIL.COM')
);

-- 6. Verifikasi setelah update
SELECT id, role, LENGTH(role), is_active
FROM public.profiles
WHERE id IN (
    SELECT id FROM auth.users 
    WHERE LOWER(email) = LOWER('EMAIL_AKUN_ANDA@GMAIL.COM')
);
