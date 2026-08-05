-- Manual SQL assertions for the claim_voucher RPC.
-- Run in Supabase Studio → SQL Editor against your project after applying the migration
-- and creating at least one recipient user + a voucher for them.
-- These are assertions, not a unit framework; adjust the placeholder IDs below.

-- Setup placeholders — REPLACE these with real IDs from your project:
--   :recipient_id   UUID of a recipient (auth user / profiles.id)
--   :voucher_id     UUID of an 'available' voucher assigned to that recipient
--   :other_user_id   UUID of a different user

\set recipient_id '''00000000-0000-0000-0000-000000000000'''
\set voucher_id   '''00000000-0000-0000-0000-000000000001'''
\set other_user_id '''00000000-0000-0000-0000-000000000002'''

-- 1. Atomicity: two concurrent claims cannot both succeed.
--    Run the two statements below in parallel (two SQL Editor tabs) while signed in as the
--    recipient. Exactly one should return a row; the other should raise claim_failed.
--    (In a single session this serializes, so it just verifies the happy path.)
--    select * from public.claim_voucher(:voucher_id);

-- 2. Re-claiming an already-claimed voucher fails.
--    After a successful claim, re-running must raise claim_failed:
--    select * from public.claim_voucher(:voucher_id);  -- expected: ERROR claim_failed

-- 3. A different user cannot claim a voucher not assigned to them.
--    Sign in as :other_user_id, then:
--    select * from public.claim_voucher(:voucher_id);  -- expected: ERROR claim_failed

-- 4. Expired voucher cannot be claimed.
--    Set up an available voucher with expires_at in the past:
--    update public.vouchers set status='available', expires_at = now() - interval '1 day'
--      where id = :voucher_id;
--    Then claim as the recipient:
--    select * from public.claim_voucher(:voucher_id);  -- expected: ERROR claim_failed

-- 5. Cancelled voucher cannot be claimed.
--    update public.vouchers set status='cancelled' where id = :voucher_id;
--    select * from public.claim_voucher(:voucher_id);  -- expected: ERROR claim_failed

-- 6. Successful claim records activity.
--    After a successful claim, a 'claimed' row must exist:
--    select count(*) from public.voucher_activity
--      where voucher_id = :voucher_id and action = 'claimed';  -- expected: 1

-- 7. mark_expired_vouchers promotes overdue available vouchers to 'expired'.
--    select public.mark_expired_vouchers();
--    select count(*) from public.vouchers
--      where status = 'expired';  -- expected: >= 1 if any overdue available voucher existed

-- 8. RLS: a recipient can only SELECT their own non-draft vouchers.
--    Sign in as the recipient:
--    select id, status from public.vouchers;  -- expected: only rows where recipient_id = auth.uid()