-- Migration: Fix SECURITY DEFINER function executable linter warnings (lint 0029)
-- Converts client-facing functions to SECURITY INVOKER with single unified RLS policies,
-- and revokes execution privileges from authenticated/anon for admin/system-only functions.

BEGIN;

-- ============================================================================
-- 1. System/Admin Only Functions: Revoke EXECUTE from authenticated and anon
-- ============================================================================
REVOKE EXECUTE ON FUNCTION public.promote_admin(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.promote_admin(text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.mark_expired_vouchers() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_expired_vouchers() TO service_role;

-- ============================================================================
-- 2. Unified RLS Policies for UPDATE/INSERT to support SECURITY INVOKER RPCs
-- ============================================================================

-- profiles: Single unified UPDATE policy
DROP POLICY IF EXISTS "profiles_authenticated_update" ON public.profiles;

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

-- vouchers: Single unified UPDATE policy (replaces vouchers_admin_update)
DROP POLICY IF EXISTS "vouchers_admin_update" ON public.vouchers;
DROP POLICY IF EXISTS "vouchers_authenticated_update" ON public.vouchers;

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

-- voucher_activity: Single unified INSERT policy (replaces voucher_activity_admin_insert)
DROP POLICY IF EXISTS "voucher_activity_admin_insert" ON public.voucher_activity;
DROP POLICY IF EXISTS "voucher_activity_authenticated_insert" ON public.voucher_activity;

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
-- 3. Convert Client RPCs to SECURITY INVOKER
-- ============================================================================

-- is_admin()
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

-- update_my_display_name()
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

-- record_voucher_view()
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

-- claim_voucher()
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

-- redeem_voucher()
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
