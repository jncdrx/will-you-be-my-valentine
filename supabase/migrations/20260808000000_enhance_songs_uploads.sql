-- Migration: Enhance songs for cloud uploads, metadata, and admin-only storage writes

BEGIN;

ALTER TABLE public.songs
    ADD COLUMN IF NOT EXISTS file_name TEXT,
    ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT,
    ADD COLUMN IF NOT EXISTS audio_duration_seconds INTEGER,
    ADD COLUMN IF NOT EXISTS cloud_file_url TEXT,
    ADD COLUMN IF NOT EXISTS upload_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS storage_path TEXT,
    ADD COLUMN IF NOT EXISTS file_hash TEXT,
    ADD COLUMN IF NOT EXISTS mime_type TEXT;

UPDATE public.songs
SET
    cloud_file_url = COALESCE(cloud_file_url, mp3_url),
    audio_duration_seconds = COALESCE(audio_duration_seconds, duration),
    upload_date = COALESCE(upload_date, created_at)
WHERE cloud_file_url IS NULL
   OR audio_duration_seconds IS NULL
   OR upload_date IS NULL;

ALTER TABLE public.songs
    ALTER COLUMN upload_date SET DEFAULT timezone('utc'::text, now());

CREATE INDEX IF NOT EXISTS idx_songs_file_hash ON public.songs (file_hash);
CREATE INDEX IF NOT EXISTS idx_songs_upload_date ON public.songs (upload_date DESC);

ALTER TABLE public.songs DROP CONSTRAINT IF EXISTS songs_file_hash_key;
ALTER TABLE public.songs ADD CONSTRAINT songs_file_hash_key UNIQUE (file_hash);

DROP POLICY IF EXISTS "Allow public read songs" ON public.songs;
DROP POLICY IF EXISTS "Allow admin full access to songs" ON public.songs;
DROP POLICY IF EXISTS "songs_public_read" ON public.songs;
DROP POLICY IF EXISTS "songs_admin_write" ON public.songs;

CREATE POLICY "songs_public_read"
ON public.songs
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "songs_admin_write"
ON public.songs
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

INSERT INTO storage.buckets (id, name, public)
VALUES ('songs', 'songs', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Allow public read songs files" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin upload songs files" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin delete songs files" ON storage.objects;
DROP POLICY IF EXISTS "songs_bucket_public_read" ON storage.objects;
DROP POLICY IF EXISTS "songs_bucket_admin_write" ON storage.objects;
DROP POLICY IF EXISTS "songs_bucket_admin_update" ON storage.objects;
DROP POLICY IF EXISTS "songs_bucket_admin_delete" ON storage.objects;

CREATE POLICY "songs_bucket_public_read"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'songs');

CREATE POLICY "songs_bucket_admin_write"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'songs' AND public.is_admin());

CREATE POLICY "songs_bucket_admin_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'songs' AND public.is_admin())
WITH CHECK (bucket_id = 'songs' AND public.is_admin());

CREATE POLICY "songs_bucket_admin_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'songs' AND public.is_admin());

COMMIT;
