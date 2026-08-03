import { createClient } from "@supabase/supabase-js";

// Environment variables loaded via Vite from .env / .env.local (or GitHub Secrets)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

// Check if Supabase URL is actually configured with a valid endpoint
const isSupabaseConfigured = () => {
  return (
    supabaseUrl &&
    !supabaseUrl.includes("your-supabase-project")
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
    console.error("Storage upload error:", uploadError);
    throw uploadError;
  }

  const { data: publicUrlData } = supabase.storage
    .from("monthsary-reactions")
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
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
      return { data: null, error: err as Error, token };
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

  if (!isSupabaseConfigured()) {
    // Local Storage Mock Fallback
    const mockRecord: MonthsaryResponse = {
      ...record,
      id: responseId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(`monthsary_resp_${token}`, JSON.stringify(mockRecord));
    
    // Also save in local responses array for demo admin view
    const allMockStr = localStorage.getItem("monthsary_all_responses") || "[]";
    const allMock: MonthsaryResponse[] = JSON.parse(allMockStr);
    allMock.push(mockRecord);
    localStorage.setItem("monthsary_all_responses", JSON.stringify(allMock));

    return { data: mockRecord, error: null, token };
  }

  // Insert to Supabase DB
  const { data, error } = await supabase
    .from("monthsary_responses")
    .insert([record])
    .select()
    .single();

  if (error) {
    console.error("Supabase DB Insert error:", error);
    return { data: null, error, token };
  }

  return { data, error: null, token };
}

// Retrieve response by secure token
export async function getResponseByToken(token: string): Promise<MonthsaryResponse | null> {
  if (!isSupabaseConfigured()) {
    const local = localStorage.getItem(`monthsary_resp_${token}`);
    return local ? JSON.parse(local) : null;
  }

  const { data, error } = await supabase
    .from("monthsary_responses")
    .select("*")
    .eq("response_token", token)
    .single();

  if (error) {
    console.error("Fetch by token error:", error);
    return null;
  }

  return data;
}

// Fetch all responses for authenticated Admin
export async function getAdminResponses(): Promise<MonthsaryResponse[]> {
  if (!isSupabaseConfigured()) {
    const allMockStr = localStorage.getItem("monthsary_all_responses") || "[]";
    return JSON.parse(allMockStr);
  }

  const { data, error } = await supabase
    .from("monthsary_responses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Admin fetch error:", error);
    return [];
  }

  return data || [];
}

// Delete response (Admin only)
export async function deleteAdminResponse(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    const allMockStr = localStorage.getItem("monthsary_all_responses") || "[]";
    let allMock: MonthsaryResponse[] = JSON.parse(allMockStr);
    allMock = allMock.filter((item) => item.id !== id);
    localStorage.setItem("monthsary_all_responses", JSON.stringify(allMock));
    return true;
  }

  const { error } = await supabase.from("monthsary_responses").delete().eq("id", id);
  return !error;
}
