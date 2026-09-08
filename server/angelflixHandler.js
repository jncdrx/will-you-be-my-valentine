import { randomUUID } from 'crypto';
import cloudinary from './cloudinary.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

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

// In-memory / local fallback cache in case Supabase table is not yet migrated
const localMediaCache = new Map();

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

/**
 * Upload a stream buffer to Cloudinary
 */
function uploadToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'monthsarry/angelflix',
        resource_type: 'auto',
        ...options,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

/**
 * POST /api/angelflix/upload
 */
export async function handleAngelFlixUpload(req, res) {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No media file provided.' });
    }

    const title = (req.body.title || file.originalname.replace(/\.[^.]+$/, '')).trim();
    const subtitle = (req.body.subtitle || '').trim();
    const category = (req.body.category || 'Our Videos').trim();
    const description = (req.body.description || '').trim();
    const date = (req.body.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })).trim();
    const isFavorite = req.body.isFavorite === 'true' || req.body.isFavorite === true;
    let tags = [];
    if (req.body.tags) {
      tags = Array.isArray(req.body.tags)
        ? req.body.tags
        : req.body.tags.split(',').map((t) => t.trim()).filter(Boolean);
    }

    // Upload to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(file.buffer, {
      public_id: `angelflix_${Date.now()}_${randomUUID().slice(0, 8)}`,
    });

    const isVideo = cloudinaryResult.resource_type === 'video';
    const videoUrl = isVideo ? cloudinaryResult.secure_url : null;
    const imageUrl = isVideo
      ? cloudinary.url(cloudinaryResult.public_id, {
          resource_type: 'video',
          format: 'jpg',
          transformation: [{ start_offset: 'auto' }, { quality: 'auto', fetch_format: 'auto' }],
        })
      : cloudinaryResult.secure_url;

    const mediaRecord = {
      id: randomUUID(),
      title,
      subtitle: subtitle || (isVideo ? 'Private Video Memory' : 'Photo Memory'),
      description: description || `Uploaded on ${date}`,
      category,
      imageUrl,
      videoUrl,
      publicId: cloudinaryResult.public_id,
      resourceType: cloudinaryResult.resource_type,
      duration: cloudinaryResult.duration ? Math.round(cloudinaryResult.duration) : null,
      bytes: cloudinaryResult.bytes,
      format: cloudinaryResult.format,
      date,
      tags: tags.length > 0 ? tags : [category, isVideo ? 'Video' : 'Photo'],
      isFavorite,
      createdAt: new Date().toISOString(),
    };

    // Save in Supabase if available
    try {
      if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
        const { data, error } = await supabase
          .from('angelflix_media')
          .insert({
            id: mediaRecord.id,
            title: mediaRecord.title,
            subtitle: mediaRecord.subtitle,
            description: mediaRecord.description,
            category: mediaRecord.category,
            image_url: mediaRecord.imageUrl,
            video_url: mediaRecord.videoUrl,
            public_id: mediaRecord.publicId,
            resource_type: mediaRecord.resourceType,
            duration_seconds: mediaRecord.duration,
            file_bytes: mediaRecord.bytes,
            format: mediaRecord.format,
            date_str: mediaRecord.date,
            tags: mediaRecord.tags,
            is_favorite: mediaRecord.isFavorite,
            created_at: mediaRecord.createdAt,
          })
          .select()
          .single();

        if (!error && data) {
          localMediaCache.set(mediaRecord.id, mediaRecord);
          return res.json({ success: true, media: mediaRecord });
        }
      }
    } catch (dbError) {
      console.warn('Database insert notice (using memory fallback):', dbError);
    }

    // Store in local cache fallback
    localMediaCache.set(mediaRecord.id, mediaRecord);
    return res.json({ success: true, media: mediaRecord });
  } catch (err) {
    console.error('AngelFlix upload error:', err);
    return res.status(500).json({ error: err.message || 'Failed to upload media to Cloudinary.' });
  }
}

/**
 * GET /api/angelflix/media
 */
export async function handleGetAngelFlixMedia(req, res) {
  try {
    if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
      const { data, error } = await supabase
        .from('angelflix_media')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped = data.map((d) => ({
          id: d.id,
          title: d.title,
          subtitle: d.subtitle,
          description: d.description,
          category: d.category,
          imageUrl: d.image_url,
          videoUrl: d.video_url,
          publicId: d.public_id,
          resourceType: d.resource_type,
          duration: d.duration_seconds,
          bytes: d.file_bytes,
          format: d.format,
          date: d.date_str,
          tags: d.tags || [],
          isFavorite: d.is_favorite,
          createdAt: d.created_at,
        }));
        return res.json(mapped);
      }
    }

    const fallbackList = Array.from(localMediaCache.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return res.json(fallbackList);
  } catch (err) {
    console.error('Get AngelFlix media error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch AngelFlix media.' });
  }
}

/**
 * POST /api/angelflix/media
 * Create a new AngelFlix memory record from JSON metadata
 */
