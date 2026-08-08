BEGIN;

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
    -- Allow the recipient user (Angel) presenting her voucher AND the admin
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
