-- Script: Check profiles and assign 'admin' role to your user account
-- Run this in your Supabase SQL Editor

-- 1. Check all users and their current roles in profiles table
SELECT p.id, u.email, p.name, p.role, p.is_active, p.created_at
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC;

-- 2. Update your user account role to 'admin'
-- Replace 'EMAIL_AKUN_ANDA@GMAIL.COM' with the email address you use to log in:
UPDATE public.profiles
SET role = 'admin', is_active = true
WHERE id IN (
    SELECT id FROM auth.users WHERE LOWER(email) = LOWER('EMAIL_AKUN_ANDA@GMAIL.COM')
);
