// Lightweight User-Agent parser for the secure-login edge function.
// Self-contained (no external deps) — covers the common browsers, OSes and
// desktop/mobile/tablet heuristics. Good enough for audit logging; not a
// full UA database. Mirrors the parser unit-tested in src/lib/__tests__/ua.test.ts.

export interface ParsedUA {
  device_type: "desktop" | "mobile" | "tablet" | "other";
  os: string;
  browser: string;
  browser_version: string;
}

export function parseUserAgent(raw: string | null | undefined): ParsedUA {
  const ua = (raw || "").trim();
  const lower = ua.toLowerCase();

  // ---- Device type ----
  let device_type: ParsedUA["device_type"] = "desktop";
  if (/\b(ipad|tablet|playbook|silk)\b/i.test(ua) || /android(?!.*mobile)/i.test(lower)) {
    device_type = "tablet";
  } else if (/\b(mobile|iphone|ipod|android.*mobile|windows phone|blackberry|opera mini|iemobile)\b/i.test(lower)) {
    device_type = "mobile";
  } else if (ua === "") {
    device_type = "other";
  }

  // ---- OS ----
  let os = "Unknown";
  if (/windows nt 10/.test(lower)) os = "Windows 10/11";
  else if (/windows nt 6\.3/.test(lower)) os = "Windows 8.1";
  else if (/windows nt 6\.2/.test(lower)) os = "Windows 8";
  else if (/windows nt 6\.1/.test(lower)) os = "Windows 7";
  else if (/windows/.test(lower)) os = "Windows";
  else if (/iphone os (\d+)/.test(lower) || /cpu os (\d+)/.test(lower)) {
    const m = ua.match(/(?:iphone os|cpu os) (\d+)/i);
    os = m ? `iOS ${m[1]}` : "iOS";
  } else if (/ipad/.test(lower)) os = "iPadOS";
  else if (/mac os x/i.test(ua)) {
    const m = ua.match(/mac os x (\d+)[_\.](\d+)/i);
    os = m ? `macOS ${m[1]}.${m[2]}` : "macOS";
  } else if (/android (\d+)/.test(lower)) {
    const m = ua.match(/android (\d+)/i);
    os = m ? `Android ${m[1]}` : "Android";
  } else if (/linux/.test(lower)) os = "Linux";
  else if (/cros/.test(lower)) os = "ChromeOS";

  // ---- Browser + version ----
  // Order matters: Edg before Chrome, OPR before Chrome, etc.
  let browser = "Unknown";
  let browser_version = "";

  const tryBrowser = (re: RegExp, name: string): boolean => {
    const m = ua.match(re);
    if (m) {
      browser = name;
      browser_version = m[1] || "";
      return true;
    }
    return false;
  };

  if (tryBrowser(/edg\/(\d+(?:\.\d+)*)/i, "Edge")) {
    // keep
  } else if (tryBrowser(/opr\/(\d+(?:\.\d+)*)/i, "Opera")) {
    // keep
  } else if (tryBrowser(/opera\/(\d+(?:\.\d+)*)/i, "Opera")) {
    // keep
  } else if (tryBrowser(/samsungbrowser\/(\d+(?:\.\d+)*)/i, "Samsung Internet")) {
    // keep
  } else if (tryBrowser(/firefox\/(\d+(?:\.\d+)*)/i, "Firefox")) {
    // keep
  } else if (tryBrowser(/fxios\/(\d+(?:\.\d+)*)/i, "Firefox")) {
    // keep
  } else if (tryBrowser(/crios\/(\d+(?:\.\d+)*)/i, "Chrome")) {
    // keep
  } else if (tryBrowser(/chrome\/(\d+(?:\.\d+)*)/i, "Chrome")) {
    // keep
  } else if (tryBrowser(/version\/(\d+(?:\.\d+)*)\s.*safari/i, "Safari")) {
    // keep
  } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
    browser = "Safari";
  }

  return { device_type, os, browser, browser_version };
}