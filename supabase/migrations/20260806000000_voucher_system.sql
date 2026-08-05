-- Migration: Secure Dynamic Voucher System
-- Tables: profiles, vouchers, voucher_activity
-- RLS policies, SECURITY DEFINER RPCs (is_admin, claim_voucher, mark_expired_vouchers, promote_admin),
-- Storage bucket 'vouchers', signup trigger to auto-create profiles + auto-promote admin,
-- Realtime publication registration.
-- Idempotent: safe to re-run.

BEGIN;

-- ============================================================================
-- 0. Reusable updated_at trigger function (create if missing)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$;

-- ============================================================================
-- 1. profiles table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT NOT NULL,
    display_name TEXT,
    role        TEXT NOT NULL DEFAULT 'user'
                CHECK (role IN ('admin', 'user')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- is_admin() must exist BEFORE policies that reference it are created (CREATE POLICY validates).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$;

-- Drop existing policies if any (idempotent re-run)
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_displayname" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;

-- SELECT: a user can read their own profile; admins can read all (recipient selector).
-- No INSERT/UPDATE/DELETE policies: rows are created by the SECURITY DEFINER signup trigger,
-- display_name is updated via the update_my_display_name RPC, and role is managed via promote_admin.
-- This intentionally blocks direct role-column writes (no privilege escalation path).
CREATE POLICY "profiles_select_own_or_admin"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.is_admin());

-- updated_at trigger
DROP TRIGGER IF EXISTS update_profiles_modtime ON public.profiles;
CREATE TRIGGER update_profiles_modtime
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 2. Helper RPCs (SECURITY DEFINER, locked search_path)
-- ============================================================================

