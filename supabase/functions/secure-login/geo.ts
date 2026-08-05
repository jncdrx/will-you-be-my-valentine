// Approximate IP-based geolocation for the secure-login edge function.
// Uses free, no-key HTTPS APIs with graceful fallback to "Unknown".
// No GPS / device permissions are used (req 3).

export interface GeoInfo {
  ip: string | null;
  country: string;
  region: string;
  city: string;
}

function isPrivateIp(ip: string): boolean {
  if (!ip) return true;
  const v = ip.toLowerCase();
  if (v === "unknown" || v === "") return true;
  if (v === "::1" || v === "127.0.0.1" || v === "0.0.0.0") return true;
  // IPv4 private ranges
  const m = v.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const a = parseInt(m[1], 10);
    if (a === 10) return true;
    if (a === 172 && parseInt(m[2], 10) >= 16 && parseInt(m[2], 10) <= 31) return true;
    if (a === 192 && parseInt(m[2], 10) === 168) return true;
    if (a === 169 && parseInt(m[2], 10) === 254) return true;
    if (a === 100 && parseInt(m[2], 10) >= 64 && parseInt(m[2], 10) <= 127) return true;
  }
  if (v.startsWith("fc") || v.startsWith("fd")) return true; // IPv6 ULA
  return false;
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

export async function resolveGeo(ip: string | null): Promise<GeoInfo> {
  if (!ip || isPrivateIp(ip)) {
    return { ip, country: "Local", region: "Local", city: "Local" };
  }

  // Primary: ipwho.is (free, HTTPS, no key).
  try {
    const r = await fetchWithTimeout(`https://ipwho.is/${encodeURIComponent(ip)}`, 2500);
    if (r.ok) {
      const d = await r.json();
      if (d && d.success !== false && d.country) {
        return {
          ip,
          country: d.country || "Unknown",
          region: d.region || d.country || "Unknown",
          city: d.city || "Unknown",
        };
      }
    }
  } catch {
    // fall through
  }

  // Fallback: ipapi.co (free, HTTPS, rate-limited ~1k/day).
  try {
    const r = await fetchWithTimeout(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, 2500);
    if (r.ok) {
      const d = await r.json();
      if (d && !d.error && d.country_name) {
        return {
          ip,
          country: d.country_name || "Unknown",
          region: d.region || "Unknown",
          city: d.city || "Unknown",
        };
      }
    }
  } catch {
    // fall through
  }

  return { ip, country: "Unknown", region: "Unknown", city: "Unknown" };
}