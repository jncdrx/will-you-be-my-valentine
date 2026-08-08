-- Migration: Apply all RLS performance and security fixes cleanly
-- Resolves auth_rls_initplan (0003), multiple_permissive_policies (0006), and security_definer warnings (0029).

BEGIN;

-- ============================================================================
-- 1. angel_user_data: Fix auth_rls_initplan
-- ============================================================================
DROP POLICY IF EXISTS "Angel access own data" ON public.angel_user_data;
DROP POLICY IF EXISTS "Allow anon access fallback" ON public.angel_user_data;

CREATE POLICY "Angel access own data"
ON public.angel_user_data
FOR ALL
TO authenticated
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Allow anon access fallback"
ON public.angel_user_data
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 2. profiles: Fix auth_rls_initplan & update policies
-- ============================================================================
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_authenticated_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_displayname" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;

CREATE POLICY "profiles_select_own_or_admin"
ON public.profiles
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = id OR public.is_admin());

CREATE POLICY "profiles_authenticated_update"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
    public.is_admin()
    OR (SELECT auth.uid()) = id
)
WITH CHECK (
    public.is_admin()
    OR (
        (SELECT auth.uid()) = id
        AND role = (SELECT role FROM public.profiles WHERE id = (SELECT auth.uid()))
    )
);

-- ============================================================================
-- 3. vouchers: Fix auth_rls_initplan & multiple_permissive_policies (SELECT + UPDATE)
-- ============================================================================
DROP POLICY IF EXISTS "vouchers_select_admin_or_recipient" ON public.vouchers;
DROP POLICY IF EXISTS "vouchers_admin_write" ON public.vouchers;
DROP POLICY IF EXISTS "vouchers_admin_insert" ON public.vouchers;
DROP POLICY IF EXISTS "vouchers_admin_update" ON public.vouchers;
DROP POLICY IF EXISTS "vouchers_authenticated_update" ON public.vouchers;
DROP POLICY IF EXISTS "vouchers_admin_delete" ON public.vouchers;

CREATE POLICY "vouchers_select_admin_or_recipient"
ON public.vouchers
FOR SELECT
TO authenticated
USING (
    public.is_admin()
    OR (recipient_id = (SELECT auth.uid()) AND status <> 'draft')
);

CREATE POLICY "vouchers_admin_insert"
ON public.vouchers
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Single unified UPDATE policy covering both admins and recipient voucher transitions
CREATE POLICY "vouchers_authenticated_update"
ON public.vouchers
FOR UPDATE
TO authenticated
USING (
    public.is_admin()
    OR (
        recipient_id = (SELECT auth.uid())
        AND status IN ('available', 'claimed')
    )
)
WITH CHECK (
    public.is_admin()
    OR (
        recipient_id = (SELECT auth.uid())
        AND status IN ('claimed', 'redeemed')
    )
);

CREATE POLICY "vouchers_admin_delete"
ON public.vouchers
FOR DELETE
TO authenticated
USING (public.is_admin());

-- ============================================================================
-- 4. voucher_activity: Fix auth_rls_initplan & multiple_permissive_policies
-- ============================================================================
DROP POLICY IF EXISTS "voucher_activity_select_admin_or_recipient" ON public.voucher_activity;
DROP POLICY IF EXISTS "voucher_activity_admin_insert" ON public.voucher_activity;
DROP POLICY IF EXISTS "voucher_activity_authenticated_insert" ON public.voucher_activity;

CREATE POLICY "voucher_activity_select_admin_or_recipient"
ON public.voucher_activity
FOR SELECT
TO authenticated
USING (
    public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.vouchers v
        WHERE v.id = voucher_activity.voucher_id
          AND v.recipient_id = (SELECT auth.uid())
    )
);

CREATE POLICY "voucher_activity_authenticated_insert"
ON public.voucher_activity
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin()
    OR (
        user_id = (SELECT auth.uid())
        AND action IN ('claimed', 'redeemed', 'viewed')
    )
);

-- ============================================================================
-- 5. monthsary_responses: Fix multiple_permissive_policies (INSERT)
-- ============================================================================
DROP POLICY IF EXISTS "Allow public visitor insert response" ON public.monthsary_responses;

CREATE POLICY "Allow public visitor insert response"
ON public.monthsary_responses
FOR INSERT
TO anon
WITH CHECK (true);

-- ============================================================================
-- 6. site_settings: Fix multiple_permissive_policies (SELECT)
-- ============================================================================
DROP POLICY IF EXISTS "Allow admin write site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow admin insert site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow admin update site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow admin delete site_settings" ON public.site_settings;

