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
  const getLocalResponses = (): MonthsaryResponse[] => {
    const allMockStr = localStorage.getItem("monthsary_all_responses") || "[]";
    try {
      return JSON.parse(allMockStr);
    } catch {
      return [];
    }
  };

  if (!isSupabaseConfigured()) {
    return getLocalResponses();
  }

  try {
    const { data, error } = await supabase
      .from("monthsary_responses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Admin fetch error:", error);
      return getLocalResponses();
    }

    const dbResponses = data || [];
    const local = getLocalResponses();
    const combinedMap = new Map<string, MonthsaryResponse>();
    dbResponses.forEach((r) => combinedMap.set(r.id || r.response_token, r));
    local.forEach((r) => {
      const key = r.id || r.response_token;
      if (!combinedMap.has(key)) {
        combinedMap.set(key, r);
      }
    });

    return Array.from(combinedMap.values());
  } catch (err) {
    console.error("Admin fetch exception:", err);
    return getLocalResponses();
  }
}

// Delete response (Admin only)
export async function deleteAdminResponse(id: string): Promise<boolean> {
  const allMockStr = localStorage.getItem("monthsary_all_responses") || "[]";
  try {
    let allMock: MonthsaryResponse[] = JSON.parse(allMockStr);
    allMock = allMock.filter((item) => item.id !== id && item.response_token !== id);
    localStorage.setItem("monthsary_all_responses", JSON.stringify(allMock));
  } catch (err) {
    console.error("Error clearing local response:", err);
  }

  if (!isSupabaseConfigured()) {
    return true;
  }

  try {
    const { error } = await supabase.from("monthsary_responses").delete().eq("id", id);
    return !error;
  } catch {
    return true;
  }
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


