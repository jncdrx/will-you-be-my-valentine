-- Migration: Configure site_settings for allowed email verification

CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

ALTER TABLE public.angel_user_data ALTER COLUMN email DROP DEFAULT;

-- Update RLS Policy
DROP POLICY IF EXISTS "Angel access own data" ON public.angel_user_data;

CREATE POLICY "Angel access own data"
ON public.angel_user_data
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
