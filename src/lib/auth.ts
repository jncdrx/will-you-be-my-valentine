import { supabase, isSupabaseConfigured } from "./supabase";

export type Role = "admin" | "user";

/**
 * Error thrown by the secure login flow. Carries structured fields the UI uses to
 * render "N attempts remaining" vs. the generic lockout message, without revealing
 * whether the email exists.
 */
export class LoginError extends Error {
  /** True when the account/IP is locked out (5 failed attempts or IP rate limit). */
  readonly locked: boolean;
  /** How many attempts remain before lockout (only meaningful when !locked). */
  readonly attemptsRemaining: number | null;

  constructor(message: string, opts: { locked?: boolean; attemptsRemaining?: number | null } = {}) {
    super(message);
    this.name = "LoginError";
    this.locked = Boolean(opts.locked);
    this.attemptsRemaining = opts.attemptsRemaining ?? null;
  }
}

interface SecureLoginResponse {
  success: boolean;
  locked?: boolean;
  attempts_remaining?: number;
  message?: string;
  session?: {
    access_token: string;
    refresh_token: string;
    expires_in?: number;
    expires_at?: number;
    user?: { email?: string } & Record<string, unknown>;
  } | null;
}

/**
 * Single backend-enforced login entry point. Calls the `secure-login` Supabase Edge
 * Function, which checks the lockout, verifies the password via the auth password
 * grant, records the attempt (IP/geo/device/OS/browser), and returns the session
 * or the remaining-attempt count. Lockout logic lives in Postgres RPCs (service
 * role only), so clearing browser data / changing routes / direct API calls cannot
 * bypass it.
 */
export async function secureLogin(
  email: string,
  password: string,
  role: Role
): Promise<{ user: { email?: string } & Record<string, unknown> }> {
  const formatted = email.trim().toLowerCase();
  if (!formatted || !password) throw new LoginError("Email and password are required.");
  if (!isSupabaseConfigured()) throw new LoginError("Supabase is not configured.");

  const { data, error } = await supabase.functions.invoke("secure-login", {
    body: { email: formatted, password, role },
  });

  if (error) {
    console.error("secure-login invoke error:", error);
    throw new LoginError("Sign-in failed. Please try again.");
  }

  const res = (data ?? {}) as SecureLoginResponse;
  if (res.success && res.session?.access_token && res.session?.refresh_token) {
    const { data: sessionData, error: sessionErr } = await supabase.auth.setSession({
      access_token: res.session.access_token,
      refresh_token: res.session.refresh_token,
    });
    if (sessionErr || !sessionData?.session) {
      console.error("setSession error:", sessionErr);
      throw new LoginError("Sign-in failed. Please try again.");
    }
    return { user: (sessionData.user ?? res.session.user ?? {}) as { email?: string } & Record<string, unknown> };
  }

  // Failure or lockout — surface structured info for the UI.
  if (res.locked) {
    throw new LoginError(res.message ?? "Too many failed login attempts. Please try again later.", {
      locked: true,
    });
  }
  throw new LoginError(res.message ?? "Incorrect email or password.", {
    attemptsRemaining: res.attempts_remaining ?? null,
  });
}

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  role: Role;
  created_at: string;
  updated_at: string;
}

/**
 * Get the current Supabase Auth user, if any.
 */
export async function getCurrentUser() {
  if (!isSupabaseConfigured()) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Get the current session.
 */
export async function getCurrentSession() {
  if (!isSupabaseConfigured()) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * Load the calling user's profile row from the `profiles` table.
 * Returns null if not authenticated or no profile row exists yet.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .maybeSingle();
  if (error) {
    console.error("getCurrentProfile error:", error);
    return null;
  }
  return data as Profile | null;
}

/**
 * Check admin role via the SECURITY DEFINER `is_admin()` RPC.
 * This is the single source of truth for admin authorization on the client.
 * (RLS and storage policies enforce the same check server-side.)
 */
export async function isAdmin(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const { data, error } = await supabase.rpc("is_admin");
  if (error) {
    console.error("isAdmin rpc error:", error);
    return false;
  }
  return Boolean(data);
}

/**
 * Allowed-email gate value (the recipient allowed to unlock the romantic site).
 * Kept in site_settings under key "allowed_email".
 */
export async function getAllowedEmail(): Promise<string | null> {
  const envEmail = import.meta.env.VITE_ALLOWED_EMAIL || "";
  if (envEmail) return envEmail.trim().toLowerCase();
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "allowed_email")
    .maybeSingle();
  if (error || !data?.value) return null;
  return data.value.trim().toLowerCase();
}

/**
 * Recipient (Angel) sign-in. Delegates password verification to the `secure-login`
 * edge function (backend-enforced lockout + audit logging), then verifies the
 * signed-in user's email matches the allowed recipient email (private site gate).
 * Throws a LoginError with a user-facing message on failure.
 */
export async function signInRecipient(
  email: string,
  password: string
): Promise<{ allowed: boolean; user: unknown | null }> {
  const formatted = email.trim().toLowerCase();
  const { user } = await secureLogin(formatted, password, "user");

  const allowedEmail = await getAllowedEmail();
  if (allowedEmail && formatted !== allowedEmail) {
    // Not the intended recipient — sign out and reject.
    await supabase.auth.signOut();
    throw new LoginError("Access restricted: This private website is created exclusively for Angel");
  }
  return { allowed: true, user };
}

/**
 * Admin sign-in. Delegates password verification to the `secure-login` edge function,
 * then verifies the `is_admin()` RPC. Returns true on success. On non-admin, signs the
 * user out and throws a LoginError.
 */
export async function signInAdmin(email: string, password: string): Promise<boolean> {
  const formatted = email.trim().toLowerCase();
  await secureLogin(formatted, password, "admin");

  const admin = await isAdmin();
  if (!admin) {
    await supabase.auth.signOut();
    throw new LoginError("This account does not have administrator access.");
  }
  return true;
}

export async function signOutAll(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error("signOutAll error:", err);
  }
}