# End-to-End Voucher System Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the voucher system end-to-end so newly created and newly assigned vouchers can be immediately claimed by recipients, state is persisted in Supabase with atomic double-claim protection, admin has full visibility per user, and optimistic UI syncs smoothly.

**Architecture:** A PostgreSQL migration updating constraints and RPC functions (`claim_voucher`, `redeem_voucher`, `record_voucher_view`), frontend Date handling fixes (end-of-day boundary), updated React Query and Supabase hooks, and UI component enhancements for Admin Dashboard and User Claim Dialog.

**Tech Stack:** React, TypeScript, Supabase (PostgreSQL RLS & RPCs, Realtime), TanStack React Query, Vitest, Tailwind CSS, Framer Motion.

## Global Constraints
- Database schema updates must be idempotent and safe to re-run.
- Expiration dates must end at `23:59:59.999Z` when specified without a time component.
- All claim, redeem, and view actions must persist server-side in `voucher_activity`.
- Strict RLS and `SECURITY DEFINER` checks on server-side RPC functions.

---

### Task 1: Database Migration & RPC Enhancements

**Files:**
- Create: `supabase/migrations/20260809000000_fix_voucher_system.sql`

**Interfaces:**
- Produces: Updated SQL schema constraints on `vouchers` and `voucher_activity`, and RPC functions `public.claim_voucher`, `public.redeem_voucher`, `public.record_voucher_view`.

- [ ] **Step 1: Write SQL Migration file**

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

-- 5. Record voucher view RPC
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

- [ ] **Step 2: Commit database migration**

```bash
git add supabase/migrations/2026090000000_fix_voucher_system.sql
git commit -m "feat(db): add fix_voucher_system migration with redeemed status and RPCs"
```

---

### Task 2: Core Voucher Library & Expiration Boundary Fix

**Files:**
- Modify: `src/lib/vouchers.ts`
- Modify: `src/lib/__tests__/vouchers.test.ts`

**Interfaces:**
- Consumes: Database schema constraints and RPC signatures.
- Produces: `VoucherStatus` type (including `"redeemed"`), `effectiveStatus`, `isClaimable`, `createVoucher`, `updateVoucher`, `listMyVouchers`, `claimVoucher`, `redeemVoucher`, `recordVoucherView`.

- [ ] **Step 1: Update `src/lib/vouchers.ts` types, boundary fixes, and API methods**

Update `VoucherStatus` to include `"redeemed"`, update `STATUS_DISPLAY`, fix expiration date formatting in `createVoucher` / `updateVoucher` so `expires_at` date strings resolve to `YYYY-MM-DDT23:59:59.999Z`, filter `listMyVouchers()` by authenticated user ID, and add `redeemVoucher` & `recordVoucherView`.

- [ ] **Step 2: Update unit tests in `src/lib/__tests__/vouchers.test.ts`**

Add unit test coverage for end-of-day expiration boundary handling and `"redeemed"` status.

- [ ] **Step 3: Run unit tests to verify**

Run: `pnpm test -- src/lib/__tests__/vouchers.test.ts`
Expected: PASS

- [ ] **Step 4: Commit library changes**

```bash
git add src/lib/vouchers.ts src/lib/__tests__/vouchers.test.ts
git commit -m "fix(lib): fix voucher expiration date boundary, add redeemed status and RPC wrappers"
```

---

### Task 3: User Voucher Card & Claim Dialog Component Updates

**Files:**
- Modify: `src/components/user/VoucherCard.tsx`
- Modify: `src/components/user/ClaimVoucherDialog.tsx`
- Modify: `src/components/user/VouchersSection.tsx`
- Modify: `src/components/user/__tests__/VoucherCard.test.tsx`

**Interfaces:**
- Consumes: `Voucher`, `VoucherStatus`, `claimVoucher`, `recordVoucherView` from `src/lib/vouchers.ts`.
- Produces: Updated user voucher card with `"UNCLAIMED"` badge matcher, optimistic claim dialog, and view tracking.

- [ ] **Step 1: Fix test in `src/components/user/__tests__/VoucherCard.test.tsx`**

Update text matcher from `"Available"` to `"UNCLAIMED"` (or regex `/UNCLAIMED/i`) matching `VoucherCard.tsx`.

- [ ] **Step 2: Update `VoucherCard.tsx` and `ClaimVoucherDialog.tsx`**

In `ClaimVoucherDialog.tsx`, implement optimistic claim state with error rollback. In `VouchersSection.tsx`, call `recordVoucherView` when recipient views vouchers.

- [ ] **Step 3: Run tests to verify**

Run: `pnpm test -- --run`
Expected: PASS

- [ ] **Step 4: Commit user UI components**

```bash
git add src/components/user/
git commit -m "fix(ui): update VoucherCard status badge, ClaimVoucherDialog optimistic state, and view tracking"
```

---

### Task 4: Admin Dashboard, Voucher Table & User Filtering

**Files:**
- Modify: `src/components/admin/AdminDashboard.tsx`
- Modify: `src/components/admin/AdminVoucherSummary.tsx`
- Modify: `src/components/admin/VoucherTable.tsx`
- Modify: `src/components/admin/VoucherForm.tsx`

**Interfaces:**
- Consumes: `listAllVouchers`, `redeemVoucher`, `Voucher`, `RecipientProfile`.
- Produces: Upgraded admin voucher dashboard with recipient filtering, code/ID column, expiration column, claim column, and "Mark as Redeemed" action.

- [ ] **Step 1: Update `VoucherForm.tsx`**

Auto-select first recipient if only 1 profile exists and none selected. Format expiration input to end-of-day ISO string.

- [ ] **Step 2: Update `VoucherTable.tsx`, `AdminVoucherSummary.tsx`, `AdminDashboard.tsx`**

Add recipient dropdown filter ("All Users", per-user filter). Add columns for Voucher Code (`#VOUCH-...`), Title, Type, Recipient, Status Badge, Sent Date, Claim Date, and Expiration Date. Add "Mark as Redeemed" action button for claimed vouchers.

- [ ] **Step 3: Run full test suite to verify**

Run: `pnpm test -- --run`
Expected: PASS

- [ ] **Step 4: Commit admin dashboard changes**

```bash
git add src/components/admin/
git commit -m "feat(admin): enhance VoucherTable with code/ID, expiry, per-user filtering, and redeem action"
```

---

### Task 5: End-to-End Verification & Walkthrough Document

**Files:**
- Create: `docs/superpowers/plans/walkthrough.md`

- [ ] **Step 1: Run full test suite**
Run: `pnpm test -- --run`
Expected: All tests PASS cleanly.

- [ ] **Step 2: Create walkthrough document**
Summarize fixes, test results, and complete workflow verification.
