import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { parseBuffer } from 'music-metadata';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { handleConvertSse } from './apiHandler.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ limits: { fileSize: 15 * 1024 * 1024 } }); // 15MB limit

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder-key'
);

// SSE Endpoint for YouTube Conversion
app.get('/api/music/convert', handleConvertSse);

// Direct MP3 Upload Endpoint
app.post('/api/music/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file provided.' });
    
    if (file.mimetype !== 'audio/mpeg' && !file.originalname.endsWith('.mp3')) {
      return res.status(400).json({ error: 'Only MP3 files are permitted.' });
    }

    let duration = 180;
    let title = req.body.title || file.originalname.replace('.mp3', '');
    let artist = req.body.artist || 'Unknown Artist';
    const existingId = req.body.existingId || null; // For cloud sync of local songs

    try {
      const { parseBuffer } = await import('music-metadata');
      const metadata = await parseBuffer(file.buffer, 'audio/mpeg');
      if (metadata.format.duration) {
        duration = Math.round(metadata.format.duration);
      }
      if (metadata.common.title && !req.body.title) title = metadata.common.title;
      if (metadata.common.artist && !req.body.artist) artist = metadata.common.artist;
    } catch (metaErr) {
      console.warn('Metadata parsing notice:', metaErr);
    }

    const fileName = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.mp3`;
    let mp3Url = '';

    if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
      // Auto-create bucket if it doesn't exist
      try {
        const { data: buckets } = await supabase.storage.listBuckets();
        const exists = buckets?.some(b => b.name === 'songs');
        if (!exists) {
          const { error: bErr } = await supabase.storage.createBucket('songs', { public: true });
          if (bErr) console.warn('Bucket creation notice:', bErr.message);
        }
      } catch (bErr) {
        console.warn('Bucket check notice:', bErr);
      }

      const { error: uploadErr } = await supabase.storage
        .from('songs')
        .upload(`mp3s/${fileName}`, file.buffer, {
          contentType: 'audio/mpeg',
          upsert: true
        });

      if (uploadErr) throw uploadErr;

      const { data: publicUrlData } = supabase.storage
        .from('songs')
        .getPublicUrl(`mp3s/${fileName}`);
      mp3Url = publicUrlData.publicUrl;
    } else {
      mp3Url = `data:audio/mpeg;base64,${file.buffer.toString('base64')}`;
    }

    const songRecord = {
      title,
      artist,
      mp3_url: mp3Url,
      duration,
      is_custom_upload: true,
      created_at: new Date().toISOString()
    };

    if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
      if (existingId) {
        // Update existing local song to cloud version
        const { data: updated, error: upErr } = await supabase
          .from('songs')
          .update({ mp3_url: mp3Url, title, artist })
          .eq('id', existingId)
          .select()
          .single();
        if (!upErr && updated) return res.json({ success: true, song: updated });
        // If update fails (song not in DB yet), fall through to insert
      }

      const { data: inserted, error: dbErr } = await supabase
        .from('songs')
        .insert({ ...songRecord, id: existingId || crypto.randomUUID() })
        .select()
        .single();
      
      if (!dbErr && inserted) {
        return res.json({ success: true, song: inserted });
      }
    }

    return res.json({ success: true, song: { ...songRecord, id: existingId || crypto.randomUUID() } });
  } catch (err) {
    console.error('MP3 upload error:', err);
    return res.status(500).json({ error: err.message || 'Failed to upload MP3.' });
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