export async function handleCreateAngelFlixMedia(req, res) {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const {
      id = randomUUID(),
      title,
      subtitle = '',
      category = 'Our Videos',
      description = '',
      imageUrl = '',
      videoUrl = null,
      publicId = null,
      resourceType = videoUrl ? 'video' : 'image',
      duration = 60,
      date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      tags = [],
      isFavorite = false,
      location = '',
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required.' });
    }

    const mediaRecord = {
      id,
      title: title.trim(),
      subtitle: subtitle.trim() || (videoUrl ? 'Private Video Memory' : 'Photo Memory'),
      description: description.trim() || `Uploaded on ${date}`,
      category: category.trim(),
      imageUrl,
      videoUrl,
      publicId,
      resourceType,
      duration: duration ? Number(duration) : 60,
      date,
      tags: Array.isArray(tags) ? tags : [category],
      isFavorite: Boolean(isFavorite),
      location,
      createdAt: new Date().toISOString(),
    };

    if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
      try {
        const { data, error } = await supabase
          .from('angelflix_media')
          .insert({
            id: mediaRecord.id,
            title: mediaRecord.title,
            subtitle: mediaRecord.subtitle,
            description: mediaRecord.description,
            category: mediaRecord.category,
            image_url: mediaRecord.imageUrl,
            video_url: mediaRecord.videoUrl,
            public_id: mediaRecord.publicId,
            resource_type: mediaRecord.resourceType,
            duration_seconds: mediaRecord.duration,
            date_str: mediaRecord.date,
            tags: mediaRecord.tags,
            is_favorite: mediaRecord.isFavorite,
            created_at: mediaRecord.createdAt,
          })
          .select()
          .single();

        if (!error && data) {
          localMediaCache.set(mediaRecord.id, mediaRecord);
          return res.json({ success: true, media: mediaRecord });
        }
      } catch (dbErr) {
        console.warn('Database insert notice:', dbErr);
      }
    }

    localMediaCache.set(mediaRecord.id, mediaRecord);
    return res.json({ success: true, media: mediaRecord });
  } catch (err) {
    console.error('Create AngelFlix media error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create media.' });
  }
}

/**
 * PATCH /api/angelflix/media/:id
 */
export async function handleUpdateAngelFlixMedia(req, res) {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const id = req.params.id;
    const { title, subtitle, category, description, tags, isFavorite } = req.body;

    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (subtitle !== undefined) updateFields.subtitle = subtitle;
    if (category !== undefined) updateFields.category = category;
    if (description !== undefined) updateFields.description = description;
    if (tags !== undefined) updateFields.tags = tags;
    if (isFavorite !== undefined) updateFields.is_favorite = isFavorite;

    if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
      try {
        const { data, error } = await supabase
          .from('angelflix_media')
          .update(updateFields)
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          const updated = {
            id: data.id,
            title: data.title,
            subtitle: data.subtitle,
            description: data.description,
            category: data.category,
            imageUrl: data.image_url,
            videoUrl: data.video_url,
            publicId: data.public_id,
            resourceType: data.resource_type,
            duration: data.duration_seconds,
            bytes: data.file_bytes,
            format: data.format,
            date: data.date_str,
            tags: data.tags || [],
            isFavorite: data.is_favorite,
            createdAt: data.created_at,
          };
          localMediaCache.set(id, updated);
          return res.json({ success: true, media: updated });
        }
      } catch (dbErr) {
        console.warn('Database update notice:', dbErr);
      }
    }

    if (localMediaCache.has(id)) {
      const existing = localMediaCache.get(id);
      const updated = {
        ...existing,
        ...(title !== undefined && { title }),
        ...(subtitle !== undefined && { subtitle }),
        ...(category !== undefined && { category }),
        ...(description !== undefined && { description }),
        ...(tags !== undefined && { tags }),
        ...(isFavorite !== undefined && { isFavorite }),
      };
      localMediaCache.set(id, updated);
      return res.json({ success: true, media: updated });
    }

    return res.status(404).json({ error: 'Media not found.' });
  } catch (err) {
    console.error('Update AngelFlix media error:', err);
    return res.status(500).json({ error: err.message || 'Failed to update media.' });
  }
}

/**
 * DELETE /api/angelflix/media/:id
 */
export async function handleDeleteAngelFlixMedia(req, res) {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

    const id = req.params.id;
    let publicId = null;
    let resourceType = 'video';

    // Check database or cache for publicId
    if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
      try {
        const { data } = await supabase
          .from('angelflix_media')
          .select('public_id, resource_type')
          .eq('id', id)
          .maybeSingle();
        if (data) {
          publicId = data.public_id;
          resourceType = data.resource_type || 'video';
          await supabase.from('angelflix_media').delete().eq('id', id);
        }
      } catch (dbErr) {
        console.warn('Database delete notice:', dbErr);
      }
    }

    if (localMediaCache.has(id)) {
      const item = localMediaCache.get(id);
      publicId = publicId || item.publicId;
      resourceType = resourceType || item.resourceType || 'video';
      localMediaCache.delete(id);
    }

    // Remove from Cloudinary if publicId exists
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      } catch (cloudErr) {
        console.warn('Cloudinary delete notice:', cloudErr);
      }
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Delete AngelFlix media error:', err);
    return res.status(500).json({ error: err.message || 'Failed to delete media.' });
  }
}