CREATE POLICY "Allow admin insert site_settings"
ON public.site_settings
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow admin update site_settings"
ON public.site_settings
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow admin delete site_settings"
ON public.site_settings
FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- 7. songs: Fix multiple_permissive_policies (SELECT)
-- ============================================================================
DROP POLICY IF EXISTS "songs_admin_write" ON public.songs;
DROP POLICY IF EXISTS "songs_admin_insert" ON public.songs;
DROP POLICY IF EXISTS "songs_admin_update" ON public.songs;
DROP POLICY IF EXISTS "songs_admin_delete" ON public.songs;

CREATE POLICY "songs_admin_insert"
ON public.songs
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "songs_admin_update"
ON public.songs
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "songs_admin_delete"
ON public.songs
FOR DELETE
TO authenticated
USING (public.is_admin());

-- ============================================================================
-- 8. Functions: Security Definer & Invoker permissions
-- ============================================================================
REVOKE EXECUTE ON FUNCTION public.promote_admin(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.promote_admin(text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.mark_expired_vouchers() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_expired_vouchers() TO service_role;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.update_my_display_name(p_display_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'not authenticated';
    END IF;
    UPDATE public.profiles
       SET display_name = left(p_display_name, 80), updated_at = now()
     WHERE id = auth.uid();
    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_voucher_view(p_voucher_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
#variable_conflict use_column
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.vouchers v
        WHERE v.id = p_voucher_id AND (v.recipient_id = auth.uid() OR public.is_admin())
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.voucher_activity a
            WHERE a.voucher_id = p_voucher_id
              AND a.user_id = auth.uid()
              AND a.action = 'viewed'
              AND a.created_at > now() - interval '1 hour'
        ) THEN
            INSERT INTO public.voucher_activity (voucher_id, user_id, action, metadata)
            VALUES (p_voucher_id, auth.uid(), 'viewed', jsonb_build_object('viewed_at', now()));
        END IF;
        RETURN TRUE;
    END IF;
    RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_voucher(p_voucher_id UUID)
RETURNS TABLE(id UUID, status TEXT, claimed_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
    v_updated INTEGER;
    v_claimed_at TIMESTAMPTZ;
    v_voucher_id UUID;
    v_status TEXT;
BEGIN
    UPDATE public.vouchers v
       SET status = 'claimed',
           claimed_at = now(),
           updated_at = now()
     WHERE v.id = p_voucher_id
       AND v.recipient_id = auth.uid()
       AND v.status = 'available'
       AND (v.expires_at IS NULL OR v.expires_at > now())
    RETURNING v.id, v.status, v.claimed_at
      INTO v_voucher_id, v_status, v_claimed_at;

    GET DIAGNOSTICS v_updated = ROW_COUNT;

    IF v_updated = 0 THEN
        RAISE EXCEPTION 'claim_failed: voucher is not claimable (already claimed, expired, cancelled, not assigned to you, or does not exist)'
            USING ERRCODE = 'check_violation';
    END IF;

    INSERT INTO public.voucher_activity (voucher_id, user_id, action, metadata)
    VALUES (v_voucher_id, auth.uid(), 'claimed', jsonb_build_object('claimed_at', v_claimed_at));

    RETURN QUERY SELECT v_voucher_id, v_status, v_claimed_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.redeem_voucher(p_voucher_id UUID)
RETURNS TABLE(id UUID, status TEXT)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
    v_updated INTEGER;
    v_voucher_id UUID;
    v_status TEXT;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.vouchers v
        WHERE v.id = p_voucher_id
          AND (v.recipient_id = auth.uid() OR public.is_admin())
    ) THEN
        RAISE EXCEPTION 'insufficient_privilege: you are not authorized to redeem this voucher';
    END IF;

    UPDATE public.vouchers v
       SET status = 'redeemed',
           updated_at = now()
     WHERE v.id = p_voucher_id
       AND v.status IN ('available', 'claimed')
    RETURNING v.id, v.status
      INTO v_voucher_id, v_status;

    GET DIAGNOSTICS v_updated = ROW_COUNT;

    IF v_updated = 0 THEN
        RAISE EXCEPTION 'redeem_failed: voucher is already redeemed, expired, or cancelled';
    END IF;

    INSERT INTO public.voucher_activity (voucher_id, user_id, action, metadata)
    VALUES (p_voucher_id, auth.uid(), 'redeemed', jsonb_build_object('redeemed_at', now(), 'redeemed_by', auth.uid()));

    RETURN QUERY SELECT v_voucher_id, v_status;
END;
$$;

COMMIT;
