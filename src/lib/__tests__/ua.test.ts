import { describe, it, expect } from "vitest";
import { parseUserAgent } from "../../../supabase/functions/secure-login/ua";

describe("parseUserAgent", () => {
  it("detects Windows + Chrome desktop", () => {
    const r = parseUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    );
    expect(r.device_type).toBe("desktop");
    expect(r.os).toBe("Windows 10/11");
    expect(r.browser).toBe("Chrome");
    expect(r.browser_version).toBe("124.0.0.0");
  });

  it("detects macOS + Safari desktop", () => {
    const r = parseUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15"
    );
    expect(r.device_type).toBe("desktop");
    expect(r.os).toMatch(/^macOS/);
    expect(r.browser).toBe("Safari");
    expect(r.browser_version).toBe("17.4");
  });

  it("detects iPhone (mobile + iOS)", () => {
    const r = parseUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1"
    );
    expect(r.device_type).toBe("mobile");
    expect(r.os).toBe("iOS 17");
    expect(r.browser).toBe("Safari");
  });

  it("detects Android tablet", () => {
    const r = parseUserAgent(
      "Mozilla/5.0 (Linux; Android 13; SM-X910) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    );
    expect(r.device_type).toBe("tablet");
    expect(r.os).toBe("Android 13");
    expect(r.browser).toBe("Chrome");
  });

  it("detects Android phone", () => {
    const r = parseUserAgent(
      "Mozilla/5.0 (Linux; Android 14; SM-S918U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36"
    );
    expect(r.device_type).toBe("mobile");
    expect(r.os).toBe("Android 14");
  });

  it("detects Edge on Windows", () => {
    const r = parseUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.2438.67"
    );
    expect(r.browser).toBe("Edge");
    expect(r.browser_version).toBe("124.0.2438.67");
  });

  it("detects Firefox", () => {
    const r = parseUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0"
    );
    expect(r.browser).toBe("Firefox");
    expect(r.browser_version).toBe("125.0");
  });

  it("returns other/Unknown for empty UA", () => {
    const r = parseUserAgent("");
    expect(r.device_type).toBe("other");
    expect(r.browser).toBe("Unknown");
    expect(r.os).toBe("Unknown");
  });
});