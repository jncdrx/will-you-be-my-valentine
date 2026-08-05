import { createClient } from "@supabase/supabase-js";

// Environment variables loaded via Vite from .env / Vercel
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);

export interface MonthsaryResponse {
  id?: string;
  name: string;
  message: string;
  image_urls: string[];
  response_token: string;
  ticket_claimed?: boolean;
  ticket_claimed_at?: string;
  kissing_photo_url?: string;
  status?: string;
  user_agent?: string;
  created_at?: string;
  updated_at?: string;
}

// Generate secure random UUID token for response authorization
export const generateResponseToken = (): string => {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return "token_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
};

// Check if Supabase URL and Anon Key are actually configured
// Accepts both legacy JWT anon keys (eyJ...) and new publishable keys (sb_publishable_...)
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    !supabaseUrl.includes("your-supabase-project") &&
    supabaseAnonKey &&
    (supabaseAnonKey.startsWith("eyJ") || supabaseAnonKey.startsWith("sb_publishable_"))
  );
};

// Upload single reaction file to Supabase Storage bucket 'monthsary-reactions'
export async function uploadReactionImage(file: File, responseId: string): Promise<string> {
  if (!isSupabaseConfigured()) {
    // Local fallback: convert to base64 Data URL so preview works even without Supabase credentials set up!
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `responses/${responseId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("monthsary-reactions")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error, falling back to base64:", uploadError);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from("monthsary-reactions")
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error("Storage upload exception, falling back to base64:", err);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }
}

// Save or Update Angel's Response
export async function saveMonthsaryResponse(
  name: string,
  message: string,
  files: File[],
  existingToken?: string
): Promise<{ data: MonthsaryResponse | null; error: Error | null; token: string }> {
  const token = existingToken || generateResponseToken();
  const responseId = generateResponseToken();
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "Unknown Device";

  let uploadedUrls: string[] = [];

  // Upload images
  if (files && files.length > 0) {
    try {
      const uploadPromises = files.map((file) => uploadReactionImage(file, responseId));
      uploadedUrls = await Promise.all(uploadPromises);
    } catch (err) {
      console.error("Failed uploading reaction photos:", err);
    }
  }

  const record: MonthsaryResponse = {
    name,
    message,
    image_urls: uploadedUrls,
    response_token: token,
    status: "new",
    user_agent: userAgent,
  };

  const saveLocal = (): MonthsaryResponse => {
    const mockRecord: MonthsaryResponse = {
      ...record,
      id: responseId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(`monthsary_resp_${token}`, JSON.stringify(mockRecord));
    
    const allMockStr = localStorage.getItem("monthsary_all_responses") || "[]";
    try {
      const allMock: MonthsaryResponse[] = JSON.parse(allMockStr);
      allMock.push(mockRecord);
      localStorage.setItem("monthsary_all_responses", JSON.stringify(allMock));
    } catch {
      localStorage.setItem("monthsary_all_responses", JSON.stringify([mockRecord]));
    }
    return mockRecord;
  };

  if (!isSupabaseConfigured()) {
    const mockRecord = saveLocal();
    return { data: mockRecord, error: null, token };
  }

  try {
    const { data, error } = await supabase
      .from("monthsary_responses")
      .insert([record])
      .select()
      .single();

    if (error) {
      console.error("Supabase DB Insert error, saving locally:", error);
      const mockRecord = saveLocal();
      return { data: mockRecord, error: null, token };
    }

    return { data, error: null, token };
  } catch (err) {
    console.error("Supabase DB Exception, saving locally:", err);
    const mockRecord = saveLocal();
    return { data: mockRecord, error: null, token };
  }
}

// Retrieve response by secure token
export async function getResponseByToken(token: string): Promise<MonthsaryResponse | null> {
  const getLocal = (): MonthsaryResponse | null => {
    const local = localStorage.getItem(`monthsary_resp_${token}`);
    return local ? JSON.parse(local) : null;
  };

  if (!isSupabaseConfigured()) {
    return getLocal();
  }

  try {
    const { data, error } = await supabase
      .from("monthsary_responses")
      .select("*")
      .eq("response_token", token)
      .single();

    if (error) {
      console.error("Fetch by token error:", error);
      return getLocal();
    }

    return data;
  } catch {
    return getLocal();
  }
}

// Fetch all responses for authenticated Admin
export async function getAdminResponses(): Promise<MonthsaryResponse[]> {
  const getDeletedIds = (): Set<string> => {
    try {
      const deletedStr = localStorage.getItem("monthsary_deleted_responses") || "[]";
      return new Set<string>(JSON.parse(deletedStr));
    } catch {
      return new Set<string>();
    }
  };

  const getLocalResponses = (): MonthsaryResponse[] => {
    const allMockStr = localStorage.getItem("monthsary_all_responses") || "[]";
    try {
      return JSON.parse(allMockStr);
    } catch {
      return [];
    }
  };

  const deletedSet = getDeletedIds();
  const isDeleted = (r: MonthsaryResponse) =>
    Boolean(
      (r.id && deletedSet.has(r.id)) ||
        (r.response_token && deletedSet.has(r.response_token))
    );

  if (!isSupabaseConfigured()) {
    return getLocalResponses().filter((r) => !isDeleted(r));
  }

  try {
    const { data, error } = await supabase
      .from("monthsary_responses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Admin fetch error:", error);
      return getLocalResponses().filter((r) => !isDeleted(r));
    }

    const dbResponses = data || [];
    const local = getLocalResponses();
    const combinedMap = new Map<string, MonthsaryResponse>();

    dbResponses.forEach((r) => {
      if (!isDeleted(r)) {
        combinedMap.set(r.id || r.response_token, r);
      }
    });

    local.forEach((r) => {
      const key = r.id || r.response_token;
      if (!isDeleted(r) && !combinedMap.has(key)) {
        combinedMap.set(key, r);
      }
    });

    return Array.from(combinedMap.values());
  } catch (err) {
    console.error("Admin fetch exception:", err);
    return getLocalResponses().filter((r) => !isDeleted(r));
  }
}

// Delete response (Admin only)
export async function deleteAdminResponse(targetId: string): Promise<boolean> {
  if (!targetId) return false;

  // 1. Save to deleted list so future fetches ignore it
  try {
    const deletedStr = localStorage.getItem("monthsary_deleted_responses") || "[]";
    const deletedList: string[] = JSON.parse(deletedStr);
    if (!deletedList.includes(targetId)) {
      deletedList.push(targetId);
      localStorage.setItem("monthsary_deleted_responses", JSON.stringify(deletedList));
    }
  } catch (err) {
    console.error("Error updating deleted responses tracking:", err);
  }

  // 2. Clear local storage records
  try {
    const allMockStr = localStorage.getItem("monthsary_all_responses") || "[]";
    let allMock: MonthsaryResponse[] = JSON.parse(allMockStr);
    allMock = allMock.filter(
      (item) => item.id !== targetId && item.response_token !== targetId
    );
    localStorage.setItem("monthsary_all_responses", JSON.stringify(allMock));
    localStorage.removeItem(`monthsary_resp_${targetId}`);
  } catch (err) {
    console.error("Error clearing local response storage:", err);
  }

  // 3. Delete from Supabase DB if configured
  if (isSupabaseConfigured()) {
    try {
      const { error: errId } = await supabase
        .from("monthsary_responses")
        .delete()
        .eq("id", targetId);

      if (errId) {
        console.warn("Supabase delete by id failed, trying response_token:", errId);
        await supabase
          .from("monthsary_responses")
          .delete()
          .eq("response_token", targetId);
      }
    } catch (err) {
      console.error("Supabase delete exception:", err);
    }
  }

  return true;
}

// Verify Site Access Password against Supabase 'site_settings' table
export async function verifySitePassword(inputPassword: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return true;
  }

  try {
    // Attempt 1: Call RPC function if created
    const { data: rpcData, error: rpcError } = await supabase.rpc("verify_site_password", {
      input_password: inputPassword,
    });

    if (!rpcError && typeof rpcData === "boolean") {
      return rpcData;
    }

    // Attempt 2: Direct query to site_settings table
    const { data, error } = await supabase
      .from("site_settings")
      .select("key")
      .eq("key", "access_password")
      .eq("value", inputPassword)
      .maybeSingle();

    if (error) {
      console.error("Password verification DB error:", error);
      return false;
    }

    return Boolean(data);
  } catch (err) {
    console.error("Password verification exception:", err);
    return false;
  }
}

// Verify Allowed Email against Supabase 'site_settings' table or env variable
export async function verifyAllowedEmail(inputEmail: string): Promise<boolean> {
  const envEmail = import.meta.env.VITE_ALLOWED_EMAIL || "";
  const formatted = inputEmail.trim().toLowerCase();

  if (envEmail && formatted === envEmail.toLowerCase()) {
    return true;
  }

  if (!isSupabaseConfigured()) {
    return true;
  }

  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "allowed_email")
      .maybeSingle();

    if (!error && data?.value) {
      return formatted === data.value.trim().toLowerCase();
    }

    return true;
  } catch (err) {
    console.error("Email verification exception:", err);
    return true;
  }
}

export interface AngelUserData {
  user_id?: string;
  email?: string;
  name?: string;
  message?: string;
  image_urls?: string[];
  kissing_photo_url?: string;
  ticket_claimed?: boolean;
  ticket_claimed_at?: string;
  current_step?: string;
  answers?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

// Load Angel's authenticated state from Supabase table 'angel_user_data'
export async function loadAngelUserData(): Promise<AngelUserData | null> {
  const loadLocal = (): AngelUserData | null => {
    try {
      const saved = localStorage.getItem("angel_user_data");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };

  if (!isSupabaseConfigured()) {
    return loadLocal();
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    const sessionEmail = sessionData.session?.user?.email;

    let query = supabase.from("angel_user_data").select("*");
    if (userId) {
      query = query.eq("user_id", userId);
    } else if (sessionEmail) {
      query = query.eq("email", sessionEmail);
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      return loadLocal();
    }

    // Sync to local storage as fallback
    localStorage.setItem("angel_user_data", JSON.stringify(data));
    return data;
  } catch (err) {
    console.error("Load Angel user data exception:", err);
    return loadLocal();
  }
}

// Save or Update Angel's authenticated state in Supabase table 'angel_user_data'
export async function saveAngelUserData(update: Partial<AngelUserData>): Promise<boolean> {
  const saveLocal = () => {
    try {
      const existing = localStorage.getItem("angel_user_data");
      const current = existing ? JSON.parse(existing) : {};
      const merged = { ...current, ...update, updated_at: new Date().toISOString() };
      localStorage.setItem("angel_user_data", JSON.stringify(merged));
    } catch (e) {
      console.error("Save local angel user data error:", e);
    }
  };

  saveLocal();

  if (!isSupabaseConfigured()) {
    return true;
  }

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    const userEmail = sessionData.session?.user?.email;

    const payload = {
      ...update,
      ...(userEmail ? { email: userEmail } : {}),
      ...(userId ? { user_id: userId } : {}),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("angel_user_data")
      .upsert(payload, { onConflict: userId ? "user_id" : "id" });

    if (error) {
      console.error("Save Angel user data DB error:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Save Angel user data exception:", err);
    return false;
  }
}

/**
 * Helper to resolve the unique ID for the current logged-in user or session.
 */
export function getLoggedInUserId(responseData?: MonthsaryResponse): string {
  if (typeof window === "undefined") return "guest";

  // 1. Session email from auth gate
  const authEmail = sessionStorage.getItem("monthsary_angel_email");
  if (authEmail) {
    return authEmail.trim().toLowerCase();
  }

  // 2. ID / token from passed responseData
  if (responseData?.id) return responseData.id;
  if (responseData?.response_token) return responseData.response_token;

  // 3. Saved local token
  const token = localStorage.getItem("monthsary_angel_token");
  if (token) return token;

  // 4. Fallback persistent client ID per device/browser
  let clientId = localStorage.getItem("monthsary_client_id");
  if (!clientId) {
    clientId = "user_" + Math.random().toString(36).substring(2, 10) + "_" + Date.now();
    localStorage.setItem("monthsary_client_id", clientId);
  }
  return clientId;
}

/**
 * Check if the voucher ticket has already been claimed by a specific user ID.
 */
export async function checkUserTicketClaimStatus(userId?: string): Promise<boolean> {
  const targetId = userId || getLoggedInUserId();

  // Check local user-specific claim record
  const localClaimed = localStorage.getItem(`monthsary_ticket_claimed_${targetId}`);
  if (localClaimed === "true") return true;

  const userData = await loadAngelUserData();
  if (userData?.ticket_claimed) {
    localStorage.setItem(`monthsary_ticket_claimed_${targetId}`, "true");
    return true;
  }

  return false;
}

/**
 * Update ticket claim status and/or kissing photo URL for a SPECIFIC response by token or ID.
 */
export async function updateResponseTicketAndPhoto(
  responseToken: string,
  update: {
    ticket_claimed?: boolean;
    ticket_claimed_at?: string;
    kissing_photo_url?: string;
  }
): Promise<boolean> {
  if (!responseToken) return false;

  // 1. Update local storage 'monthsary_all_responses' for this specific response ONLY
  try {
    const allStr = localStorage.getItem("monthsary_all_responses") || "[]";
    const responses: MonthsaryResponse[] = JSON.parse(allStr);
    const updated = responses.map((r) => {
      if (r.response_token === responseToken || r.id === responseToken) {
        return {
          ...r,
          ...update,
          updated_at: new Date().toISOString(),
        };
      }
      return r;
    });
    localStorage.setItem("monthsary_all_responses", JSON.stringify(updated));
  } catch (err) {
    console.error("Error updating local response ticket:", err);
  }

  // 2. Update specific single response in local storage 'monthsary_resp_${token}'
  try {
    const singleStr = localStorage.getItem(`monthsary_resp_${responseToken}`);
    if (singleStr) {
      const single: MonthsaryResponse = JSON.parse(singleStr);
      const updatedSingle = { ...single, ...update, updated_at: new Date().toISOString() };
      localStorage.setItem(`monthsary_resp_${responseToken}`, JSON.stringify(updatedSingle));
    }
  } catch (err) {
    console.error("Error updating single local response:", err);
  }

  // 3. Update Supabase table 'monthsary_responses' for this specific response ONLY
  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from("monthsary_responses")
        .update({
          ...update,
          updated_at: new Date().toISOString(),
        })
        .or(`response_token.eq.${responseToken},id.eq.${responseToken}`);
    } catch (err) {
      console.error("Supabase response ticket update exception:", err);
    }
  }

  return true;
}

/**
 * Claim the voucher ticket ONCE for the specific user ID / response.
 * Returns true if successfully claimed or already claimed, false if error.
 */
export async function claimTicketForUser(userId?: string): Promise<boolean> {
  const targetId = userId || getLoggedInUserId();

  // Double check if already claimed
  const alreadyClaimed = await checkUserTicketClaimStatus(targetId);
  if (alreadyClaimed) {
    return true;
  }

  const nowIso = new Date().toISOString();
  localStorage.setItem(`monthsary_ticket_claimed_${targetId}`, "true");
  localStorage.setItem(`monthsary_ticket_claimed_at_${targetId}`, nowIso);
  localStorage.setItem("monthsary_angel_ticket_claimed", "true");
  localStorage.setItem("monthsary_angel_ticket_claimed_at", nowIso);

  const kissingPhoto = localStorage.getItem("monthsary_angel_kissing_photo") || "";

  // Update specific response ticket and photo ONLY
  await updateResponseTicketAndPhoto(targetId, {
    ticket_claimed: true,
    ticket_claimed_at: nowIso,
    ...(kissingPhoto ? { kissing_photo_url: kissingPhoto } : {}),
  });

  // Save to Supabase DB tied to user_id
  await saveAngelUserData({
    ticket_claimed: true,
    ticket_claimed_at: nowIso,
    user_id: targetId,
    ...(kissingPhoto ? { kissing_photo_url: kissingPhoto } : {}),
  });

  return true;
}

export const SUPPORTED_MUSIC_FILE_EXTENSIONS = [".mp3", ".wav", ".m4a"] as const;
export const SUPPORTED_MUSIC_MIME_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
]);
export const MAX_MUSIC_FILE_SIZE_BYTES = 15 * 1024 * 1024;

export function validateMusicFile(file: File): string | null {
  const lowerName = file.name.toLowerCase();
  const hasAllowedExtension = SUPPORTED_MUSIC_FILE_EXTENSIONS.some((extension) =>
    lowerName.endsWith(extension)
  );

  if (!hasAllowedExtension && !SUPPORTED_MUSIC_MIME_TYPES.has(file.type)) {
    return "Only MP3, WAV, or M4A files are supported.";
  }

  if (file.size > MAX_MUSIC_FILE_SIZE_BYTES) {
    return "File is too large. The maximum upload size is 15MB.";
  }

  return null;
}

export async function getAudioDurationFromFile(file: File): Promise<number> {
  if (typeof window === "undefined") return 0;

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.src = objectUrl;

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      audio.removeAttribute("src");
      audio.load();
    };

    audio.onloadedmetadata = () => {
      const duration = Number.isFinite(audio.duration) ? Math.max(0, Math.round(audio.duration)) : 0;
      cleanup();
      resolve(duration);
    };

    audio.onerror = () => {
      cleanup();
      reject(new Error("Could not read audio metadata from the selected file."));
    };

    audio.load();
  });
}

export async function hashMusicFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function uploadMusicFile(
  file: File,
  payload: { title?: string; artist?: string; existingId?: string },
  onProgress?: (percent: number) => void
): Promise<Song> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const validationError = validateMusicFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token;
  if (!accessToken) {
    throw new Error("You must be signed in as an admin to upload music.");
  }

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    if (payload.title) formData.append("title", payload.title);
    if (payload.artist) formData.append("artist", payload.artist);
    if (payload.existingId) formData.append("existingId", payload.existingId);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/music/upload");
    xhr.responseType = "json";
    xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.max(0, Math.min(100, Math.round((event.loaded / event.total) * 100)));
      onProgress?.(percent);
    };

    xhr.onload = () => {
      const body = (xhr.response ?? {}) as Partial<{ song: Song; error: string }>;
      if (xhr.status >= 200 && xhr.status < 300 && body.song) {
        onProgress?.(100);
        resolve(body.song);
        return;
      }

      reject(new Error(body.error || `Upload failed with status ${xhr.status}.`));
    };

    xhr.onerror = () => reject(new Error("Network error while uploading music."));
    xhr.send(formData);
  });
}

export async function updateSong(
  songId: string,
  patch: { title?: string; artist?: string }
): Promise<Song> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token;
  if (!accessToken) {
    throw new Error("You must be signed in as an admin to edit music.");
  }

  const response = await fetch(`/api/music/${songId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(patch),
  });

  const result = (await response.json().catch(() => ({}))) as Partial<{ song: Song; error: string }>;
  if (!response.ok || !result.song) {
    throw new Error(result.error || "Failed to update song.");
  }

  return result.song;
}

