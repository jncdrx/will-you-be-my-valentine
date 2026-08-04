-- 7th Monthsary Surprise Website - Supabase Database Schema & Storage Setup

-- 1. Create Table for Monthsary Responses
CREATE TABLE IF NOT EXISTS public.monthsary_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    message TEXT NOT NULL,
    image_urls JSONB DEFAULT '[]'::jsonb,
    response_token TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'new',
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_monthsary_responses_token ON public.monthsary_responses(response_token);

-- Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_monthsary_responses_modtime
BEFORE UPDATE ON public.monthsary_responses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Row Level Security (RLS) Configuration
ALTER TABLE public.monthsary_responses ENABLE ROW LEVEL SECURITY;

-- Anonymous visitors can insert their response
CREATE POLICY "Allow public visitor insert response" 
ON public.monthsary_responses 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Anonymous visitors can read their own response via token lookup
CREATE POLICY "Allow visitor read response by token" 
ON public.monthsary_responses 
FOR SELECT 
TO anon
USING (response_token IS NOT NULL);

-- Authenticated Admin can perform all operations (SELECT, UPDATE, DELETE)
CREATE POLICY "Allow admin full access to responses" 
ON public.monthsary_responses 
FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- 3. Storage Bucket Setup for Reaction Photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('monthsary-reactions', 'monthsary-reactions', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Allow public to upload reaction images
CREATE POLICY "Allow public upload reaction images" 
ON storage.objects 
FOR INSERT 
TO anon, authenticated
WITH CHECK (bucket_id = 'monthsary-reactions');

-- Storage Policy: Allow public to read reaction images
CREATE POLICY "Allow public read reaction images" 
ON storage.objects 
FOR SELECT 
TO anon, authenticated
USING (bucket_id = 'monthsary-reactions');

-- Storage Policy: Allow authenticated admin to delete reaction images
CREATE POLICY "Allow admin delete reaction images" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'monthsary-reactions');

-- 4. Create Table for Site Settings (Password Protection)
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to site_settings
CREATE POLICY "Allow public read site_settings"
ON public.site_settings
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow authenticated admin write access to site_settings
CREATE POLICY "Allow admin write site_settings"
ON public.site_settings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Seed initial password '1426'
INSERT INTO public.site_settings (key, value)
VALUES ('access_password', '1426')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Optional RPC helper function for site password verification
CREATE OR REPLACE FUNCTION verify_site_password(input_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.site_settings
        WHERE key = 'access_password' AND value = input_password
    );
END;
$$;

