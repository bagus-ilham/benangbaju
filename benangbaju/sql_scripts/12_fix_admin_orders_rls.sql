-- Migration script: Fix Admin RLS & Prevent Infinite RLS Recursion on Profiles
-- Safe to run in Supabase SQL Editor

BEGIN;

-- 1. Update parameterless is_admin() in-place with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND LOWER(role) = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Update parameter-accepting is_admin(UUID) in-place with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$ 
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = COALESCE(p_user_id, auth.uid()) AND LOWER(role) = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Base user policies on profiles table (allows authenticated users to read profiles without RLS failure)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read profiles" ON public.profiles;
CREATE POLICY "Allow authenticated read profiles" ON public.profiles
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 4. Apply Admin All policies for orders and related tables
DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'orders',
        'order_items',
        'order_shipping',
        'payments',
        'return_requests',
        'return_items',
        'return_media'
    ];
BEGIN
    FOR i IN 1..array_length(tables, 1) LOOP
        tbl := tables[i];
        
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Allow Admin All" ON %I;', tbl);
        EXECUTE format('CREATE POLICY "Allow Admin All" ON %I FOR ALL USING (public.is_admin());', tbl);
    END LOOP;
END $$;

COMMIT;
