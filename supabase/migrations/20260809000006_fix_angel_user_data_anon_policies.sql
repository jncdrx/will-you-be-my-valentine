-- Migration: Fix multiple permissive policies for anon on public.angel_user_data
-- Drops duplicate "Allow anon read fallback" policy and cleans up public.angel_user_data RLS policies.

BEGIN;

DROP POLICY IF EXISTS "Allow anon access fallback" ON public.angel_user_data;
DROP POLICY IF EXISTS "Allow anon read fallback" ON public.angel_user_data;

CREATE POLICY "Allow anon access fallback"
ON public.angel_user_data
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

COMMIT;
