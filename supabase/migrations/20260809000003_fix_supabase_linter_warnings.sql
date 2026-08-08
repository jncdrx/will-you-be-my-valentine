-- Migration: Fix Supabase Database Linter Security & Best Practice Warnings
-- 1. Fix Mutable Search Paths (Lint 0011)
-- 2. Harden Overly Permissive RLS Policies (Lint 0024)
-- 3. Restrict Public Storage Bucket Object Listing (Lint 0025)
-- 4. Revoke/Grant Execution Privileges on SECURITY DEFINER & SECURITY INVOKER Functions (Lint 0028 & 0029)
-- Idempotent: safe to execute multiple times.

BEGIN;

-- ============================================================================
-- 1. Fix Function Search Paths (Lint 0011) & SECURITY DEFINER settings
-- ============================================================================

-- Fix update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$;

-- Fix verify_site_password (switch to SECURITY INVOKER & lock search_path)
CREATE OR REPLACE FUNCTION public.verify_site_password(input_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.site_settings
        WHERE key = 'access_password' AND value = input_password
    );
END;
$$;


-- ============================================================================
-- 2. Fix Overly Permissive RLS Policies (Lint 0024)
-- ============================================================================

-- Table: public.angel_user_data
-- Drop overly permissive "Allow anon access fallback" policy (ALL with USING(true) WITH CHECK(true))
DROP POLICY IF EXISTS "Allow anon access fallback" ON public.angel_user_data;

-- Recreate policy restricted to SELECT for anon (Supabase linter explicitly allows SELECT with USING(true) for public read)
DROP POLICY IF EXISTS "Allow anon read fallback" ON public.angel_user_data;
CREATE POLICY "Allow anon read fallback"
ON public.angel_user_data
FOR SELECT
TO anon
USING (true);


-- Table: public.monthsary_responses
-- Drop and recreate "Allow admin full access to responses" with proper is_admin() checks
DROP POLICY IF EXISTS "Allow admin full access to responses" ON public.monthsary_responses;
CREATE POLICY "Allow admin full access to responses"
ON public.monthsary_responses
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Drop and recreate "Allow public visitor insert response" with explicit column check
DROP POLICY IF EXISTS "Allow public visitor insert response" ON public.monthsary_responses;
CREATE POLICY "Allow public visitor insert response"
ON public.monthsary_responses
FOR INSERT
TO anon, authenticated
WITH CHECK (length(trim(name)) > 0 AND length(trim(message)) > 0 AND response_token IS NOT NULL);


-- Table: public.site_settings
-- Drop and recreate "Allow admin write site_settings" with proper is_admin() checks
DROP POLICY IF EXISTS "Allow admin write site_settings" ON public.site_settings;
CREATE POLICY "Allow admin write site_settings"
ON public.site_settings
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- ============================================================================
-- 3. Fix Storage Bucket Object Listing Policies (Lint 0025)
-- Public buckets serve objects directly via public URLs without needing a broad SELECT on storage.objects.
-- Restrict SELECT on storage.objects to authenticated admin users.
-- ============================================================================

-- Bucket: monthsary-reactions
DROP POLICY IF EXISTS "Allow public read reaction images" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin read reaction images" ON storage.objects;
CREATE POLICY "Allow admin read reaction images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'monthsary-reactions' AND public.is_admin());

-- Bucket: songs
DROP POLICY IF EXISTS "Allow public read songs files" ON storage.objects;
DROP POLICY IF EXISTS "songs_bucket_public_read" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin read songs files" ON storage.objects;
CREATE POLICY "Allow admin read songs files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'songs' AND public.is_admin());

-- Bucket: vouchers
DROP POLICY IF EXISTS "vouchers_bucket_public_read" ON storage.objects;
DROP POLICY IF EXISTS "vouchers_bucket_admin_read" ON storage.objects;
CREATE POLICY "vouchers_bucket_admin_read"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'vouchers' AND public.is_admin());


