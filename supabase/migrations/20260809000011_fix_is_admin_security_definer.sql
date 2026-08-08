-- Migration: Fix is_admin() privilege level (SECURITY DEFINER) to resolve RLS infinite recursion
-- Fixes RLS policy recursion on public.profiles and public.vouchers tables.
-- Backfills any missing profiles from auth.users.

BEGIN;

-- ============================================================================
-- 1. Re-define is_admin() as SECURITY DEFINER
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon, service_role;

-- ============================================================================
-- 2. Cleanly re-assert profiles SELECT policy
-- ============================================================================
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;

CREATE POLICY "profiles_select_own_or_admin"
ON public.profiles
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = id OR public.is_admin());

-- ============================================================================
-- 3. Backfill profiles for existing auth.users missing from public.profiles
-- ============================================================================
INSERT INTO public.profiles (id, email, display_name, role)
SELECT 
    u.id, 
    COALESCE(u.email, ''), 
    u.raw_user_meta_data->>'display_name', 
    'user'
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Auto-promote admin profile if site_settings admin_email matches
UPDATE public.profiles
SET role = 'admin'
WHERE lower(email) IN (
    SELECT lower(trim(value)) FROM public.site_settings WHERE key = 'admin_email'
);

COMMIT;
