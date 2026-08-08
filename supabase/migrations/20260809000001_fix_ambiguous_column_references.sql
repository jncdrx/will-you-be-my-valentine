BEGIN;

-- Explicitly drop existing functions to ensure clean signature and parameter mapping
DROP FUNCTION IF EXISTS public.claim_voucher(UUID);
DROP FUNCTION IF EXISTS public.redeem_voucher(UUID);
DROP FUNCTION IF EXISTS public.record_voucher_view(UUID);

-- 1. Fixed claim_voucher RPC (resolves ambiguous 'id' column reference)
CREATE OR REPLACE FUNCTION public.claim_voucher(p_voucher_id UUID)
RETURNS TABLE(id UUID, status TEXT, claimed_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 2. Fixed redeem_voucher RPC
CREATE OR REPLACE FUNCTION public.redeem_voucher(p_voucher_id UUID)
RETURNS TABLE(id UUID, status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
    v_updated INTEGER;
    v_voucher_id UUID;
    v_status TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'insufficient_privilege: admin access required';
    END IF;

    UPDATE public.vouchers v
       SET status = 'redeemed',
           updated_at = now()
     WHERE v.id = p_voucher_id
       AND v.status = 'claimed'
    RETURNING v.id, v.status
      INTO v_voucher_id, v_status;

    GET DIAGNOSTICS v_updated = ROW_COUNT;

    IF v_updated = 0 THEN
        RAISE EXCEPTION 'redeem_failed: voucher is not in claimed status';
    END IF;

    INSERT INTO public.voucher_activity (voucher_id, user_id, action, metadata)
    VALUES (p_voucher_id, auth.uid(), 'redeemed', jsonb_build_object('redeemed_at', now()));

    RETURN QUERY SELECT v_voucher_id, v_status;
END;
$$;

-- 3. Fixed record_voucher_view RPC
CREATE OR REPLACE FUNCTION public.record_voucher_view(p_voucher_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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

COMMIT;
