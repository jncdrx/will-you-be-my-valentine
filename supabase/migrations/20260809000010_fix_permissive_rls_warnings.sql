-- Migration: Fix permissive RLS policy warnings (lint 0024 rls_policy_always_true)
-- Replaces overly permissive USING (true) and WITH CHECK (true) expressions on write operations with strict validation checks and admin authorization.

BEGIN;

-- ============================================================================
-- 1. public.angel_user_data: Limit anon fallback policy to SELECT
-- ============================================================================
DROP POLICY IF EXISTS "Allow anon access fallback" ON public.angel_user_data;

CREATE POLICY "Allow anon access fallback"
ON public.angel_user_data
FOR SELECT
TO anon
USING (true);

-- ============================================================================
-- 2. public.monthsary_responses: Add column validation checks to visitor INSERT
-- ============================================================================
DROP POLICY IF EXISTS "Allow public visitor insert response" ON public.monthsary_responses;

CREATE POLICY "Allow public visitor insert response"
ON public.monthsary_responses
FOR INSERT
TO anon
WITH CHECK (
    name IS NOT NULL
    AND length(trim(name)) > 0
    AND message IS NOT NULL
    AND response_token IS NOT NULL
);

-- ============================================================================
-- 3. public.site_settings: Restrict INSERT, UPDATE, DELETE to admins (public.is_admin())
-- ============================================================================
DROP POLICY IF EXISTS "Allow admin insert site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow admin update site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow admin delete site_settings" ON public.site_settings;

CREATE POLICY "Allow admin insert site_settings"
ON public.site_settings
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Allow admin update site_settings"
ON public.site_settings
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Allow admin delete site_settings"
ON public.site_settings
FOR DELETE
TO authenticated
USING (public.is_admin());

COMMIT;
