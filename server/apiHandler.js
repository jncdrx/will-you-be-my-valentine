import ytdl from '@distube/ytdl-core';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import { createClient } from '@supabase/supabase-js';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

dotenv.config();

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

// Absolute path to yt-dlp (winget install doesn't add to inherited PATH)
const YT_DLP_PATH = process.env.YT_DLP_PATH ||
  'C:\\Users\\User\\AppData\\Local\\Microsoft\\WinGet\\Links\\yt-dlp.exe';

// Merged environment PATH so child processes can find yt-dlp + ffmpeg
const CHILD_ENV = {
  ...process.env,
  PATH: [
    'C:\\Users\\User\\AppData\\Local\\Microsoft\\WinGet\\Links',
    'C:\\Users\\User\\AppData\\Local\\Microsoft\\WinGet\\Packages\\yt-dlp.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-N-125365-g9a01c1cb6a-win64-gpl\\bin',
    process.env.PATH || '',
  ].join(';')
};

const execAsync = promisify(exec);

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder-key'
);

export function cleanYoutubeUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    let videoId = parsed.searchParams.get('v');
    if (!videoId && (parsed.hostname === 'youtu.be' || parsed.hostname.endsWith('youtu.be'))) {
      videoId = parsed.pathname.substring(1).split('?')[0];
    }
    if (videoId) {
      return `https://www.youtube.com/watch?v=${videoId}`;
    }
  } catch (e) {}
  return rawUrl;
}

export function getYoutubeId(url) {
  const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : 'default';
}

const rateLimits = new Map();
export function checkRateLimit(ip) {
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

// Check if yt-dlp is available on the system
async function hasYtDlp() {
  try {
    await execAsync(`"${YT_DLP_PATH}" --version`, { env: CHILD_ENV });
    return true;
  } catch {
    return false;
  }
}

// Use yt-dlp to get video info as JSON
async function getInfoViaYtDlp(url) {
  const { stdout } = await execAsync(`"${YT_DLP_PATH}" --dump-json --no-playlist "${url}"`, { timeout: 30000, env: CHILD_ENV });
  return JSON.parse(stdout);
}

// Stream MP3 via yt-dlp piped into ffmpeg
async function convertViaYtDlp(url) {
  return new Promise((resolve, reject) => {
    const ytDlpProc = spawn(YT_DLP_PATH, [
      '--no-playlist', '-f', 'bestaudio/best', '-o', '-', '--quiet', url
    ], { env: CHILD_ENV });

    const buffers = [];
    ytDlpProc.stderr.on('data', d => console.warn('[yt-dlp]', d.toString().trim()));
    ytDlpProc.on('error', reject);

    const ffmpegPipe = ffmpeg(ytDlpProc.stdout)
      .toFormat('mp3')
      .audioBitrate(128)
      .on('error', err => { ytDlpProc.kill(); reject(err); })
      .pipe();

    ffmpegPipe.on('data', chunk => buffers.push(chunk));
    ffmpegPipe.on('end', () => resolve(Buffer.concat(buffers)));
    ffmpegPipe.on('error', reject);
  });
}

// Convert via ytdl-core + ffmpeg
async function convertViaYtdlCore(info) {
  return new Promise((resolve, reject) => {
    let audioStream;
    try {
      const formats = info?.formats || [];
      const audioFormats = formats.filter(f => f.hasAudio && !f.hasVideo);
      if (audioFormats.length > 0) {
        audioFormats.sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0));
        audioStream = ytdl.downloadFromInfo(info, { format: audioFormats[0] });
      } else if (formats.length > 0) {
        audioStream = ytdl.downloadFromInfo(info, { filter: f => f.hasAudio });
      } else {
        return reject(new Error('No suitable audio formats available from ytdl-core'));
      }
    } catch (err) {
      return reject(err);
    }

    // Prevent unhandled error event from crashing the process
    audioStream.on('error', reject);

    const buffers = [];
    ffmpeg(audioStream)
      .toFormat('mp3')
      .audioBitrate(128)
      .on('error', reject)
      .pipe()
      .on('data', chunk => buffers.push(chunk))
      .on('end', () => resolve(Buffer.concat(buffers)))
      .on('error', reject);
  });
}

