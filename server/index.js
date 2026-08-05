import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { parseBuffer } from 'music-metadata';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { createHash, randomUUID } from 'crypto';
import { handleConvertSse } from './apiHandler.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ limits: { fileSize: 15 * 1024 * 1024 } }); // 15MB limit

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const authSupabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || supabaseAnonKey || 'placeholder-key'
);

const SUPPORTED_AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.m4a']);
const SUPPORTED_AUDIO_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aac',
]);

function getBearerToken(req) {
  const header = req.headers?.authorization || '';
  if (!header.startsWith('Bearer ')) return '';
  return header.slice(7).trim();
}

async function requireAdmin(req, res) {
  const token = getBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Missing authorization token.' });
    return null;
  }

  const { data: userData, error: userError } = await authSupabase.auth.getUser(token);
  if (userError || !userData?.user) {
    res.status(401).json({ error: 'Invalid or expired authorization token.' });
    return null;
  }

  const requestSupabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key',
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  const { data: isAdminUser, error: adminError } = await requestSupabase.rpc('is_admin');
  if (adminError || !isAdminUser) {
    res.status(403).json({ error: 'Administrator access required.' });
    return null;
  }

  return { user: userData.user, token, client: requestSupabase };
}

function getAudioExtension(file) {
  const ext = `.${(file.originalname.split('.').pop() || '').toLowerCase()}`;
  if (SUPPORTED_AUDIO_EXTENSIONS.has(ext)) return ext;
  if (file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/mp3') return '.mp3';
  if (file.mimetype === 'audio/wav' || file.mimetype === 'audio/x-wav') return '.wav';
  if (file.mimetype === 'audio/mp4' || file.mimetype === 'audio/x-m4a' || file.mimetype === 'audio/aac') return '.m4a';
  return ext || '.mp3';
}

async function ensureSongsBucket() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((bucket) => bucket.name === 'songs');
    if (!exists) {
      await supabase.storage.createBucket('songs', { public: true });
    }
  } catch (bucketError) {
    console.warn('Bucket check notice:', bucketError);
  }
}

function extractStoragePathFromUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const marker = '/storage/v1/object/public/songs/';
    const markerIndex = parsed.pathname.indexOf(marker);
    if (markerIndex >= 0) {
      return decodeURIComponent(parsed.pathname.slice(markerIndex + marker.length));
    }
  } catch {
    return null;
  }
  return null;
}

// SSE Endpoint for YouTube Conversion
app.get('/api/music/convert', handleConvertSse);

