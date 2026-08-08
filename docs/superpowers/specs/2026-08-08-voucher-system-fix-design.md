# End-to-End Voucher System Fix — Design Spec

## Overview
This specification details the comprehensive, end-to-end fix for the voucher system. It addresses voucher creation, user assignment, real-time display, atomic claiming, admin visibility, status management, activity logging, and error handling across both backend (Supabase SQL/RPCs/RLS) and frontend (React components, hooks, type definitions, and test suites).

---

## 1. Root Causes & Key Fixes

### A. Expiration Date Boundary Bug
* **Problem**: Selecting a date in HTML `<input type="date">` (e.g. `2026-08-08`) produced an ISO string `2026-08-08T00:00:00.000Z` (midnight at the *start* of the day). Because the current time on creation is past midnight UTC, `expires_at <= now()` evaluated to `TRUE` immediately upon creation. The voucher was marked `expired` instantly and rejected by `claim_voucher`.
* **Fix**: Any date string without a time component will be formatted to end-of-day UTC (`YYYY-MM-DDT23:59:59.999Z`).

### B. Database Schema & Activity Tracking
* **Problem**: `voucher_activity.action` constraint lacked `'viewed'` and `'redeemed'` actions. `vouchers.status` constraint lacked `'redeemed'`.
* **Fix**:
  * Update `vouchers.status` CHECK constraint: `'draft'`, `'available'`, `'claimed'`, `'redeemed'`, `'expired'`, `'cancelled'`.
  * Update `voucher_activity.action` CHECK constraint: `'created'`, `'sent'`, `'edited'`, `'claimed'`, `'redeemed'`, `'cancelled'`, `'expired'`, `'resend'`, `'viewed'`.

### C. Recipient Auto-Selection
* **Problem**: Admin voucher form allowed sending without selecting a recipient if only 1 profile existed or if the dropdown was unselected.
* **Fix**: Auto-select the first recipient profile if none is explicitly chosen and only 1 active recipient exists, and validate `recipient_id` strictly.

### D. Admin Visibility & Per-User Filtering
* **Problem**: `VoucherTable` in Admin Dashboard only showed a subset of columns, missing Voucher Code/ID, Expiration Date, explicit Claim Date, and Per-User filtering/grouping.
* **Fix**:
  * Add a recipient filter dropdown / user selector in Admin Dashboard.
  * Show Voucher Code/ID (`#VOUCH-...`), Title, Type, Recipient, Status Badge, Date Assigned, Date Claimed, and Expiration Date in `VoucherTable`.
  * Add admin action to mark claimed vouchers as `Redeemed`.

### E. Optimistic UI & Server Synchronization
* **Problem**: Frontend claim state needed explicit optimistic updates with server confirmation and rollback on failure.
* **Fix**: Update `ClaimVoucherDialog` to optimistically reflect claiming state, await the server RPC response, sync with returned server state, and rollback + show toast error if server RPC fails.

---

## 2. Database & SQL Architecture

### Migration File: `supabase/migrations/20260809000000_fix_voucher_system.sql`