export async function handleConvertSse(req, res) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendState = (state, message, data = null) => {
    try { res.write(`data: ${JSON.stringify({ state, message, data })}\n\n`); } catch {}
  };

  const rawUrl = req.query?.url || new URL(req.url, 'http://localhost').searchParams.get('url');
  const youtubeUrl = cleanYoutubeUrl(rawUrl || '');
  const clientIp = req.ip || req.headers?.['x-forwarded-for'] || '127.0.0.1';

  if (!checkRateLimit(clientIp)) {
    sendState('Failed', 'Rate limit exceeded. Maximum 5 conversions per 10 minutes.');
    return res.end();
  }

  if (!youtubeUrl) {
    sendState('Failed', 'No YouTube URL provided.');
    return res.end();
  }

  try {
    sendState('Checking link', 'Validating URL and checking database for duplicates...');

    let isUrlValid = false;
    try { isUrlValid = ytdl.validateURL(youtubeUrl); } catch {}
    if (!isUrlValid) {
      isUrlValid = youtubeUrl.includes('youtube.com/watch') || youtubeUrl.includes('youtu.be/');
    }

    if (!isUrlValid) {
      sendState('Failed', 'Invalid YouTube URL provided.');
      return res.end();
    }

    if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
      const { data: existing } = await supabase
        .from('songs').select('id, title')
        .eq('youtube_url', youtubeUrl).maybeSingle();
      if (existing) {
        sendState('Failed', `This YouTube video has already been added as "${existing.title}".`);
        return res.end();
      }
    }

    sendState('Downloading authorized audio', 'Extracting audio stream and video metadata...');

    const videoId = getYoutubeId(youtubeUrl);
    let title = 'YouTube Audio';
    let artist = 'YouTube Artist';
    let duration = 180;
    let thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    let ytdlInfo = null;

    // Try ytdl-core for metadata first
    try {
      ytdlInfo = await ytdl.getInfo(youtubeUrl, {
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
          }
        }
      });
      title = ytdlInfo?.videoDetails?.title || title;
      artist = ytdlInfo?.videoDetails?.author?.name || ytdlInfo?.videoDetails?.ownerChannelName || artist;
      duration = parseInt(ytdlInfo?.videoDetails?.lengthSeconds || '180', 10);
      const thumbs = ytdlInfo?.videoDetails?.thumbnails;
      thumbnailUrl = (thumbs && thumbs.length > 0 ? thumbs[thumbs.length - 1].url : null) || thumbnailUrl;
    } catch (infoErr) {
      console.warn('[ytdl-core] getInfo failed:', infoErr?.message?.split('\n')[0]);
    }

    // Try yt-dlp metadata if ytdl-core failed or is incomplete
    const ytdlpAvailable = await hasYtDlp();
    if (!ytdlInfo && ytdlpAvailable) {
      try {
        const dlpInfo = await getInfoViaYtDlp(youtubeUrl);
        title = dlpInfo.title || title;
        artist = dlpInfo.uploader || dlpInfo.channel || artist;
        duration = dlpInfo.duration || duration;
        thumbnailUrl = dlpInfo.thumbnail || thumbnailUrl;
      } catch (dlpInfoErr) {
        console.warn('[yt-dlp] info fetch failed:', dlpInfoErr?.message?.split('\n')[0]);
      }
    }

    sendState('Converting to MP3', 'Transcoding audio to 128kbps stereo MP3...');

    let mp3Buffer = null;
    const errors = [];

    // Strategy 1: ytdl-core (if info has usable formats)
    if (ytdlInfo && ytdlInfo.formats && ytdlInfo.formats.some(f => f.hasAudio)) {
      try {
        mp3Buffer = await convertViaYtdlCore(ytdlInfo);
        console.log('[ytdl-core] conversion successful');
      } catch (err) {
        errors.push(`ytdl-core: ${err.message}`);
        console.warn('[ytdl-core] conversion failed:', err.message?.split('\n')[0]);
      }
    }

    // Strategy 2: yt-dlp fallback
    if (!mp3Buffer && ytdlpAvailable) {
      try {
        mp3Buffer = await convertViaYtDlp(youtubeUrl);
        console.log('[yt-dlp] conversion successful');
      } catch (err) {
        errors.push(`yt-dlp: ${err.message}`);
        console.warn('[yt-dlp] conversion failed:', err.message?.split('\n')[0]);
      }
    }

    if (!mp3Buffer) {
      const ytdlpMsg = ytdlpAvailable
        ? 'Both ytdl-core and yt-dlp failed. This video may be age-restricted or region-blocked.'
        : 'ytdl-core failed. Install yt-dlp for a fallback extractor, or use Direct MP3 Upload.';
      sendState('Failed', ytdlpMsg);
      console.error('All extraction strategies failed:', errors);
      return res.end();
    }

    sendState('Uploading', 'Saving MP3 file to Supabase Storage...');

    const fileName = `yt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.mp3`;
    let mp3Url = '';

    if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
      await supabase.storage.from('songs').upload(`mp3s/${fileName}`, mp3Buffer, {
        contentType: 'audio/mpeg', upsert: true
      });
      const { data: publicUrlData } = supabase.storage.from('songs').getPublicUrl(`mp3s/${fileName}`);
      mp3Url = publicUrlData.publicUrl;
    } else {
      mp3Url = `data:audio/mpeg;base64,${mp3Buffer.toString('base64')}`;
    }

    const songRecord = {
      id: crypto.randomUUID(),
      title, artist,
      youtube_url: youtubeUrl,
      thumbnail_url: thumbnailUrl,
      mp3_url: mp3Url,
      duration,
      is_custom_upload: false,
      created_at: new Date().toISOString()
    };

    if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
      const { data: inserted, error: dbErr } = await supabase
        .from('songs').insert(songRecord).select().single();
      if (!dbErr && inserted) {
        sendState('Completed', 'Song converted and added successfully!', inserted);
        return res.end();
      }
    }

    sendState('Completed', 'Song converted and added successfully!', songRecord);
    res.end();
  } catch (err) {
    console.error('[handleConvertSse] Unhandled error:', err.message);
    sendState('Failed', err.message || 'Audio conversion failed.');
    res.end();
  }
}
