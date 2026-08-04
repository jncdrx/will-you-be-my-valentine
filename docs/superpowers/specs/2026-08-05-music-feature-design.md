# Music Feature Design Specification

**Date**: 2026-08-05  
**Topic**: Music Selection & YouTube-to-MP3 Authorized Audio System  
**Status**: Approved / Draft for Implementation  

---

## 1. Overview
The Music Feature adds an authorized, end-to-end music management and playback system to the website. 

It enables:
- **Admin**: Paste YouTube links or directly upload MP3 files with rights authorization. A secure backend service converts YouTube videos to standard MP3, extracts metadata (title, artist, thumbnail, duration), uploads files to Supabase Storage, and stores record information in Supabase PostgreSQL while enforcing rate limits, duplicate checks, and server credential secrecy.
- **User**: Search, preview, and select songs from a responsive UI modal. The selected song persists in Supabase DB per user session across page reloads. Audio playback includes play, pause, restart, volume slider, equalizer visualizer, and strict compliance with browser user-interaction rules (no autoplay without user gesture).

---

## 2. System Architecture

```
[ Admin UI (React) ] ──(SSE / Multipart POST)──► [ Express Backend API / Vite Server ]
                                                        │
                                                        ├── 1. Validate YouTube URL / Admin Token / Permission Checkbox
                                                        ├── 2. Rate Limit & Check DB for Duplicates (`youtube_url`)
                                                        ├── 3. Extract Audio & Metadata via ytdl-core / yt-dlp
                                                        ├── 4. Convert stream to 128kbps MP3 via ffmpeg
                                                        ├── 5. Upload MP3 + Thumbnail to Supabase Storage (`songs` bucket)
                                                        └── 6. Write Record to Supabase DB (`songs` table)
                                                                 │
                                                                 ▼
[ User UI (React) ] ◄──(Fetch Songs & Selection)──── [ Supabase PostgreSQL & Storage ]
```

---

## 3. Backend API Endpoints & Server Middleware

### 3.1 `GET /api/music/convert` (SSE Stream)
- **QueryParams**: `url` (encoded YouTube URL), `token` (admin auth session token).
- **Rate Limit**: Maximum 5 conversion requests per 10 minutes per IP address.
- **Real-Time Progress Event Flow**:
  1. `Checking link`: Validates URL regex format (`youtube.com/watch?v=...` or `youtu.be/...`). Checks `public.songs` table for existing `youtube_url`. If found, emits `Failed` event with "This YouTube video has already been converted and added."
  2. `Downloading authorized audio`: Streams YouTube audio data and metadata (title, author/channel, thumbnail, duration).
  3. `Converting to MP3`: Transcodes audio stream into standard 128kbps stereo MP3 using `fluent-ffmpeg` / `ffmpeg-static`.
  4. `Uploading`: Uploads MP3 file and thumbnail image to Supabase Storage bucket `songs` (`mp3s/<uuid>.mp3` and `thumbnails/<uuid>.jpg`) using Supabase Service Role Key.
  5. `Completed`: Inserts new song record into `public.songs` table. Emits `Completed` SSE payload with full song object.
  6. `Failed`: Emits structured error object on any exception (invalid URL, network error, file size > 15MB).

### 3.2 `POST /api/music/upload` (Direct MP3 Upload)
- **Form Data**: `file` (MP3 file, max 15MB), `title`, `artist`, `token`, `permissionConfirmed` (boolean).
- **Validation**: Enforces MIME type `audio/mpeg` and 15MB file size limit.
- **Processing**: Extracts duration using `music-metadata`, uploads MP3 and default or extracted artwork to Supabase Storage `songs` bucket, and saves record to DB with `is_custom_upload = true`.

### 3.3 `POST /api/music/select`
- **Body**: `{ song_id: string, user_id?: string }`
- **Action**: Updates `angel_user_data.selected_song_id` in Supabase PostgreSQL and returns updated user state.

---

## 4. Database Schema & Supabase Storage

### 4.1 SQL Migration (`supabase/migrations/20260805000000_create_songs_table.sql`)
```sql
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

CREATE POLICY "Allow public read songs" ON public.songs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow admin full access to songs" ON public.songs FOR ALL TO authenticated USING (true);

ALTER TABLE public.angel_user_data ADD COLUMN IF NOT EXISTS selected_song_id UUID REFERENCES public.songs(id);
```

### 4.2 Supabase Storage Bucket (`songs`)
- Public access: `true`
- Policies:
  - `Allow public read song files`: `FOR SELECT TO anon, authenticated USING (bucket_id = 'songs')`
  - `Allow admin upload song files`: `FOR INSERT TO authenticated WITH CHECK (bucket_id = 'songs')`
  - `Allow admin delete song files`: `FOR DELETE TO authenticated USING (bucket_id = 'songs')`

---

## 5. Admin UI Components & Progress Visualizer

Located in `src/components/AdminView.tsx` under **Music Manager**:
1. **YouTube Conversion Input**:
   - URL field with real-time validation.
   - Checkbox: *"I confirm I own or have permission to use this content."* (Mandatory).
   - "Convert & Add Song" button.
2. **Direct MP3 Upload Form**:
   - File selector / drag-and-drop (.mp3, max 15MB).
   - Mandatory permission checkbox.
3. **6-State Real-Time Progress Tracker**:
   - 🔍 `Checking link`
   - 📥 `Downloading authorized audio`
   - ⚙️ `Converting to MP3`
   - ☁️ `Uploading`
   - ✅ `Completed`
   - ⚠️ `Failed`
4. **Song Management Table**:
   - Lists all songs with thumbnail, title, artist, duration, YouTube link, date added, and Delete button.

---

## 6. User Music Selector & Enhanced Player

1. **Music Selector Modal (`src/components/MusicSelectorModal.tsx`)**:
   - Search bar filtering by title or artist.
   - Song card list with thumbnail, title, artist, duration.
   - Active selected song highlighted with a glowing rose-pink border and "Selected" badge.
   - Preview button (plays 10s audio sample).
   - Select button (sets active song and persists `selected_song_id` in Supabase DB).
2. **Floating Music Player (`src/components/MusicPlayer.tsx`)**:
   - Controls: Play/Pause, Restart (0s reset), Volume Slider (0-100% with Mute toggle).
   - Display: Active song title, artist, animated equalizer visualizer.
   - No Autoplay: Listens for user gesture (`click` / `pointerdown`) before auto-starting audio.

---

## 7. Verification & Testing Plan
1. **Database Migration & Storage**: Run migration, verify bucket creation & RLS policies.
2. **Backend API Tests**:
   - Test YouTube link conversion with progress states.
   - Test duplicate YouTube URL rejection.
   - Test direct MP3 upload with >15MB rejection & valid upload.
   - Test rate limiting (>5 requests/10 min).
3. **Admin UI Tests**: Verify conversion UI state transitions, permission checkbox requirement, and deletion.
4. **User Music UI Tests**: Verify search filtering, preview snippet, selection persistence across page reload, and player controls (play, pause, restart, volume).
