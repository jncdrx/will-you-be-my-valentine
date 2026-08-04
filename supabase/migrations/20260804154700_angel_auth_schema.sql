-- Migration: Create angel_user_data table with RLS policies

CREATE TABLE IF NOT EXISTS public.angel_user_data (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    name TEXT DEFAULT 'my dearest baby angel',
    message TEXT,
    image_urls JSONB DEFAULT '[]'::jsonb,
    kissing_photo_url TEXT,
    ticket_claimed BOOLEAN DEFAULT false,
    current_step TEXT DEFAULT 'welcome',
    answers JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.angel_user_data ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Angel access own data" ON public.angel_user_data;
DROP POLICY IF EXISTS "Allow anon access fallback" ON public.angel_user_data;

-- Allow authenticated user full access to their own record
CREATE POLICY "Angel access own data"
ON public.angel_user_data
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow anon fallback if needed
CREATE POLICY "Allow anon access fallback"
ON public.angel_user_data
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_angel_user_data_modtime ON public.angel_user_data;
CREATE TRIGGER update_angel_user_data_modtime
BEFORE UPDATE ON public.angel_user_data
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
