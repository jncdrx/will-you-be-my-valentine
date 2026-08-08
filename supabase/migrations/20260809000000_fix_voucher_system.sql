BEGIN;

-- 1. Update vouchers status check constraint to include 'redeemed'
ALTER TABLE public.vouchers DROP CONSTRAINT IF EXISTS vouchers_status_check;
ALTER TABLE public.vouchers ADD CONSTRAINT vouchers_status_check
  CHECK (status IN ('draft','available','claimed','redeemed','expired','cancelled'));

-- 2. Update voucher_activity action check constraint to include 'viewed' and 'redeemed'
ALTER TABLE public.voucher_activity DROP CONSTRAINT IF EXISTS voucher_activity_action_check;
ALTER TABLE public.voucher_activity ADD CONSTRAINT voucher_activity_action_check
  CHECK (action IN ('created','sent','edited','claimed','redeemed','cancelled','expired','resend','viewed'));

-- 3. Atomic claim_voucher RPC
DROP FUNCTION IF EXISTS public.claim_voucher(UUID);
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

-- 4. Admin redeem_voucher RPC
DROP FUNCTION IF EXISTS public.redeem_voucher(UUID);
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

-- 5. Record voucher view RPC
DROP FUNCTION IF EXISTS public.record_voucher_view(UUID);
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
