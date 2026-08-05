-- Migration: Secure 5-attempt login limit + admin security logs
-- Tables/RPCs: login_attempts, check_login_lockout, record_login_attempt,
--             get_login_attempts, cleanup_old_login_attempts.
-- RLS: admin-only SELECT; writes only via SECURITY DEFINER RPCs (granted to service_role).
-- Idempotent: safe to re-run.

BEGIN;

-- ============================================================================
-- 0. Tunable constants (edit here to change policy)
-- ============================================================================
-- MAX_FAILED_ATTEMPTS        = 5   consecutive failures before lockout
-- LOCKOUT_WINDOW_MINUTES     = 15  how long an account stays locked
-- IP_RATE_LIMIT_THRESHOLD    = 10  failed attempts from one IP ...
-- IP_RATE_LIMIT_WINDOW_MINUTES = 10 ... within this window -> IP rate-limited
-- DEFAULT_RETENTION_DAYS     = 90  login-attempt records older than this are purged
-- ============================================================================

-- ============================================================================
-- 1. login_attempts table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.login_attempts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_identifier  TEXT NOT NULL,                       -- lowercased email
    role                TEXT NOT NULL CHECK (role IN ('admin','user')),
    attempt_status      TEXT NOT NULL CHECK (attempt_status IN ('success','failed','locked')),
    ip_address          TEXT,
    country             TEXT,
    region              TEXT,
    city                TEXT,
    device_type         TEXT,                               -- desktop/mobile/tablet/other
    os                  TEXT,
    browser             TEXT,
    browser_version     TEXT,
    user_agent          TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier_time
    ON public.login_attempts(account_identifier, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time
    ON public.login_attempts(ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created
    ON public.login_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_status
    ON public.login_attempts(attempt_status);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- SELECT: admin only. No INSERT/UPDATE/DELETE policies -> anon/authenticated cannot write
-- directly. Writes happen via the SECURITY DEFINER RPCs (granted to service_role) or the
-- service role (edge function), both of which bypass RLS.
DROP POLICY IF EXISTS "login_attempts_admin_select" ON public.login_attempts;
CREATE POLICY "login_attempts_admin_select"
ON public.login_attempts
FOR SELECT
TO authenticated
USING (public.is_admin());

-- ============================================================================
-- 2. Lockout computation helper (shared by check + record)
-- Returns JSONB: { locked, locked_until, attempts_remaining, reason }
-- ============================================================================
CREATE OR REPLACE FUNCTION public._compute_lockout(p_identifier TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    rec            RECORD;
    era_fails      TIMESTAMPTZ[] := '{}';  -- failure timestamps, oldest -> newest
    n              INT;
    full_rounds    INT;     -- complete groups of 5 in the current era
    remainder      INT;     -- failures in the current (incomplete) round
    anchor         TIMESTAMPTZ;  -- timestamp of the failure that triggered the most recent lockout
    locked_until   TIMESTAMPTZ;
BEGIN
    -- Walk most-recent rows for this identifier; collect the trailing run of consecutive
    -- 'failed' rows (a 'success' or 'locked' row breaks the run). era_fails ends up
    -- oldest -> newest because we prepend each older timestamp as we walk back.
    FOR rec IN
        SELECT attempt_status, created_at
        FROM public.login_attempts
        WHERE account_identifier = lower(trim(p_identifier))
        ORDER BY created_at DESC
        LIMIT 200
    LOOP
        IF rec.attempt_status = 'failed' THEN
            era_fails := array_prepend(rec.created_at, era_fails);
        ELSE
            EXIT;
        END IF;
    END LOOP;

    n := COALESCE(array_length(era_fails, 1), 0);
    IF n = 0 THEN
        RETURN jsonb_build_object(
            'locked', false, 'locked_until', null,
            'attempts_remaining', 5, 'reason', null
        );
    END IF;

    -- Model: every 5 consecutive failures trigger a 15-minute lockout; after that
    -- window expires the counter resets (fresh 5 attempts). This is computed purely
    -- from timestamps so it resets correctly even if the user never attempted to log
    -- in during the lockout (no 'locked' rows were logged).
    full_rounds := n / 5;
    remainder   := n % 5;

    IF full_rounds >= 1 THEN
        -- The 5th failure of the most recent complete round (oldest->newest index 5*full_rounds).
        anchor := era_fails[5 * full_rounds];
        locked_until := anchor + (15 * interval '1 minute');
        IF now() < locked_until THEN
            RETURN jsonb_build_object(
                'locked', true,
                'locked_until', to_jsonb(locked_until),
                'attempts_remaining', 0,
                'reason', 'account'
            );
        END IF;
        -- Lockout expired: the current round is whatever `remainder` failures came after it.
        RETURN jsonb_build_object(
            'locked', false, 'locked_until', null,
            'attempts_remaining', GREATEST(0, 5 - remainder),
            'reason', null
        );
    END IF;

    -- Fewer than 5 failures in the current era.
    RETURN jsonb_build_object(
        'locked', false, 'locked_until', null,
        'attempts_remaining', GREATEST(0, 5 - n),
        'reason', null
    );
END;
$$;

-- ============================================================================
-- 3. check_login_lockout(p_identifier, p_ip) -> JSONB
--    Called by the edge function BEFORE attempting a password login.
--    Combines account lockout + IP rate limit. Never reveals email existence.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.check_login_lockout(p_identifier TEXT, p_ip TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result       JSONB;
    v_ip_fails     INT := 0;
BEGIN
    -- Account-level lockout.
    v_result := public._compute_lockout(p_identifier);
    IF (v_result->>'locked')::boolean THEN
        RETURN v_result;
    END IF;

    -- IP-level rate limit: > 10 failed attempts from this IP in the last 10 minutes.
    IF p_ip IS NOT NULL AND p_ip <> '' AND p_ip <> 'unknown' THEN
        SELECT count(*) INTO v_ip_fails
        FROM public.login_attempts
        WHERE ip_address = p_ip
          AND attempt_status = 'failed'
          AND created_at > now() - (10 * interval '1 minute');

        IF v_ip_fails > 10 THEN
            RETURN jsonb_build_object(
                'locked', true,
                'locked_until', to_jsonb(now() + (15 * interval '1 minute')),
                'attempts_remaining', 0,
                'reason', 'ip_rate_limited'
            );
        END IF;
    END IF;

    RETURN v_result;
END;
$$;

-- ============================================================================
-- 4. record_login_attempt(...) -> JSONB
--    Called by the edge function AFTER the password grant. Inserts the row and
--    returns the updated lockout state. A 'success' row naturally resets the
--    consecutive-failure counter (the walk stops at the first success).
-- ============================================================================
CREATE OR REPLACE FUNCTION public.record_login_attempt(
    p_identifier      TEXT,
    p_role            TEXT,
    p_status          TEXT,
    p_ip              TEXT,
    p_country         TEXT,
    p_region          TEXT,
    p_city            TEXT,
    p_device          TEXT,
    p_os              TEXT,
    p_browser         TEXT,
    p_browser_version TEXT,
    p_user_agent      TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_role NOT IN ('admin','user') THEN
        RAISE EXCEPTION 'record_login_attempt: invalid role %', p_role;
    END IF;
    IF p_status NOT IN ('success','failed','locked') THEN
        RAISE EXCEPTION 'record_login_attempt: invalid status %', p_status;
    END IF;

    INSERT INTO public.login_attempts (
        account_identifier, role, attempt_status,
        ip_address, country, region, city,
        device_type, os, browser, browser_version, user_agent
    ) VALUES (
        lower(trim(p_identifier)), p_role, p_status,
        p_ip, p_country, p_region, p_city,
        p_device, p_os, p_browser, p_browser_version, left(p_user_agent, 1024)
    );

    RETURN public._compute_lockout(p_identifier);
END;
$$;

-- ============================================================================
-- 5. get_login_attempts(p_filters JSONB, p_limit INT, p_offset INT) -> JSONB
--    Admin-only viewer query. Asserts is_admin(); supports filtering + paging.
--    Filters (all optional JSONB keys): status, account, date_from, date_to,
--    location, device, browser.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_login_attempts(
    p_filters JSONB DEFAULT '{}'::jsonb,
    p_limit   INT DEFAULT 50,
    p_offset  INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- ============================================================================
-- 6. cleanup_old_login_attempts(p_days INT default null) -> INTEGER
--    Deletes login-attempt records older than the retention window. p_days null
--    => read site_settings.login_retention_days (default 90). Returns delete count.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts(p_days INT DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_days   INT;
    v_count  INT;
BEGIN
    IF p_days IS NULL THEN
        SELECT value::int INTO v_days
        FROM public.site_settings
        WHERE key = 'login_retention_days';
    ELSE
        v_days := p_days;
    END IF;
    IF v_days IS NULL OR v_days < 0 THEN
        v_days := 90;
    END IF;

    DELETE FROM public.login_attempts
    WHERE created_at < now() - (v_days * interval '1 day');
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

-- ============================================================================
-- 7. site_settings defaults
-- ============================================================================
INSERT INTO public.site_settings (key, value)
VALUES ('login_retention_days', '90')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- 8. Grants: lockout/record/cleanup only callable by service_role (edge function);
--    get_login_attempts callable by authenticated (admin check is internal).
-- ============================================================================
REVOKE EXECUTE ON FUNCTION public.check_login_lockout(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_login_attempt(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_login_attempts(INT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public._compute_lockout(TEXT) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.check_login_lockout(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_login_attempt(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_login_attempts(INT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_login_attempts(JSONB, INT, INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_login_attempts(JSONB, INT, INT) TO authenticated;

-- ============================================================================
-- 9. pg_cron schedule (only if the extension exists on this project)
-- ============================================================================
DO $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
    ) INTO v_exists;

    IF v_exists THEN
        IF NOT EXISTS (
            SELECT 1 FROM cron.job
            WHERE jobname = 'cleanup_login_attempts'
        ) THEN
            PERFORM cron.schedule(
                'cleanup_login_attempts',
                '0 3 * * *',
                'select public.cleanup_old_login_attempts(null);'
            );
        END IF;
    ELSE
        RAISE NOTICE 'pg_cron not installed; login-attempt retention will run on demand or via the admin endpoint.';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron scheduling skipped: %', SQLERRM;
END $$;

COMMIT;