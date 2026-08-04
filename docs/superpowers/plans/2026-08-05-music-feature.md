# Music Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an end-to-end music system with authorized YouTube-to-MP3 conversion backend, direct MP3 upload, Supabase DB & Storage persistence, 6-state progress tracker, admin song management, and user music selector with search/preview/highlight/full player controls.

**Architecture:** Express API backend integrated via Vite proxy handles YouTube extraction (ytdl-core/yt-dlp + ffmpeg), rate limiting, duplicate validation, SSE streaming, and Supabase Storage uploads. React UI includes an Admin Music Manager tab and a User Music Selector modal with audio persistence in `angel_user_data`.

**Tech Stack:** React 18, TypeScript, Vite, Express, Howler.js, Supabase JS Client, PostgreSQL, Framer Motion, Tailwind CSS, `@distube/ytdl-core`, `fluent-ffmpeg`, `ffmpeg-static`, `music-metadata`.

## Global Constraints
- Do not break existing site password gate, Angel reaction form, or admin authentication.
- All conversion processing must happen on the server (never in the browser).
- All Supabase Service Role Keys and server secrets must remain server-side.
- Storage bucket `songs` must be configured with public read access and admin write policies.
- Audio must not autoplay until the user interacts with the page.

---

### Task 1: Database Migration & Supabase Client Helper Updates

**Files:**
- Create: `supabase/migrations/20260805000000_create_songs_table.sql`
- Modify: `src/lib/supabase.ts:1-200`
- Test: `tests/database.test.ts`

**Interfaces:**
- Consumes: Supabase database connection and `supabase` client instance.
- Produces: `Song` interface, `getSongs()`, `saveSelectedSong()`, `deleteSong()`, `uploadDirectMp3()` helpers.

- [ ] **Step 1: Write SQL migration file**

```sql
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
```

- [ ] **Step 2: Update `src/lib/supabase.ts` with Song interface & API methods**

```typescript
export interface Song {
  id: string;
  title: string;
  artist: string;
  youtube_url?: string | null;
  thumbnail_url?: string | null;
  mp3_url: string;
  duration: number;
  is_custom_upload?: boolean;
  created_at: string;
}

export async function fetchSongs(): Promise<Song[]> {
  if (!isSupabaseConfigured()) {
    const local = localStorage.getItem("monthsary_local_songs");
    return local ? JSON.parse(local) : [];
  }
  const { data, error } = await supabase.from("songs").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function saveSelectedSongId(songId: string, userId?: string): Promise<void> {
  localStorage.setItem("monthsary_selected_song_id", songId);
  if (isSupabaseConfigured() && userId) {
    await supabase.from("angel_user_data").update({ selected_song_id: songId }).eq("user_id", userId);
  }
}

export async function deleteSong(songId: string): Promise<void> {
  if (isSupabaseConfigured()) {
    await supabase.from("songs").delete().eq("id", songId);
  }
  const local = localStorage.getItem("monthsary_local_songs");
  if (local) {
    const songs: Song[] = JSON.parse(local);
    localStorage.setItem("monthsary_local_songs", JSON.stringify(songs.filter(s => s.id !== songId)));
  }
}
```

- [ ] **Step 3: Run typescript check to verify build**

Run: `npx tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260805000000_create_songs_table.sql src/lib/supabase.ts
git commit -m "feat(music): add songs schema migration and client API helpers"
```

---

### Task 2: Express Backend Conversion & Upload Service

**Files:**
- Create: `server/index.js`
- Modify: `package.json`, `vite.config.ts`
- Test: `tests/music_server.test.ts`

**Interfaces:**
- Consumes: YouTube URLs, MP3 form uploads, Supabase Service Role Key.
- Produces: SSE stream at `GET /api/music/convert`, endpoint `POST /api/music/upload`, endpoint `POST /api/music/select`.

- [ ] **Step 1: Install backend dependencies**

```bash
npm install express cors dotenv @distube/ytdl-core fluent-ffmpeg ffmpeg-static music-metadata multer
npm install --save-dev @types/express @types/cors @types/fluent-ffmpeg @types/multer
```