```sql
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
CREATE OR REPLACE FUNCTION public.claim_voucher(p_voucher_id UUID)
RETURNS TABLE(id UUID, status TEXT, claimed_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_updated INTEGER;
    v_claimed_at TIMESTAMPTZ;
    v_voucher_id UUID;
    v_status TEXT;
BEGIN
    UPDATE public.vouchers
       SET status = 'claimed',
           claimed_at = now(),
           updated_at = now()
     WHERE id = p_voucher_id
       AND recipient_id = auth.uid()
       AND status = 'available'
       AND (expires_at IS NULL OR expires_at > now())
    RETURNING public.vouchers.id, public.vouchers.status, public.vouchers.claimed_at
      INTO v_voucher_id, v_status, v_claimed_at;

    GET DIAGNOSTICS v_updated = ROW_COUNT;

    IF v_updated = 0 THEN
        RAISE EXCEPTION 'claim_failed: voucher is not claimable (already claimed, expired, cancelled, not assigned to you, or does not exist)'
            USING ERRCODE = 'check_violation';
    END IF;

    INSERT INTO public.voucher_activity (voucher_id, user_id, action, metadata)
    VALUES (v_voucher_id, auth.uid(), 'claimed', jsonb_build_object('claimed_at', v_claimed_at));

    id := v_voucher_id;
    status := v_status;
    claimed_at := v_claimed_at;

    RETURN NEXT;
END;
$$;

-- 4. Admin redeem_voucher RPC
CREATE OR REPLACE FUNCTION public.redeem_voucher(p_voucher_id UUID)
RETURNS TABLE(id UUID, status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_updated INTEGER;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'insufficient_privilege: admin access required';
    END IF;

    UPDATE public.vouchers
       SET status = 'redeemed',
           updated_at = now()
     WHERE id = p_voucher_id
       AND status = 'claimed'
    RETURNING public.vouchers.id, public.vouchers.status
      INTO id, status;

    GET DIAGNOSTICS v_updated = ROW_COUNT;

    IF v_updated = 0 THEN
        RAISE EXCEPTION 'redeem_failed: voucher is not in claimed status';
    END IF;

    INSERT INTO public.voucher_activity (voucher_id, user_id, action, metadata)
    VALUES (p_voucher_id, auth.uid(), 'redeemed', jsonb_build_object('redeemed_at', now()));

    RETURN NEXT;
END;
$$;

-- 5. Record voucher view RPC (tracking)
CREATE OR REPLACE FUNCTION public.record_voucher_view(p_voucher_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Only record view if the user is recipient or admin, and hasn't logged a view in the last 1 hour
    IF EXISTS (
        SELECT 1 FROM public.vouchers
        WHERE id = p_voucher_id AND (recipient_id = auth.uid() OR public.is_admin())
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.voucher_activity
            WHERE voucher_id = p_voucher_id
              AND user_id = auth.uid()
              AND action = 'viewed'
              AND created_at > now() - interval '1 hour'
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
```

---

## 3. Frontend & API Modifications

1. **`src/lib/vouchers.ts`**:
   - Update `VoucherStatus` type to include `"redeemed"`.
   - Update `effectiveStatus()` and `isClaimable()`.
   - Fix `createVoucher()` & `updateVoucher()` to format expiration date strings as `YYYY-MM-DDT23:59:59.999Z`.
   - Update `listMyVouchers()` to explicitly filter by authenticated `recipient_id`.
   - Add `redeemVoucher(voucherId)` API method.
   - Add `recordVoucherView(voucherId)` API method.

2. **`src/components/user/ClaimVoucherDialog.tsx`**:
   - Implement optimistic UI claiming state with server validation & rollback.

3. **`src/components/admin/VoucherTable.tsx` & `AdminVoucherSummary.tsx`**:
   - Add recipient user filtering dropdown ("All Users", "Angel", etc.).
   - Display Voucher Code/ID (`#VOUCH-...`), Title, Type, Recipient, Status Badge, Sent Date, Claimed Date, and Expiration Date.
   - Add "Mark as Redeemed" button for claimed vouchers.

4. **Unit Tests (`src/components/user/__tests__/VoucherCard.test.tsx` & `src/lib/__tests__/vouchers.test.ts`)**:
   - Update test matchers to align with exact status text badges ("UNCLAIMED", "CLAIMED & RESERVED", "REDEEMED").
   - Test expiration date formatting and boundary conditions.

---

## 4. Verification Plan

1. **Unit Tests**: Run `pnpm test -- --run` to ensure all frontend unit and component tests pass clean.
2. **Schema & Migration**: Apply migration to database, verify constraints and RPCs.
3. **End-to-End Flow Verification**:
   - Admin creates a new voucher with today's date or future date as expiry and sends it to user.
   - User logs in, sees voucher instantly in Realtime, clicks "Claim Voucher".
   - Claim succeeds atomically in Supabase, DB row updates to `claimed` with `claimed_at` timestamp.
   - Admin dashboard receives Realtime update or on refresh displays claimed status, claim date, and allows marking as redeemed.