-- Bootstrap helper: set admin_email in site_settings and promote matching profile.
-- Owner runs once in Supabase Studio SQL editor: select public.promote_admin('you@example.com');
CREATE OR REPLACE FUNCTION public.promote_admin(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_existing_admin_count INTEGER;
BEGIN
    p_email := lower(trim(p_email));
    IF p_email = '' THEN
        RAISE EXCEPTION 'promote_admin: email is required';
    END IF;

    -- Record the admin email in site_settings
    INSERT INTO public.site_settings (key, value)
    VALUES ('admin_email', p_email)
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

    -- Promote any existing profile with this email to admin.
    UPDATE public.profiles SET role = 'admin', updated_at = now()
    WHERE lower(email) = p_email;

    GET DIAGNOSTICS v_existing_admin_count = ROW_COUNT;

    -- If no profile exists yet, the auto-promote trigger on signup will set role='admin'
    -- when the admin user later signs up with this email (see set_admin_role_on_signup).
    RETURN TRUE;
END;
$$;

-- Narrow self-service RPC for display name only (role column is never writable by clients).
CREATE OR REPLACE FUNCTION public.update_my_display_name(p_display_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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

-- ============================================================================
-- 3. Auto-create profile on signup + auto-promote admin
-- ============================================================================

-- AFTER INSERT on auth.users -> create matching profiles row.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (NEW.id, COALESCE(NEW.email, ''), NEW.raw_user_meta_data->>'display_name')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- BEFORE INSERT on profiles: auto-admin if email matches site_settings.admin_email.
CREATE OR REPLACE FUNCTION public.set_admin_role_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin_email TEXT;
BEGIN
    SELECT lower(trim(value)) INTO v_admin_email
    FROM public.site_settings
    WHERE key = 'admin_email';

    IF v_admin_email IS NOT NULL AND v_admin_email <> '' AND lower(trim(NEW.email)) = v_admin_email THEN
        NEW.role := 'admin';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_admin_role_on_signup ON public.profiles;
CREATE TRIGGER trigger_set_admin_role_on_signup
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_admin_role_on_signup();

-- ============================================================================
-- 4. vouchers table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.vouchers (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title         TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 120),
    description   TEXT CHECK (length(description) <= 2000),
    voucher_type  TEXT NOT NULL CHECK (voucher_type IN ('nail','journal_leather','food','gift','custom')),
    image_url     TEXT,
    instructions  TEXT CHECK (length(instructions) <= 2000),
    status        TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft','available','claimed','expired','cancelled')),
    expires_at    TIMESTAMPTZ,   -- NULL = non-expiring
    sent_at       TIMESTAMPTZ,
    claimed_at    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_vouchers_recipient ON public.vouchers(recipient_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_status ON public.vouchers(status);
CREATE INDEX IF NOT EXISTS idx_vouchers_created_at ON public.vouchers(created_at DESC);

ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vouchers_select_admin_or_recipient" ON public.vouchers;
DROP POLICY IF EXISTS "vouchers_admin_write" ON public.vouchers;

-- SELECT: admin sees all; recipient sees only their own non-draft vouchers.
CREATE POLICY "vouchers_select_admin_or_recipient"
ON public.vouchers
FOR SELECT
TO authenticated
USING (
    public.is_admin()
    OR (recipient_id = auth.uid() AND status <> 'draft')
);

-- INSERT / UPDATE / DELETE: admin only.
CREATE POLICY "vouchers_admin_write"
ON public.vouchers
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS update_vouchers_modtime ON public.vouchers;
CREATE TRIGGER update_vouchers_modtime
BEFORE UPDATE ON public.vouchers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 5. voucher_activity table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.voucher_activity (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_id  UUID NOT NULL REFERENCES public.vouchers(id) ON DELETE CASCADE,
    user_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action      TEXT NOT NULL CHECK (action IN ('created','sent','edited','claimed','cancelled','expired','resend')),
    metadata    JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_voucher_activity_voucher ON public.voucher_activity(voucher_id);
CREATE INDEX IF NOT EXISTS idx_voucher_activity_created ON public.voucher_activity(created_at DESC);

ALTER TABLE public.voucher_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "voucher_activity_select_admin_or_recipient" ON public.voucher_activity;
DROP POLICY IF EXISTS "voucher_activity_admin_insert" ON public.voucher_activity;

-- SELECT: admin sees all; recipient sees activity for vouchers assigned to them.
CREATE POLICY "voucher_activity_select_admin_or_recipient"
ON public.voucher_activity
FOR SELECT
TO authenticated
USING (
    public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.vouchers v
        WHERE v.id = voucher_activity.voucher_id
          AND v.recipient_id = auth.uid()
    )
);

-- INSERT: admin only. (The claim_voucher RPC inserts the 'claimed' row as SECURITY DEFINER, bypassing RLS.)
CREATE POLICY "voucher_activity_admin_insert"
ON public.voucher_activity
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- ============================================================================
-- 6. Atomic claim RPC
-- ============================================================================
CREATE OR REPLACE FUNCTION public.claim_voucher(p_voucher_id UUID)
RETURNS TABLE(id UUID, claimed_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_updated INTEGER;
    v_claimed_at TIMESTAMPTZ;
    v_voucher_id UUID;
BEGIN
    -- Single guarded UPDATE = atomicity boundary. Concurrent calls cannot both succeed:
    -- once status flips to 'claimed', the WHERE clause no longer matches for the loser.
    UPDATE public.vouchers
       SET status = 'claimed',
           claimed_at = now(),
           updated_at = now()
     WHERE id = p_voucher_id
       AND recipient_id = auth.uid()
       AND status = 'available'
       AND (expires_at IS NULL OR expires_at > now())
    RETURNING public.vouchers.id, public.vouchers.claimed_at
      INTO v_voucher_id, v_claimed_at;

    GET DIAGNOSTICS v_updated = ROW_COUNT;

    IF v_updated = 0 THEN
        RAISE EXCEPTION 'claim_failed: voucher is not claimable (already claimed, expired, cancelled, not assigned to you, or does not exist)'
            USING ERRCODE = 'check_violation';
    END IF;

    -- Record activity as the claiming user.
    INSERT INTO public.voucher_activity (voucher_id, user_id, action, metadata)
    VALUES (v_voucher_id, auth.uid(), 'claimed',
            jsonb_build_object('claimed_at', v_claimed_at));

    id := v_voucher_id;
    claimed_at := v_claimed_at;

    RETURN NEXT;
END;
$$;

-- ============================================================================
-- 7. Mark expired vouchers (called by admin dashboard on load)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.mark_expired_vouchers()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER;
    v_row RECORD;
BEGIN
    -- Promote available vouchers whose expiry has passed to 'expired'.
    FOR v_row IN
        SELECT id FROM public.vouchers
        WHERE status = 'available' AND expires_at IS NOT NULL AND expires_at <= now()
    LOOP
        UPDATE public.vouchers SET status = 'expired', updated_at = now() WHERE id = v_row.id;
        INSERT INTO public.voucher_activity (voucher_id, action, metadata)
        VALUES (v_row.id, 'expired', jsonb_build_object('expired_at', now()));
        v_count := COALESCE(v_count, 0) + 1;
    END LOOP;

    RETURN COALESCE(v_count, 0);
END;
$$;

-- ============================================================================
-- 8. Storage bucket 'vouchers' (public read, admin write)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('vouchers', 'vouchers', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "vouchers_bucket_public_read" ON storage.objects;
CREATE POLICY "vouchers_bucket_public_read"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'vouchers');

DROP POLICY IF EXISTS "vouchers_bucket_admin_write" ON storage.objects;
CREATE POLICY "vouchers_bucket_admin_write"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vouchers' AND public.is_admin());

DROP POLICY IF EXISTS "vouchers_bucket_admin_update" ON storage.objects;
CREATE POLICY "vouchers_bucket_admin_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'vouchers' AND public.is_admin())
WITH CHECK (bucket_id = 'vouchers' AND public.is_admin());

DROP POLICY IF EXISTS "vouchers_bucket_admin_delete" ON storage.objects;
CREATE POLICY "vouchers_bucket_admin_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'vouchers' AND public.is_admin());

-- ============================================================================
-- 9. Realtime publication registration
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'vouchers'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.vouchers;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'voucher_activity'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.voucher_activity;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Realtime publication update skipped: %', SQLERRM;
END $$;

COMMIT;