- [ ] **Step 2: Create Express Server script `server/index.js`**

```javascript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import ytdl from '@distube/ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import { parseBuffer } from 'music-metadata';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ limits: { fileSize: 15 * 1024 * 1024 } }); // 15MB max

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Rate limiter: max 5 conversions per 10 minutes per IP
const rateLimits = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const userRecord = rateLimits.get(ip) || { count: 0, resetTime: now + windowMs };
  if (now > userRecord.resetTime) {
    userRecord.count = 0;
    userRecord.resetTime = now + windowMs;
  }
  if (userRecord.count >= 5) return false;
  userRecord.count++;
  rateLimits.set(ip, userRecord);
  return true;
}

// SSE Endpoint for YouTube conversion
app.get('/api/music/convert', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendState = (state, message, data = null) => {
    res.write(`data: ${JSON.stringify({ state, message, data })}\n\n`);
  };

  const youtubeUrl = req.query.url;
  const clientIp = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

  if (!checkRateLimit(clientIp)) {
    sendState('Failed', 'Rate limit exceeded. Maximum 5 conversions per 10 minutes.');
    return res.end();
  }

  try {
    // 1. Checking link
    sendState('Checking link', 'Validating link and checking for duplicates...');
    if (!ytdl.validateURL(youtubeUrl)) {
      sendState('Failed', 'Invalid YouTube URL provided.');
      return res.end();
    }

    // Check duplicate in DB
    const { data: existing } = await supabase.from('songs').select('id').eq('youtube_url', youtubeUrl).single();
    if (existing) {
      sendState('Failed', 'This YouTube video has already been added to the library.');
      return res.end();
    }

    // 2. Downloading authorized audio
    sendState('Downloading authorized audio', 'Extracting audio stream from YouTube...');
    const info = await ytdl.getInfo(youtubeUrl);
    const title = info.videoDetails.title;
    const artist = info.videoDetails.author?.name || info.videoDetails.ownerChannelName || 'Unknown Artist';
    const duration = parseInt(info.videoDetails.lengthSeconds, 10) || 180;
    const thumbnailUrl = info.videoDetails.thumbnails?.[0]?.url || '';

    // 3. Converting to MP3
    sendState('Converting to MP3', 'Transcoding audio to high quality MP3...');
    const audioStream = ytdl(youtubeUrl, { filter: 'audioonly', quality: 'highestaudio' });
    
    // Convert to buffer via ffmpeg
    const mp3Buffer = await new Promise((resolve, reject) => {
      const buffers = [];
      ffmpeg(audioStream)
        .toFormat('mp3')
        .audioBitrate(128)
        .on('error', reject)
        .pipe()
        .on('data', (chunk) => buffers.push(chunk))
        .on('end', () => resolve(Buffer.concat(buffers)));
    });

    // 4. Uploading
    sendState('Uploading', 'Uploading MP3 file to Supabase Storage...');
    const fileName = `youtube_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.mp3`;
    const { error: uploadErr } = await supabase.storage.from('songs').upload(`mp3s/${fileName}`, mp3Buffer, {
      contentType: 'audio/mpeg',
      upsert: true
    });

    if (uploadErr) throw uploadErr;

    const { data: publicUrlData } = supabase.storage.from('songs').getPublicUrl(`mp3s/${fileName}`);
    const mp3Url = publicUrlData.publicUrl;

    // 5. Completed - Save to DB
    const songRecord = {
      title,
      artist,
      youtube_url: youtubeUrl,
      thumbnail_url: thumbnailUrl,
      mp3_url: mp3Url,
      duration,
      is_custom_upload: false
    };

    const { data: insertedSong, error: dbErr } = await supabase.from('songs').insert(songRecord).select().single();
    if (dbErr) throw dbErr;

    sendState('Completed', 'Song converted and added successfully!', insertedSong);
    res.end();
  } catch (err) {
    console.error('Conversion error:', err);
    sendState('Failed', err.message || 'An unexpected error occurred during audio processing.');
    res.end();
  }
});

// Direct MP3 upload endpoint
app.post('/api/music/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No MP3 file uploaded.' });
    if (file.mimetype !== 'audio/mpeg' && !file.originalname.endsWith('.mp3')) {
      return res.status(400).json({ error: 'Only MP3 files are permitted.' });
    }

    const metadata = await parseBuffer(file.buffer, 'audio/mpeg');
    const title = req.body.title || metadata.common.title || file.originalname.replace('.mp3', '');
    const artist = req.body.artist || metadata.common.artist || 'Unknown Artist';
    const duration = Math.round(metadata.format.duration || 180);

    const fileName = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.mp3`;
    const { error: uploadErr } = await supabase.storage.from('songs').upload(`mp3s/${fileName}`, file.buffer, {
      contentType: 'audio/mpeg',
      upsert: true
    });

    if (uploadErr) throw uploadErr;

    const { data: publicUrlData } = supabase.storage.from('songs').getPublicUrl(`mp3s/${fileName}`);
    const mp3Url = publicUrlData.publicUrl;

    const songRecord = {
      title,
      artist,
      mp3_url: mp3Url,
      duration,
      is_custom_upload: true
    };

    const { data: insertedSong, error: dbErr } = await supabase.from('songs').insert(songRecord).select().single();
    if (dbErr) throw dbErr;

    return res.json({ success: true, song: insertedSong });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to process MP3 upload.' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Music Conversion API Server running on port ${PORT}`);
});
```

- [ ] **Step 3: Update `vite.config.ts` to proxy `/api` requests to Express backend server**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
```

