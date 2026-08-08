import { z } from "zod";
import { supabase, isSupabaseConfigured } from "./supabase";

export type VoucherType = "nail" | "journal_leather" | "food" | "gift" | "custom";
export type VoucherStatus = "draft" | "available" | "claimed" | "redeemed" | "expired" | "cancelled";

export const VOUCHER_TYPE_LABELS: Record<VoucherType, string> = {
  nail: "Nail Voucher",
  journal_leather: "Journal Leather Material Voucher",
  food: "Food Voucher",
  gift: "Gift Voucher",
  custom: "Custom Voucher",
};

export interface Voucher {
  id: string;
  recipient_id: string;
  created_by: string | null;
  title: string;
  description: string | null;
  voucher_type: VoucherType;
  image_url: string | null;
  instructions: string | null;
  status: VoucherStatus;
  expires_at: string | null;
  sent_at: string | null;
  claimed_at: string | null;
  created_at: string;
  updated_at: string;
  // joined recipient (admin view)
  recipient?: { email: string; display_name: string | null } | null;
}

export interface VoucherActivity {
  id: string;
  voucher_id: string;
  user_id: string | null;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface RecipientProfile {
  id: string;
  email: string;
  display_name: string | null;
}

// ---------------------------------------------------------------------------
// Validation (frontend)
// ---------------------------------------------------------------------------
export const voucherSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120, "Title is too long"),
  description: z.string().max(2000, "Description is too long").optional().or(z.literal("")),
  voucher_type: z.enum(["nail", "journal_leather", "food", "gift", "custom"]),
  instructions: z.string().max(2000, "Instructions are too long").optional().or(z.literal("")),
  recipient_id: z.string().uuid("Select a recipient"),
  expires_at: z.string().nullable(),
  image_url: z.string().nullable().optional(),
});

export type VoucherInput = z.infer<typeof voucherSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export function effectiveStatus(v: Voucher): VoucherStatus {
  if (v.status === "available" && v.expires_at && new Date(v.expires_at) <= new Date()) {
    return "expired";
  }
  return v.status;
}

export function isClaimable(v: Voucher): boolean {
  return effectiveStatus(v) === "available";
}

export function formatEndOfDayIso(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  if (dateStr.includes("T")) return dateStr;
  return new Date(`${dateStr}T23:59:59.999Z`).toISOString();
}

// ---------------------------------------------------------------------------
// Image upload to the 'vouchers' storage bucket (admin only via RLS policy)
// ---------------------------------------------------------------------------
export async function uploadVoucherImage(file: File): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    // Local fallback (data URL) so the form is usable without credentials configured.
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("vouchers").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) {
    console.error("Voucher image upload error:", error);
    throw new Error(error.message);
  }
  const { data } = supabase.storage.from("vouchers").getPublicUrl(path);
  return data.publicUrl;
}

// ---------------------------------------------------------------------------
// Recipient list (admin)
// ---------------------------------------------------------------------------
export async function listProfiles(): Promise<RecipientProfile[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, display_name")
    .order("email", { ascending: true });
  if (error) {
    console.error("listProfiles error:", error);
    return [];
  }
  return (data || []) as RecipientProfile[];
}

// ---------------------------------------------------------------------------
// Recipient queries
// ---------------------------------------------------------------------------
export async function listMyVouchers(): Promise<Voucher[]> {
  if (!isSupabaseConfigured()) return [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("vouchers")
    .select("*")
    .eq("recipient_id", user.id)
    .neq("status", "draft")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("listMyVouchers error:", error);
    return [];
  }
  return (data || []) as Voucher[];
}

// ---------------------------------------------------------------------------
// Admin queries
// ---------------------------------------------------------------------------
export async function listAllVouchers(): Promise<Voucher[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from("vouchers")
    .select("*, recipient:profiles!vouchers_recipient_id_fkey(email, display_name)")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("listAllVouchers error:", error);
    return [];
  }
  return (data || []) as Voucher[];
}

export async function listActivity(voucherId: string): Promise<VoucherActivity[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from("voucher_activity")
    .select("*")
    .eq("voucher_id", voucherId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("listActivity error:", error);
    return [];
  }
  return (data || []) as VoucherActivity[];
}

// ---------------------------------------------------------------------------
// Admin mutations
// ---------------------------------------------------------------------------
export interface CreateVoucherPayload {
  title: string;
  description?: string;
  voucher_type: VoucherType;
  image_url?: string | null;
  instructions?: string;
  recipient_id: string;
  expires_at?: string | null;
  send: boolean; // true = status 'available' + sent_at; false = status 'draft'
}

export async function createVoucher(payload: CreateVoucherPayload): Promise<Voucher | null> {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const now = new Date().toISOString();
  const row = {
    recipient_id: payload.recipient_id,
    created_by: user?.id ?? null,
    title: payload.title.trim(),
    description: payload.description?.trim() || null,
    voucher_type: payload.voucher_type,
    image_url: payload.image_url ?? null,
    instructions: payload.instructions?.trim() || null,
    expires_at: formatEndOfDayIso(payload.expires_at),
    status: payload.send ? "available" : "draft",
    sent_at: payload.send ? now : null,
  };
  const { data, error } = await supabase
    .from("vouchers")
    .insert([row])
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  const created = data as Voucher;
  await insertActivity(created.id, "created", {
    as_draft: !payload.send,
    voucher_type: payload.voucher_type,
  });
  if (payload.send) {
    await insertActivity(created.id, "sent", { sent_at: now });
  }
  return created;
}

