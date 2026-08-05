// Supabase Edge Function: secure-login
// Single backend-enforced login endpoint for both Admin and User (Angel) logins.
//
// Flow:
//   1. Read client IP + User-Agent from request headers (server-side, not spoofable by
//      clearing browser state).
//   2. Parse device/OS/browser from UA; resolve approximate IP-based location.
//   3. service-role RPC check_login_lockout(email, ip) — locked or rate-limited?
//        - locked  -> log a 'locked' audit row, return generic lockout message.
//   4. Password grant: POST {SUPABASE_URL}/auth/v1/token?grant_type=password (anon key).
//   5. service-role RPC record_login_attempt(...) -> updated lockout state.
//   6. Return session tokens (success) / "N attempts remaining" (failed) / lockout msg.
//
// The client never touches login_attempts; lockout/record RPCs are service_role only.
// No passwords or tokens are ever stored in login_attempts (req 15).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { parseUserAgent } from "./ua.ts";
import { resolveGeo } from "./geo.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const LOCKOUT_MESSAGE = "Too many failed login attempts. Please try again later.";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function clientIp(req: Request): string | null {
  const headers = req.headers;
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip") ?? headers.get("cf-connecting-ip") ?? null;
}

interface Body {
  email?: unknown;
  password?: unknown;
  role?: unknown;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return json({}, 200);

  if (req.method !== "POST") {
    return json({ success: false, message: "Method not allowed." }, 405);
  }

  if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) {
    return json({ success: false, message: "Server is not configured." }, 500);
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ success: false, message: "Invalid request body." }, 400);
  }

  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const role = String(body.role ?? "user");
  if (!email || !password) {
    return json({ success: false, message: "Email and password are required." }, 400);
  }
  if (role !== "admin" && role !== "user") {
    return json({ success: false, message: "Invalid role." }, 400);
  }

  // --- Server-side context (not client-supplied) ---
  const ip = clientIp(req);
  const userAgent = req.headers.get("user-agent") ?? "";
  const ua = parseUserAgent(userAgent);
  const geo = await resolveGeo(ip);

  // service-role client: bypasses RLS for login_attempts reads/writes via RPCs.
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // --- Pre-check lockout ---
  let lockState: { locked?: boolean; attempts_remaining?: number; locked_until?: string };
  try {
    const { data, error } = await admin.rpc("check_login_lockout", {
      p_identifier: email,
      p_ip: ip ?? "",
    });
    if (error) throw error;
    lockState = (data ?? {}) as typeof lockState;
  } catch (err) {
    console.error("check_login_lockout error:", err);
    // Fail closed: don't allow login if the lockout check is unavailable.
    return json({ success: false, message: "Login is temporarily unavailable." }, 503);
  }

  if (lockState.locked) {
    // Audit the rejected attempt without touching the password grant.
    try {
      await admin.rpc("record_login_attempt", {
        p_identifier: email,
        p_role: role,
        p_status: "locked",
        p_ip: ip ?? "",
        p_country: geo.country,
        p_region: geo.region,
        p_city: geo.city,
        p_device: ua.device_type,
        p_os: ua.os,
        p_browser: ua.browser,
        p_browser_version: ua.browser_version,
        p_user_agent: userAgent,
      });
    } catch (err) {
      console.error("record locked attempt error:", err);
    }
    return json({ success: false, locked: true, message: LOCKOUT_MESSAGE });
  }

  // --- Password grant via Supabase Auth (anon key) ---
  let authOk = false;
  let session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    expires_at?: number;
    user?: unknown;
  } | null = null;

  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "apikey": ANON_KEY,
        "Authorization": `Bearer ${ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    if (r.ok) {
      authOk = true;
      const d = await r.json();
      session = {
        access_token: d.access_token,
        refresh_token: d.refresh_token,
        expires_in: d.expires_in,
        expires_at: d.expires_at,
        user: d.user,
      };
    }
  } catch (err) {
    console.error("password grant error:", err);
  }

  // --- Record the attempt and get updated lockout state ---
  try {
    const { data } = await admin.rpc("record_login_attempt", {
      p_identifier: email,
      p_role: role,
      p_status: authOk ? "success" : "failed",
      p_ip: ip ?? "",
      p_country: geo.country,
      p_region: geo.region,
      p_city: geo.city,
      p_device: ua.device_type,
      p_os: ua.os,
      p_browser: ua.browser,
      p_browser_version: ua.browser_version,
      p_user_agent: userAgent,
    });
    lockState = (data ?? lockState) as typeof lockState;
  } catch (err) {
    console.error("record_login_attempt error:", err);
  }

  if (authOk && session) {
    return json({ success: true, session });
  }

  // Failed credentials — but the 5th failure may have just triggered a lockout.
  if (lockState?.locked) {
    return json({ success: false, locked: true, message: LOCKOUT_MESSAGE });
  }
  const remaining = Math.max(0, Number(lockState?.attempts_remaining ?? 0));
  return json({
    success: false,
    locked: false,
    attempts_remaining: remaining,
    message:
      remaining > 0
        ? `Incorrect email or password. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
        : "Incorrect email or password.",
  });
});