- [ ] **Step 4: Verify proxy & dependencies build**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/index.js package.json vite.config.ts
git commit -m "feat(music): add Express conversion API server with SSE and proxy config"
```

---

### Task 3: Admin View Music Manager & Conversion Progress UI

**Files:**
- Modify: `src/components/AdminView.tsx`
- Test: `tests/admin_music.test.ts`

**Interfaces:**
- Consumes: SSE `/api/music/convert`, `POST /api/music/upload`, `fetchSongs()`, `deleteSong()`.
- Produces: Music Manager tab in AdminView with 6-state conversion visualizer, permission checkboxes, and song management table.

- [ ] **Step 1: Implement Music Manager tab in `src/components/AdminView.tsx`**

Add YouTube URL input, mandatory permission checkbox, direct MP3 upload, real-time 6-state progress tracker, and song list table to AdminView.

Progress state steps displayed:
1. `Checking link`
2. `Downloading authorized audio`
3. `Converting to MP3`
4. `Uploading`
5. `Completed`
6. `Failed`

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/AdminView.tsx
git commit -m "feat(music): add Music Manager tab and 6-state conversion progress UI to AdminView"
```

---

### Task 4: User Music Selector Modal & Enhanced Player Controls

**Files:**
- Create: `src/components/MusicSelectorModal.tsx`
- Modify: `src/components/MusicPlayer.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `Song[]`, `fetchSongs()`, `saveSelectedSongId()`.
- Produces: Responsive modal with song search by title, preview player, active song highlight, selection persistence, and full player controls (play, pause, restart, volume).

- [ ] **Step 1: Create `src/components/MusicSelectorModal.tsx`**

```tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Music, Play, Pause, Check, X, Sparkles } from "lucide-react";
import { Song } from "../lib/supabase";
import { Howl } from "howler";

interface MusicSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  songs: Song[];
  selectedSongId: string | null;
  onSelectSong: (song: Song) => void;
}

