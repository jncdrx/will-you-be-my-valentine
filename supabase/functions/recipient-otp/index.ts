import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EMAIL = "angelicogn@gmail.com";
const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json", "Cache-Control": "no-store" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return json({});
  if (req.method !== "POST") return json({ success: false }, 405);
  try {
    const { action, token } = await req.json();
    if (action !== "send" && action !== "verify") return json({ success: false, message: "Invalid request." }, 400);
    if (Deno.env.get("RECIPIENT_OTP_EMAIL_READY") !== "true") return json({ success: false, message: "Email code sign-in is being set up. Please try again once email delivery is enabled." });
    if (action === "verify" && (typeof token !== "string" || !/^\d{6,10}$/.test(token))) return json({ success: false, message: "Enter the code from your email." }, 400);
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
    const { data: lock, error: lockError } = await admin.rpc("check_login_lockout", { p_identifier: EMAIL, p_ip: ip });
    if (lockError) return json({ success: false, message: "Sign-in is temporarily unavailable." });
    if (lock?.locked) return json({ success: false, message: "Too many attempts. Please try again later." });

    // Use Auth's public endpoints so its send cooldown, expiry and verification
    // rate limits apply. Never generate, store, log or return an OTP ourselves.
    const response = await fetch(`${url}/auth/v1/${action === "send" ? "otp" : "verify"}`, {
      method: "POST",
      headers: { apikey: anon, "Content-Type": "application/json", "X-Forwarded-For": ip },
      body: JSON.stringify(action === "send" ? { email: EMAIL, create_user: false } : { email: EMAIL, token: typeof token === "string" ? token : "", type: "email" }),
    });
    if (action === "send") return json({ success: response.ok, message: response.ok ? undefined : response.status === 429 ? "Please wait before requesting another code." : "Could not send the code. Please try again later." });
    const result = await response.json();
    const success = response.ok && result.user?.email?.toLowerCase() === EMAIL && Boolean(result.access_token && result.refresh_token);
    const { error: auditError } = await admin.rpc("record_login_attempt", {
      p_identifier: EMAIL, p_ip: ip, p_role: "user", p_status: success ? "success" : "failed",
      p_user_agent: req.headers.get("user-agent") || "", p_country: null, p_region: null, p_city: null,
      p_device: "unknown", p_os: "unknown", p_browser: "unknown", p_browser_version: "",
    });
    if (auditError) return json({ success: false, message: "Sign-in is temporarily unavailable." });
    return success ? json({ success: true, session: { access_token: result.access_token, refresh_token: result.refresh_token } }) : json({ success: false, message: "That code is invalid or expired. Try again or request a new code." });
  } catch {
    return json({ success: false, message: "Sign-in is temporarily unavailable. Please try again." });
  }
});