export async function updateVoucher(
  id: string,
  patch: Partial<CreateVoucherPayload> & { send?: boolean }
): Promise<Voucher | null> {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) update.title = patch.title.trim();
  if (patch.description !== undefined) update.description = patch.description.trim() || null;
  if (patch.voucher_type !== undefined) update.voucher_type = patch.voucher_type;
  if (patch.image_url !== undefined) update.image_url = patch.image_url ?? null;
  if (patch.instructions !== undefined) update.instructions = patch.instructions.trim() || null;
  if (patch.recipient_id !== undefined) update.recipient_id = patch.recipient_id;
  if (patch.expires_at !== undefined) update.expires_at = formatEndOfDayIso(patch.expires_at);

  // Sending a previously-draft voucher
  if (patch.send) {
    update.status = "available";
    update.sent_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("vouchers")
    .update(update)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await insertActivity(id, "edited", { fields: Object.keys(update) });
  if (patch.send) await insertActivity(id, "sent", { sent_at: update.sent_at });
  return data as Voucher;
}

export async function cancelVoucher(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
  const { error } = await supabase
    .from("vouchers")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  await insertActivity(id, "cancelled", {});
  return true;
}

/**
 * Permanently delete a voucher (admin only, enforced by RLS).
 * voucher_activity rows cascade-delete via ON DELETE CASCADE.
 * The voucher immediately disappears from the recipient's view.
 */
export async function deleteVoucher(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
  const { error } = await supabase.from("vouchers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return true;
}

/** Create a fresh copy of an existing voucher, sent immediately. */
export async function resendVoucher(sourceId: string): Promise<Voucher | null> {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
  const { data: src, error } = await supabase
    .from("vouchers")
    .select("*")
    .eq("id", sourceId)
    .single();
  if (error || !src) throw new Error("Could not load the original voucher.");
  const s = src as Voucher;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const now = new Date().toISOString();
  const row = {
    recipient_id: s.recipient_id,
    created_by: user?.id ?? null,
    title: s.title,
    description: s.description,
    voucher_type: s.voucher_type,
    image_url: s.image_url,
    instructions: s.instructions,
    expires_at: s.expires_at,
    status: "available",
    sent_at: now,
  };
  const { data, error: insErr } = await supabase
    .from("vouchers")
    .insert([row])
    .select("*")
    .single();
  if (insErr) throw new Error(insErr.message);
  const created = data as Voucher;
  await insertActivity(created.id, "resend", { from_voucher_id: sourceId, sent_at: now });
  return created;
}

async function insertActivity(
  voucherId: string,
  action: string,
  metadata: Record<string, unknown>
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  try {
    await supabase.from("voucher_activity").insert([
      {
        voucher_id: voucherId,
        user_id: user?.id ?? null,
        action,
        metadata,
      },
    ]);
  } catch (err) {
    console.error("insertActivity error:", err);
  }
}

// ---------------------------------------------------------------------------
// Claim (atomic RPC)
// ---------------------------------------------------------------------------
export async function claimVoucher(
  voucherId: string
): Promise<{ id: string; claimed_at: string }> {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.rpc("claim_voucher", { p_voucher_id: voucherId });
  if (error) {
    console.error("claimVoucher error:", error);
    throw new Error(error.message || "This voucher can no longer be claimed.");
  }
  if (!data || (Array.isArray(data) && data.length === 0)) {
    throw new Error("This voucher can no longer be claimed.");
  }
  const row = Array.isArray(data) ? data[0] : data;
  return { id: row.id, claimed_at: row.claimed_at };
}

export async function redeemVoucher(
  voucherId: string
): Promise<{ id: string; status: VoucherStatus }> {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.rpc("redeem_voucher", { p_voucher_id: voucherId });
  if (error) {
    console.error("redeemVoucher error:", error);
    throw new Error(error.message || "Failed to redeem voucher.");
  }
  const row = Array.isArray(data) ? data[0] : data;
  return { id: row.id, status: row.status };
}

export async function recordVoucherView(voucherId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const { data, error } = await supabase.rpc("record_voucher_view", { p_voucher_id: voucherId });
  if (error) {
    console.error("recordVoucherView error:", error);
    return false;
  }
  return Boolean(data);
}

export async function markExpiredVouchers(): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  const { data, error } = await supabase.rpc("mark_expired_vouchers");
  if (error) {
    console.error("markExpiredVouchers error:", error);
    return 0;
  }
  return typeof data === "number" ? data : 0;
}

// ---------------------------------------------------------------------------
// Realtime subscriptions
// ---------------------------------------------------------------------------
/**
 * Subscribe to voucher changes for the current recipient (or all, for admin).
 * Returns an unsubscribe function.
 */
export function subscribeVouchers(
  opts: { recipientId?: string; isAdmin?: boolean },
  onChange: () => void
): () => void {
  if (!isSupabaseConfigured()) return () => {};
  const channel = supabase
    .channel(`vouchers-${opts.recipientId || "admin"}-${Math.random().toString(36).slice(2, 7)}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "vouchers" },
      () => onChange()
    )
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "voucher_activity" },
      () => onChange()
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}