export function notifySongsChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("monthsary:songs-changed"));
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  youtube_url?: string | null;
  thumbnail_url?: string | null;
  mp3_url: string;
  duration: number;
  is_custom_upload?: boolean;
  file_name?: string | null;
  file_size_bytes?: number | null;
  audio_duration_seconds?: number | null;
  cloud_file_url?: string | null;
  upload_date?: string | null;
  storage_path?: string | null;
  file_hash?: string | null;
  mime_type?: string | null;
  created_at: string;
}

export async function fetchSongs(): Promise<Song[]> {
  if (!isSupabaseConfigured()) {
    const local = localStorage.getItem("monthsary_local_songs");
    return local ? JSON.parse(local) : [];
  }
  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching songs from Supabase:", error);
    const local = localStorage.getItem("monthsary_local_songs");
    return local ? JSON.parse(local) : [];
  }
  return data || [];
}

export async function saveSelectedSongId(songId: string, userId?: string): Promise<void> {
  localStorage.setItem("monthsary_selected_song_id", songId);
  const targetId = userId || getLoggedInUserId();
  if (isSupabaseConfigured() && targetId) {
    try {
      await supabase
        .from("angel_user_data")
        .update({ selected_song_id: songId, updated_at: new Date().toISOString() })
        .eq("user_id", targetId);
    } catch (err) {
      console.error("Error persisting selected_song_id to Supabase:", err);
    }
  }
}

export async function deleteSong(songId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const local = localStorage.getItem("monthsary_local_songs");
    if (local) {
      const songs: Song[] = JSON.parse(local);
      localStorage.setItem(
        "monthsary_local_songs",
        JSON.stringify(songs.filter((s) => s.id !== songId))
      );
    }
    return;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token;
  if (!accessToken) {
    throw new Error("You must be signed in as an admin to delete music.");
  }

  const response = await fetch(`/api/music/${songId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const result = (await response.json().catch(() => ({}))) as Partial<{ error: string }>;
  if (!response.ok) {
    throw new Error(result.error || "Failed to delete song.");
  }
}