// Direct MP3 Upload Endpoint
app.post('/api/music/upload', upload.single('file'), async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file provided.' });
    const fileExtension = getAudioExtension(file);
    if (!SUPPORTED_AUDIO_EXTENSIONS.has(fileExtension) && !SUPPORTED_AUDIO_MIME_TYPES.has(file.mimetype)) {
      return res.status(400).json({ error: 'Only MP3, WAV, and M4A files are permitted.' });
    }

    await ensureSongsBucket();

    let duration = 0;
    let title = req.body.title || file.originalname.replace(/\.[^.]+$/, '');
    let artist = req.body.artist || 'Unknown Artist';
    const existingId = req.body.existingId || null;
    const uploadDate = new Date().toISOString();

    const { data: existingSong, error: existingSongError } = existingId
      ? await admin.client
          .from('songs')
          .select('id, storage_path, file_hash')
          .eq('id', existingId)
          .maybeSingle()
      : { data: null, error: null };

    if (existingSongError) {
      console.warn('Existing song lookup notice:', existingSongError);
    }

    const fileHash = createHash('sha256').update(file.buffer).digest('hex');
    const storagePath = `uploads/${fileHash}${fileExtension}`;
    let duplicateQuery = admin.client
      .from('songs')
      .select('id, title')
      .eq('file_hash', fileHash);

    if (existingId) {
      duplicateQuery = duplicateQuery.neq('id', existingId);
    }

    const { data: duplicateSong, error: duplicateError } = await duplicateQuery.maybeSingle();

    if (duplicateError) {
      console.warn('Duplicate lookup notice:', duplicateError);
    }

    if (duplicateSong) {
      return res.status(409).json({ error: `This audio file already exists as "${duplicateSong.title}".` });
    }

    try {
      const metadata = await parseBuffer(file.buffer, file.mimetype || 'audio/mpeg');
      if (metadata.format.duration) {
        duration = Math.round(metadata.format.duration);
      }
      if (metadata.common.title && !req.body.title) title = metadata.common.title;
      if (metadata.common.artist && !req.body.artist) artist = metadata.common.artist;
    } catch (metaErr) {
      console.warn('Metadata parsing notice:', metaErr);
    }

    const fileName = file.originalname;
    let cloudFileUrl = '';

    if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
      const { error: uploadErr } = await admin.client.storage
        .from('songs')
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype || 'application/octet-stream',
          upsert: false
        });

      if (uploadErr) {
        if (uploadErr.message?.toLowerCase().includes('already exists')) {
          return res.status(409).json({ error: 'This audio file already exists in storage.' });
        }
        throw uploadErr;
      }

      const { data: publicUrlData } = admin.client.storage
        .from('songs')
        .getPublicUrl(storagePath);
      cloudFileUrl = publicUrlData.publicUrl;
    }

    const songRecord = {
      id: randomUUID(),
      title,
      artist,
      youtube_url: null,
      thumbnail_url: null,
      mp3_url: cloudFileUrl,
      cloud_file_url: cloudFileUrl,
      file_name: fileName,
      file_size_bytes: file.size,
      audio_duration_seconds: duration,
      duration,
      upload_date: uploadDate,
      storage_path: storagePath,
      file_hash: fileHash,
      mime_type: file.mimetype || null,
      is_custom_upload: true,
      created_at: uploadDate
    };

    if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
      const upsertPayload = {
        ...songRecord,
        id: existingId || songRecord.id,
      };

      const { data: savedSong, error: dbErr } = existingId
        ? await admin.client
            .from('songs')
            .update(upsertPayload)
            .eq('id', existingId)
            .select()
            .single()
        : await admin.client
            .from('songs')
            .insert(upsertPayload)
            .select()
            .single();

      if (!dbErr && savedSong) {
        if (existingSong?.storage_path && existingSong.storage_path !== storagePath) {
          const { error: cleanupError } = await admin.client.storage.from('songs').remove([existingSong.storage_path]);
          if (cleanupError) {
            console.warn('Old song storage cleanup notice:', cleanupError);
          }
        }
        return res.json({ success: true, song: savedSong });
      }

      if (dbErr) throw dbErr;
    }

    if (existingSong?.storage_path && existingSong.storage_path !== storagePath) {
      const { error: cleanupError } = await admin.client.storage.from('songs').remove([existingSong.storage_path]);
      if (cleanupError) {
        console.warn('Old song storage cleanup notice:', cleanupError);
      }
    }

    if (existingId) {
      return res.json({ success: true, song: { ...songRecord, id: existingId } });
    }

    return res.json({ success: true, song: songRecord });
  } catch (err) {
    console.error('MP3 upload error:', err);
    return res.status(500).json({ error: err.message || 'Failed to upload MP3.' });
  }
});

app.patch('/api/music/:id', async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const songId = req.params.id;
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : undefined;
    const artist = typeof req.body?.artist === 'string' ? req.body.artist.trim() : undefined;

    const update = {};
    if (title !== undefined) update.title = title || 'Untitled Song';
    if (artist !== undefined) update.artist = artist || 'Unknown Artist';

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'No editable fields were provided.' });
    }

    const { data, error } = await admin.client
      .from('songs')
      .update(update)
      .eq('id', songId)
      .select('*')
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.json({ success: true, song: data });
  } catch (err) {
    console.error('Song update error:', err);
    return res.status(500).json({ error: err.message || 'Failed to update song.' });
  }
});

app.delete('/api/music/:id', async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const songId = req.params.id;
    const { data: song, error: fetchError } = await admin.client
      .from('songs')
      .select('id, storage_path, mp3_url')
      .eq('id', songId)
      .maybeSingle();

    if (fetchError) {
      return res.status(400).json({ error: fetchError.message });
    }

    if (!song) {
      return res.status(404).json({ error: 'Song not found.' });
    }

    const storagePath = song.storage_path || extractStoragePathFromUrl(song.mp3_url);
    if (storagePath) {
      const { error: storageError } = await admin.client.storage.from('songs').remove([storagePath]);
      if (storageError) {
        console.warn('Song storage delete notice:', storageError);
      }
    }

    const { error: deleteError } = await admin.client.from('songs').delete().eq('id', songId);
    if (deleteError) {
      return res.status(400).json({ error: deleteError.message });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Song delete error:', err);
    return res.status(500).json({ error: err.message || 'Failed to delete song.' });
  }
});

// GET all songs endpoint
app.get('/api/music/songs', async (req, res) => {
  try {
    if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) return res.json(data);
    }
    return res.json([]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🎵 Music Conversion API Server listening on port ${PORT}`);
});
