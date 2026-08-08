import { describe, it, expect } from "vitest";
import { voucherSchema, effectiveStatus, isClaimable, Voucher, formatEndOfDayIso } from "../vouchers";

describe("voucherSchema", () => {
  const valid = {
    title: "Premium Nail Care Session",
    description: "A treat for you",
    voucher_type: "nail" as const,
    instructions: "Show this at the salon.",
    recipient_id: "00000000-0000-0000-0000-000000000000",
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    image_url: "https://example.com/img.jpg",
  };

  it("accepts a fully valid voucher", () => {
    expect(voucherSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts a non-expiring voucher with null expires_at", () => {
    expect(voucherSchema.safeParse({ ...valid, expires_at: null }).success).toBe(true);
  });

  it("rejects an empty title", () => {
    const r = voucherSchema.safeParse({ ...valid, title: "   " });
    expect(r.success).toBe(false);
  });

  it("rejects a title longer than 120 chars", () => {
    const r = voucherSchema.safeParse({ ...valid, title: "x".repeat(121) });
    expect(r.success).toBe(false);
  });

  it("rejects an unknown voucher type", () => {
    const r = voucherSchema.safeParse({ ...valid, voucher_type: "spa" });
    expect(r.success).toBe(false);
  });

  it("rejects a missing/invalid recipient_id", () => {
    expect(voucherSchema.safeParse({ ...valid, recipient_id: "" }).success).toBe(false);
    expect(voucherSchema.safeParse({ ...valid, recipient_id: "not-a-uuid" }).success).toBe(
      false
    );
  });

  it("rejects a description longer than 2000 chars", () => {
    const r = voucherSchema.safeParse({ ...valid, description: "x".repeat(2001) });
    expect(r.success).toBe(false);
  });
});

describe("effectiveStatus / isClaimable", () => {
  const base: Voucher = {
    id: "v1",
    recipient_id: "u1",
    created_by: null,
    title: "T",
    description: null,
    voucher_type: "nail",
    image_url: null,
    instructions: null,
    status: "available",
    expires_at: null,
    sent_at: null,
    claimed_at: null,
    created_at: "",
    updated_at: "",
  };

  it("treats available + past expiry as expired", () => {
    const v: Voucher = { ...base, status: "available", expires_at: new Date(Date.now() - 1000).toISOString() };
    expect(effectiveStatus(v)).toBe("expired");
    expect(isClaimable(v)).toBe(false);
  });

  it("available + future expiry is claimable", () => {
    const v: Voucher = { ...base, status: "available", expires_at: new Date(Date.now() + 10000).toISOString() };
    expect(effectiveStatus(v)).toBe("available");
    expect(isClaimable(v)).toBe(true);
  });

  it("available + no expiry is claimable (forever valid)", () => {
    expect(isClaimable(base)).toBe(true);
  });

  it("claimed is not claimable", () => {
    const v: Voucher = { ...base, status: "claimed", claimed_at: new Date().toISOString() };
    expect(isClaimable(v)).toBe(false);
  });

  it("redeemed is not claimable and returns redeemed status", () => {
    const v: Voucher = { ...base, status: "redeemed" };
    expect(effectiveStatus(v)).toBe("redeemed");
    expect(isClaimable(v)).toBe(false);
  });

  it("cancelled is not claimable", () => {
    const v: Voucher = { ...base, status: "cancelled" };
    expect(isClaimable(v)).toBe(false);
  });
});

describe("formatEndOfDayIso", () => {
  it("returns null for empty/null inputs", () => {
    expect(formatEndOfDayIso(null)).toBeNull();
    expect(formatEndOfDayIso(undefined)).toBeNull();
    expect(formatEndOfDayIso("")).toBeNull();
  });

  it("formats YYYY-MM-DD date to 23:59:59.999Z ISO string", () => {
    expect(formatEndOfDayIso("2026-08-08")).toBe("2026-08-08T23:59:59.999Z");
  });

  it("keeps ISO strings with T intact", () => {
    const iso = "2026-08-08T12:00:00.000Z";
    expect(formatEndOfDayIso(iso)).toBe(iso);
  });
});