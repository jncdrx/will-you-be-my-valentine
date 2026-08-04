-- Migration: Create songs table and update angel_user_data table

CREATE TABLE IF NOT EXISTS public.songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    youtube_url TEXT UNIQUE,
    thumbnail_url TEXT,
    mp3_url TEXT NOT NULL,
    duration INTEGER NOT NULL,
    is_custom_upload BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_songs_title ON public.songs USING gin (to_tsvector('english', title));

ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read songs" ON public.songs;
CREATE POLICY "Allow public read songs" ON public.songs FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow admin full access to songs" ON public.songs;
CREATE POLICY "Allow admin full access to songs" ON public.songs FOR ALL TO authenticated USING (true);

-- Add selected_song_id column to angel_user_data
ALTER TABLE public.angel_user_data ADD COLUMN IF NOT EXISTS selected_song_id UUID REFERENCES public.songs(id);

-- Storage bucket initialization
INSERT INTO storage.buckets (id, name, public) 
VALUES ('songs', 'songs', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow public read songs files" ON storage.objects;
CREATE POLICY "Allow public read songs files" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'songs');

DROP POLICY IF EXISTS "Allow admin upload songs files" ON storage.objects;
CREATE POLICY "Allow admin upload songs files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'songs');

DROP POLICY IF EXISTS "Allow admin delete songs files" ON storage.objects;
CREATE POLICY "Allow admin delete songs files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'songs');