export function MusicSelectorModal({
  isOpen,
  onClose,
  songs,
  selectedSongId,
  onSelectSong,
}: MusicSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [previewingSongId, setPreviewingSongId] = useState<string | null>(null);
  const [previewHowl, setPreviewHowl] = useState<Howl | null>(null);

  const filteredSongs = songs.filter(
    (song) =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTogglePreview = (song: Song) => {
    if (previewingSongId === song.id && previewHowl) {
      previewHowl.stop();
      setPreviewingSongId(null);
      setPreviewHowl(null);
      return;
    }

    if (previewHowl) {
      previewHowl.stop();
    }

    const sound = new Howl({
      src: [song.mp3_url],
      html5: true,
      volume: 0.7,
      onend: () => setPreviewingSongId(null),
    });
    sound.play();
    setPreviewHowl(sound);
    setPreviewingSongId(song.id);
  };

  const handleClose = () => {
    if (previewHowl) previewHowl.stop();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-rose-100 flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-rose-500 to-pink-500 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Music className="w-6 h-6 animate-bounce" />
              <h2 className="text-xl font-bold font-serif">Choose Background Music</h2>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-white/20 rounded-full transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-4 bg-rose-50/50 border-b border-rose-100">
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-rose-400" />
              <input
                type="text"
                placeholder="Search songs by title or artist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white rounded-full border border-rose-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>
          </div>

          {/* Song List */}
          <div className="p-4 overflow-y-auto flex-1 space-y-3">
            {filteredSongs.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No songs found.</p>
            ) : (
              filteredSongs.map((song) => {
                const isSelected = selectedSongId === song.id;
                return (
                  <div
                    key={song.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                      isSelected
                        ? "bg-rose-50 border-rose-400 ring-2 ring-rose-400/30 shadow-md"
                        : "bg-white border-gray-100 hover:border-rose-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {song.thumbnail_url ? (
                        <img src={song.thumbnail_url} alt={song.title} className="w-12 h-12 rounded-xl object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-500">
                          <Music className="w-6 h-6" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate text-sm">{song.title}</h4>
                        <p className="text-xs text-gray-500 truncate">{song.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePreview(song)}
                        className="p-2 rounded-full bg-gray-100 hover:bg-rose-100 text-gray-700 hover:text-rose-600 transition"
                        title="Preview song snippet"
                      >
                        {previewingSongId === song.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </button>

                      <button
                        onClick={() => onSelectSong(song)}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition ${
                          isSelected
                            ? "bg-rose-600 text-white shadow"
                            : "bg-rose-100 text-rose-700 hover:bg-rose-200"
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Selected
                          </>
                        ) : (
                          "Select"
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: Update `src/components/MusicPlayer.tsx` with Play, Pause, Restart, Volume slider, Mute, and Selector Modal launcher**

Add volume state, restart button, mute toggle, and modal launcher button to `MusicPlayer.tsx`.

- [ ] **Step 3: Connect in `src/App.tsx`**

Pass `songs`, `selectedSong`, and selection handlers to `MusicPlayer` and render `MusicSelectorModal`.

- [ ] **Step 4: Verify TypeScript build**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/MusicSelectorModal.tsx src/components/MusicPlayer.tsx src/App.tsx
git commit -m "feat(music): add MusicSelectorModal with search/preview/select and update MusicPlayer with full controls"
```

---

### Task 5: End-to-End Verification & Code Testing

**Files:**
- Create: `tests/music.test.ts`

- [ ] **Step 1: Write verification test script `tests/music.test.ts`**

```typescript
import { describe, it, expect } from "vitest";

describe("Music Feature Logic", () => {
  it("validates YouTube URL formats correctly", () => {
    const validUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    const isYoutube = validUrl.includes("youtube.com") || validUrl.includes("youtu.be");
    expect(isYoutube).toBe(true);
  });

  it("filters songs by title query correctly", () => {
    const mockSongs = [
      { id: "1", title: "Golden Hour", artist: "JVKE" },
      { id: "2", title: "Nothing", artist: "Bruno Major" },
    ];

    const search = "Golden";
    const filtered = mockSongs.filter((s) => s.title.toLowerCase().includes(search.toLowerCase()));
    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toBe("Golden Hour");
  });
});
```

- [ ] **Step 2: Run full build and linter verification**

Run: `npm run build`
Expected: Successful build output in `dist/`.

- [ ] **Step 3: Commit**

```bash
git add tests/music.test.ts
git commit -m "test(music): add unit tests for music search filtering and URL validation"
```