-- ============================================================================
-- 4. Fix Function Execution Privileges (Lint 0028 & 0029)
-- ============================================================================

-- Internal trigger / system functions: MUST NOT be executable via RPC by PUBLIC, anon, or authenticated
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_admin_role_on_signup() FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'rls_auto_enable'
    ) THEN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;';
    END IF;
END $$;


-- Convert get_login_attempts to SECURITY INVOKER (Lint 0029 fix)
CREATE OR REPLACE FUNCTION public.get_login_attempts(
    p_filters JSONB DEFAULT '{}'::jsonb,
    p_limit   INT DEFAULT 50,
    p_offset  INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_status    TEXT := coalesce(p_filters->>'status', '');
    v_account   TEXT := coalesce(p_filters->>'account', '');
    v_date_from TEXT := coalesce(p_filters->>'date_from', '');
    v_date_to   TEXT := coalesce(p_filters->>'date_to', '');
    v_location  TEXT := coalesce(p_filters->>'location', '');
    v_device    TEXT := coalesce(p_filters->>'device', '');
    v_browser   TEXT := coalesce(p_filters->>'browser', '');
    v_total     INT;
    v_rows      JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'get_login_attempts: administrator access required'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    IF p_limit IS NULL OR p_limit <= 0 OR p_limit > 500 THEN
        p_limit := 50;
    END IF;
    IF p_offset IS NULL OR p_offset < 0 THEN
        p_offset := 0;
    END IF;

    SELECT count(*) INTO v_total
    FROM public.login_attempts a
    WHERE (v_status = '' OR a.attempt_status = v_status)
      AND (v_account = '' OR a.account_identifier ILIKE '%' || v_account || '%')
      AND (v_date_from = '' OR a.created_at >= v_date_from::timestamptz)
      AND (v_date_to = '' OR a.created_at < (v_date_to::date + 1)::timestamptz)
      AND (
          v_location = '' OR
          coalesce(a.country,'')  ILIKE '%' || v_location || '%' OR
          coalesce(a.region,'')   ILIKE '%' || v_location || '%' OR
          coalesce(a.city,'')     ILIKE '%' || v_location || '%'
      )
      AND (v_device = '' OR a.device_type = v_device)
      AND (v_browser = '' OR a.browser ILIKE '%' || v_browser || '%');

    SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.created_at DESC), '[]'::jsonb) INTO v_rows
    FROM (
        SELECT * FROM public.login_attempts a
        WHERE (v_status = '' OR a.attempt_status = v_status)
          AND (v_account = '' OR a.account_identifier ILIKE '%' || v_account || '%')
          AND (v_date_from = '' OR a.created_at >= v_date_from::timestamptz)
          AND (v_date_to = '' OR a.created_at < (v_date_to::date + 1)::timestamptz)
          AND (
              v_location = '' OR
              coalesce(a.country,'')  ILIKE '%' || v_location || '%' OR
              coalesce(a.region,'')   ILIKE '%' || v_location || '%' OR
              coalesce(a.city,'')     ILIKE '%' || v_location || '%'
          )
          AND (v_device = '' OR a.device_type = v_device)
          AND (v_browser = '' OR a.browser ILIKE '%' || v_browser || '%')
        ORDER BY a.created_at DESC
        LIMIT p_limit OFFSET p_offset
    ) t;

    RETURN jsonb_build_object('rows', v_rows, 'total', v_total);
END;
$$;

-- Revoke anon access from SECURITY DEFINER RPCs and ensure appropriate grants to authenticated
REVOKE EXECUTE ON FUNCTION public.claim_voucher(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_voucher(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.redeem_voucher(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_voucher(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.record_voucher_view(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_voucher_view(UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.update_my_display_name(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_my_display_name(TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.mark_expired_vouchers() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_expired_vouchers() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.promote_admin(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.promote_admin(TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_login_attempts(JSONB, INT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_login_attempts(JSONB, INT, INT) TO authenticated;

COMMIT;
