import { supabase, isSupabaseConfigured } from "./supabase";

export interface AngelFlixMediaRecord {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  category: string;
  imageUrl: string;
  videoUrl?: string | null;
  publicId?: string;
  resourceType?: string;
  duration?: number | null;
  bytes?: number;
  format?: string;
  date?: string;
  tags?: string[];
  isFavorite?: boolean;
  createdAt?: string;
}

export interface UploadMediaMeta {
  title: string;
  subtitle?: string;
  category: string;
  description?: string;
  tags?: string[];
  isFavorite?: boolean;
  date?: string;
}

async function getAuthToken(overrideToken?: string): Promise<string> {
  if (overrideToken) return overrideToken;
  if (isSupabaseConfigured()) {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.access_token) {
      return data.session.access_token;
    }
  }
  return "";
}

/**
 * Fetch all AngelFlix video and media items
 */
export async function fetchAngelFlixMedia(): Promise<AngelFlixMediaRecord[]> {
  try {
    const origin = typeof window !== "undefined" && window.location?.origin && !window.location.origin.includes("null")
      ? window.location.origin
      : "http://localhost:3001";
    const isBrowser = typeof window !== "undefined" && typeof document !== "undefined" && window.location?.protocol?.startsWith("http");
    const url = isBrowser ? "/api/angelflix/media" : `${origin}/api/angelflix/media`;
    const res = await fetch(url);
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Upload a video or photo to Cloudinary via Express API with upload progress
 */
export function uploadAngelFlixMedia(
  file: File,
  meta: UploadMediaMeta,
  onProgress?: (percent: number) => void,
  tokenOverride?: string
): Promise<AngelFlixMediaRecord> {
  return new Promise(async (resolve, reject) => {
    try {
      const token = await getAuthToken(tokenOverride);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", meta.title);
      if (meta.subtitle) formData.append("subtitle", meta.subtitle);
      formData.append("category", meta.category);
      if (meta.description) formData.append("description", meta.description);
      if (meta.date) formData.append("date", meta.date);
      formData.append("isFavorite", String(Boolean(meta.isFavorite)));
      if (meta.tags && meta.tags.length > 0) {
        formData.append("tags", meta.tags.join(","));
      }

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/angelflix/upload");

      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      if (xhr.upload && onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            if (res.success && res.media) {
              resolve(res.media);
            } else {
              reject(new Error(res.error || "Upload failed."));
            }
          } catch {
            reject(new Error("Invalid server response."));
          }
        } else {
          try {
            const res = JSON.parse(xhr.responseText);
            reject(new Error(res.error || `Upload failed with status ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network error during media upload."));
      };

      xhr.send(formData);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Update media details (title, category, etc.)
 */
export async function updateAngelFlixMedia(
  id: string,
  updates: Partial<AngelFlixMediaRecord>,
  tokenOverride?: string
): Promise<AngelFlixMediaRecord> {
  const token = await getAuthToken(tokenOverride);
  const res = await fetch(`/api/angelflix/media/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Update failed with status ${res.status}`);
  }

  const data = await res.json();
  return data.media;
}

/**
 * Delete media from Cloudinary and database
 */
export async function deleteAngelFlixMedia(
  id: string,
  tokenOverride?: string
): Promise<boolean> {
  const token = await getAuthToken(tokenOverride);
  const res = await fetch(`/api/angelflix/media/${id}`, {
    method: "DELETE",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Delete failed with status ${res.status}`);
  }

  const data = await res.json();
  return Boolean(data.success);
}
