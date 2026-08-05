-- Manual SQL assertions for the login lockout RPCs.
-- Run in Supabase Studio → SQL Editor against your project after applying the migration
-- 20260807000000_login_security.sql.
--
-- These RPCs are SECURITY DEFINER and granted to service_role only, so you must invoke
-- them as the service role (e.g. from the secure-login edge function, or from SQL Editor
-- using the service_role key bypass). In SQL Editor (which runs as the postgres owner,
-- a superuser) these calls work directly.
--
-- This is a sequence of assertions, not a unit framework. Run them top-to-bottom.

-- Setup: a throwaway identifier and IP for testing.
\set test_id   '''tester-login-lockout@example.com'''
\set test_ip   '''203.0.113.42'''

-- 0. Clean slate for this identifier (only safe in a test run).
delete from public.login_attempts where account_identifier = :test_id;

-- 1. Fresh account -> not locked, 5 attempts remaining.
select public.check_login_lockout(:test_id, :test_ip)->>'locked'           as locked,           -- expected: false
       public.check_login_lockout(:test_id, :test_ip)->>'attempts_remaining' as remaining;        -- expected: 5

-- 2. Record 4 consecutive failed attempts. After each, attempts_remaining should decrease.
--    (Run the next line 4 times, or loop.)
do $$
declare i int;
begin
  for i in 1..4 loop
    perform public.record_login_attempt(:test_id, 'user', 'failed', :test_ip, 'Testland', 'TR', 'Testville', 'desktop', 'Windows 10/11', 'Chrome', '124.0.0.0', 'UA');
  end loop;
end $$;

select public.check_login_lockout(:test_id, :test_ip)->>'locked'           as locked_after_4,   -- expected: false
       public.check_login_lockout(:test_id, :test_ip)->>'attempts_remaining' as remaining_after_4; -- expected: 1

-- 3. The 5th failure triggers a lockout. record_login_attempt returns locked=true.
select public.record_login_attempt(:test_id, 'user', 'failed', :test_ip, 'Testland', 'TR', 'Testville', 'desktop', 'Windows 10/11', 'Chrome', '124.0.0.0', 'UA')->>'locked' as locked_on_5th; -- expected: true

-- 4. While locked, check_login_lockout stays locked with 0 remaining.
select public.check_login_lockout(:test_id, :test_ip)->>'locked'           as locked_while_locked,  -- expected: true
       public.check_login_lockout(:test_id, :test_ip)->>'attempts_remaining' as remaining_while_locked; -- expected: 0

-- 5. A successful login resets the counter (the walk stops at the first success).
select public.record_login_attempt(:test_id, 'user', 'success', :test_ip, 'Testland', 'TR', 'Testville', 'desktop', 'Windows 10/11', 'Chrome', '124.0.0.0', 'UA')->>'attempts_remaining' as remaining_after_success; -- expected: 5

-- 6. Two more failures should leave 3 remaining (counter restarted from success).
do $$
declare i int;
begin
  for i in 1..2 loop
    perform public.record_login_attempt(:test_id, 'user', 'failed', :test_ip, 'Testland', 'TR', 'Testville', 'desktop', 'Windows 10/11', 'Chrome', '124.0.0.0', 'UA');
  end loop;
end $$;
select public.check_login_lockout(:test_id, :test_ip)->>'attempts_remaining' as remaining_after_2; -- expected: 3

-- 7. Lockout-expiry simulation: backdate the 5 most recent failures so the 15-min window passed.
--    First push 5 fresh failures to trigger a lockout.
delete from public.login_attempts where account_identifier = :test_id;
do $$
declare i int;
begin
  for i in 1..5 loop
    perform public.record_login_attempt(:test_id, 'user', 'failed', :test_ip, 'Testland', 'TR', 'Testville', 'desktop', 'Windows 10/11', 'Chrome', '124.0.0.0', 'UA');
  end loop;
end $$;
-- Confirm locked.
select public.check_login_lockout(:test_id, :test_ip)->>'locked' as locked_before_backdate; -- expected: true
-- Backdate ALL failures for this id to 20 minutes ago (older than the 15-min window).
update public.login_attempts
   set created_at = now() - interval '20 minutes'
 where account_identifier = :test_id and attempt_status = 'failed';
-- Now the lockout window has expired -> not locked, 5 remaining.
select public.check_login_lockout(:test_id, :test_ip)->>'locked'           as locked_after_backdate,  -- expected: false
       public.check_login_lockout(:test_id, :test_ip)->>'attempts_remaining' as remaining_after_backdate; -- expected: 5

-- 8. IP rate limit: >10 failed attempts from the same IP (any accounts) within 10 min locks by IP.
--    Use a different identifier so the account itself is not already locked.
\set other_id  '''other-account@example.com'''
\set rate_ip   '''198.51.100.7'''
delete from public.login_attempts where ip_address = :rate_ip;
do $$
declare i int;
begin
  for i in 1..11 loop
    -- alternate identifiers so no single account hits 5 first
    perform public.record_login_attempt('acct' || i || '@example.com', 'user', 'failed', :rate_ip, 'X', 'X', 'X', 'desktop', 'Windows', 'Chrome', '1', 'UA');
  end loop;
end $$;
select public.check_login_lockout('fresh-account@example.com', :rate_ip)->>'locked' as locked_by_ip,  -- expected: true
       public.check_login_lockout('fresh-account@example.com', :rate_ip)->>'reason' as lock_reason;  -- expected: ip_rate_limited

-- 9. Retention cleanup deletes old rows. p_days=0 removes everything older than today.
--    (Insert a row dated 100 days ago first.)
insert into public.login_attempts (account_identifier, role, attempt_status, created_at)
values ('old-retention@example.com', 'user', 'failed', now() - interval '100 days');
select public.cleanup_old_login_attempts(0);  -- expected: >=1 (deletes the 100-day-old row, and possibly others if any are < now()-0)
-- Confirm the 100-day-old row is gone.
select count(*) as gone from public.login_attempts where account_identifier = 'old-retention@example.com'; -- expected: 0

-- 10. RLS: a non-admin (anon/authenticated) cannot SELECT login_attempts and cannot call
--     the service-role-only RPCs. From the browser anon key, these should return
--     permission denied / 404:
--       supabase.rpc('check_login_lockout', { p_identifier, p_ip })  -> error
--       supabase.rpc('record_login_attempt', {...})                   -> error
--       supabase.from('login_attempts').select('*')                   -> empty / blocked
--     The admin-only get_login_attempts RPC works for an authenticated admin session.

-- Cleanup (optional, comment out to inspect rows after the run).
-- delete from public.login_attempts where account_identifier in (:test_id, 'old-retention@example.com') or ip_address = :rate_ip;