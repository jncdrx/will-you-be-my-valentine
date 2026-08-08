/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  Voucher,
  isClaimable,
  createVoucher,
  deleteVoucher,
  listMyVouchers,
  listAllVouchers,
  claimVoucher,
  redeemVoucher,
  recordVoucherView,
  listActivity,
} from "../lib/vouchers";
import {
  signInRecipient,
  signInAdmin,
  signOutAll,
  isAdmin,
  getAllowedEmail,
} from "../lib/auth";
import {
  fetchSongs,
  saveSelectedSongId,
} from "../lib/supabase";

// Mock Supabase module to simulate full backend database RPCs, RLS, and Auth sessions
const mockUserAngel = { id: "user-angel-id", email: "angelicogn@gmail.com" };
const mockUserAdmin = { id: "user-admin-id", email: "admin@example.com" };
let currentSessionUser: { id: string; email: string } | null = mockUserAngel;

const mockDatabase = {
  profiles: [
    { id: "user-angel-id", email: "angelicogn@gmail.com", display_name: "Angel", role: "user" },
    { id: "user-admin-id", email: "admin@example.com", display_name: "Admin Boyfriend", role: "admin" },
  ],
  vouchers: [] as Voucher[],
  voucher_activity: [] as Array<{
    id: string;
    voucher_id: string;
    user_id: string | null;
    action: string;
    metadata: Record<string, unknown>;
    created_at: string;
  }>,
  site_settings: [
    { key: "allowed_email", value: "angelicogn@gmail.com" },
    { key: "admin_email", value: "admin@example.com" },
  ],
  angel_user_data: null as Record<string, unknown> | null,
  songs: [
    { id: "song-1", title: "Love Song 1", artist: "Artist A", audio_url: "https://example.com/s1.mp3" },
    { id: "song-2", title: "Love Song 2", artist: "Artist B", audio_url: "https://example.com/s2.mp3" },
  ],
};

vi.mock("../lib/supabase", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../lib/supabase")>();
  return {
    ...mod,
    isSupabaseConfigured: () => true,
    supabase: {
      auth: {
        getUser: vi.fn(async () => ({ data: { user: currentSessionUser }, error: null })),
        getSession: vi.fn(async () => ({
          data: { session: currentSessionUser ? { user: currentSessionUser, access_token: "tok", refresh_token: "ref" } : null },
          error: null,
        })),
        setSession: vi.fn(async ({ access_token }) => {
          if (!access_token) return { data: { session: null }, error: new Error("invalid") };
          return { data: { session: { user: currentSessionUser } }, error: null };
        }),
        signOut: vi.fn(async () => {
          currentSessionUser = null;
          return { error: null };
        }),
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      },
      functions: {
        invoke: vi.fn(async (fnName, options) => {
          if (fnName === "secure-login") {
            const { email, password } = options.body;
            if (email === "angelicogn@gmail.com" && password === "correct_pass") {
              currentSessionUser = mockUserAngel;
              return { data: { success: true, session: { access_token: "tok", refresh_token: "ref", user: mockUserAngel } }, error: null };
            }
            if (email === "admin@example.com" && password === "admin_pass") {
              currentSessionUser = mockUserAdmin;
              return { data: { success: true, session: { access_token: "tok", refresh_token: "ref", user: mockUserAdmin } }, error: null };
            }
            return { data: { success: false, locked: false, attempts_remaining: 4, message: "Incorrect password" }, error: null };
          }
          return { data: null, error: new Error("Unknown function") };
        }),
      },
      from: vi.fn((table: string) => {
        return {
          select: vi.fn(() => {
            const chain: any = {
              eq: vi.fn((col: string, val: any) => {
                chain._eqCol = col;
                chain._eqVal = val;
                return chain;
              }),
              neq: vi.fn((col: string, val: any) => {
                chain._neqCol = col;
                chain._neqVal = val;
                return chain;
              }),
              order: vi.fn(() => chain),
              maybeSingle: vi.fn(async () => {
                if (table === "site_settings" && chain._eqCol === "key") {
                  const found = mockDatabase.site_settings.find((s) => s.key === chain._eqVal);
                  return { data: found || null, error: null };
                }
                if (table === "profiles") {
                  const found = mockDatabase.profiles.find((p) => p.id === currentSessionUser?.id);
                  return { data: found || null, error: null };
                }
                return { data: null, error: null };
              }),
              single: vi.fn(async () => {
                if (table === "vouchers" && chain._eqCol === "id") {
                  const found = mockDatabase.vouchers.find((v) => v.id === chain._eqVal);
                  return { data: found || null, error: null };
                }
                return { data: null, error: null };
              }),
              then: (resolve: any) => {
                if (table === "profiles") {
                  resolve({ data: mockDatabase.profiles, error: null });
                  return;
                }
                if (table === "vouchers") {
                  let filtered = [...mockDatabase.vouchers];
                  if (chain._eqCol === "recipient_id") {
                    filtered = filtered.filter((v) => v.recipient_id === chain._eqVal);
                  }
                  if (chain._neqCol === "status") {
                    filtered = filtered.filter((v) => v.status !== chain._neqVal);
                  }
                  // Join recipient
                  const joined = filtered.map((v) => {
                    const rec = mockDatabase.profiles.find((p) => p.id === v.recipient_id);
                    return { ...v, recipient: rec ? { email: rec.email, display_name: rec.display_name } : null };
                  });
                  resolve({ data: joined, error: null });
                  return;
                }
                if (table === "voucher_activity") {
                  let filtered = [...mockDatabase.voucher_activity];
                  if (chain._eqCol === "voucher_id") {
                    filtered = filtered.filter((a) => a.voucher_id === chain._eqVal);
                  }
                  resolve({ data: filtered, error: null });
                  return;
                }
                if (table === "songs") {
                  resolve({ data: mockDatabase.songs, error: null });
                  return;
                }
                if (table === "angel_user_data") {
                  resolve({ data: mockDatabase.angel_user_data ? [mockDatabase.angel_user_data] : [], error: null });
                  return;
                }
                resolve({ data: [], error: null });
              },
            };
            return chain;
          }),
          insert: vi.fn((rows: any[]) => {
            return {
              select: vi.fn(() => ({
                single: vi.fn(async () => {
                  const created = {
                    id: `vouch-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    claimed_at: null,
                    ...rows[0],
                  };
                  if (table === "vouchers") {
                    mockDatabase.vouchers.push(created);
                  } else if (table === "voucher_activity") {
                    mockDatabase.voucher_activity.push({ id: `act-${Date.now()}`, ...rows[0], created_at: new Date().toISOString() });
                  }
                  return { data: created, error: null };
                }),
              })),
              then: (resolve: any) => {
                if (table === "voucher_activity") {
                  rows.forEach((r) => {
                    mockDatabase.voucher_activity.push({ id: `act-${Date.now()}`, ...r, created_at: new Date().toISOString() });
                  });
                }
                resolve({ data: rows, error: null });
              },
            };
          }),
          update: vi.fn((patch: any) => {
            return {
              eq: vi.fn((col: string, val: any) => {
                if (table === "vouchers" && col === "id") {
                  const found = mockDatabase.vouchers.find((v) => v.id === val);
                  if (found) {
                    Object.assign(found, patch, { updated_at: new Date().toISOString() });
                  }
                }
                return {
                  select: vi.fn(() => ({
                    single: vi.fn(async () => {
                      const found = mockDatabase.vouchers.find((v) => v.id === val);
                      return { data: found || null, error: null };
                    }),
                  })),
                  then: (resolve: any) => resolve({ data: null, error: null }),
                };
              }),
            };
          }),
          delete: vi.fn(() => ({
            eq: vi.fn((col: string, val: any) => {
              if (table === "vouchers" && col === "id") {
                const idx = mockDatabase.vouchers.findIndex((v) => v.id === val);
                if (idx !== -1) mockDatabase.vouchers.splice(idx, 1);
              }
              return Promise.resolve({ data: null, error: null });
            }),
          })),
        };
      }),
      rpc: vi.fn(async (rpcName: string, params: Record<string, any>) => {
        if (rpcName === "is_admin") {
          return { data: currentSessionUser?.email === "admin@example.com", error: null };
        }
        if (rpcName === "claim_voucher") {
          const v = mockDatabase.vouchers.find((item) => item.id === params.p_voucher_id);
          if (!v) {
            return { data: null, error: new Error("claim_failed: voucher does not exist") };
          }
          if (v.recipient_id !== currentSessionUser?.id) {
            return { data: null, error: new Error("claim_failed: voucher not assigned to you") };
          }
          if (v.status !== "available") {
            return { data: null, error: new Error("claim_failed: voucher is not available") };
          }
          if (v.expires_at && new Date(v.expires_at) <= new Date()) {
            return { data: null, error: new Error("claim_failed: voucher is expired") };
          }

          v.status = "claimed";
          v.claimed_at = new Date().toISOString();
          v.updated_at = new Date().toISOString();

          mockDatabase.voucher_activity.push({
            id: `act-${Date.now()}`,
            voucher_id: v.id,
            user_id: currentSessionUser.id,
            action: "claimed",
            metadata: { claimed_at: v.claimed_at },
            created_at: v.claimed_at,
          });

          return { data: [{ id: v.id, status: "claimed", claimed_at: v.claimed_at }], error: null };
        }
        if (rpcName === "redeem_voucher") {
          if (currentSessionUser?.email !== "admin@example.com") {
            return { data: null, error: new Error("insufficient_privilege: admin access required") };
          }
          const v = mockDatabase.vouchers.find((item) => item.id === params.p_voucher_id);
          if (!v || v.status !== "claimed") {
            return { data: null, error: new Error("redeem_failed: voucher is not in claimed status") };
          }

          v.status = "redeemed";
          v.updated_at = new Date().toISOString();

          mockDatabase.voucher_activity.push({
            id: `act-${Date.now()}`,
            voucher_id: v.id,
            user_id: currentSessionUser.id,
            action: "redeemed",
            metadata: { redeemed_at: v.updated_at },
            created_at: v.updated_at,
          });

          return { data: [{ id: v.id, status: "redeemed" }], error: null };
        }
        if (rpcName === "record_voucher_view") {
          if (!currentSessionUser) return { data: false, error: null };
          const v = mockDatabase.vouchers.find((item) => item.id === params.p_voucher_id);
          if (v && (v.recipient_id === currentSessionUser.id || currentSessionUser.email === "admin@example.com")) {
            mockDatabase.voucher_activity.push({
              id: `act-${Date.now()}`,
              voucher_id: v.id,
              user_id: currentSessionUser.id,
              action: "viewed",
              metadata: { viewed_at: new Date().toISOString() },
              created_at: new Date().toISOString(),
            });
            return { data: true, error: null };
          }
          return { data: false, error: null };
        }
        if (rpcName === "mark_expired_vouchers") {
          let count = 0;
          const now = new Date();
          for (const v of mockDatabase.vouchers) {
            if (v.status === "available" && v.expires_at && new Date(v.expires_at) <= now) {
              v.status = "expired";
              count++;
            }
          }
          return { data: count, error: null };
        }
        return { data: null, error: null };
      }),
    },
  };
});

describe("Comprehensive E2E Integration Suite for All System Functions", () => {
  beforeEach(() => {
    mockDatabase.vouchers = [];
    mockDatabase.voucher_activity = [];
    mockDatabase.angel_user_data = null;
    currentSessionUser = mockUserAngel;
  });

  describe("1. Authentication & Security Gate E2E", () => {
    it("allows valid recipient Angel to sign in", async () => {
      const res = await signInRecipient("angelicogn@gmail.com", "correct_pass");
      expect(res.allowed).toBe(true);
      expect(currentSessionUser?.email).toBe("angelicogn@gmail.com");
    });

    it("rejects unauthorized recipient email attempting access", async () => {
      await expect(signInRecipient("imposter@example.com", "wrong_pass")).rejects.toThrow(
        "Incorrect password"
      );
    });

    it("allows admin sign-in and verifies is_admin authorization", async () => {
      const res = await signInAdmin("admin@example.com", "admin_pass");
      expect(res).toBe(true);
      expect(await isAdmin()).toBe(true);
    });

    it("fetches allowed email setting", async () => {
      const email = await getAllowedEmail();
      expect(email).toBe("angelicogn@gmail.com");
    });

    it("clears user session on signOutAll", async () => {
      await signOutAll();
      expect(currentSessionUser).toBeNull();
    });
  });

  describe("2. Full Voucher Lifecycle E2E Flow (Create -> Send -> View -> Claim -> Redeem -> Delete)", () => {
    it("executes the complete admin -> user -> claim -> redeem pipeline", async () => {
      // Step A: Admin signs in
      await signInAdmin("admin@example.com", "admin_pass");

      // Step B: Admin creates & sends a new voucher to Angel expiring today
      const todayDateStr = new Date().toISOString().slice(0, 10);
      const newVoucher = await createVoucher({
        title: "Exclusive Dinner Date",
        description: "A romantic night out 💕",
        voucher_type: "food",
        instructions: "Show this to your boyfriend",
        recipient_id: mockUserAngel.id,
        expires_at: todayDateStr, // End-of-day boundary fix ensures this does not expire immediately!
        send: true,
      });

      expect(newVoucher).not.toBeNull();
      expect(newVoucher?.status).toBe("available");
      expect(newVoucher?.expires_at).toContain("T23:59:59.999Z"); // Verified boundary fix!

      // Step C: User Angel signs in
      currentSessionUser = mockUserAngel;

      // Step D: Angel lists her vouchers & records view activity
      const angelVouchers = await listMyVouchers();
      expect(angelVouchers).toHaveLength(1);
      expect(angelVouchers[0].title).toBe("Exclusive Dinner Date");
      expect(isClaimable(angelVouchers[0])).toBe(true);

      const viewLogged = await recordVoucherView(angelVouchers[0].id);
      expect(viewLogged).toBe(true);

      // Step E: Angel claims the voucher
      const claimResult = await claimVoucher(angelVouchers[0].id);
      expect(claimResult.id).toBe(angelVouchers[0].id);
      expect(claimResult.claimed_at).toBeTruthy();

      // Verify status flipped to claimed in database
      const claimedVoucherInDb = mockDatabase.vouchers.find((v) => v.id === angelVouchers[0].id);
      expect(claimedVoucherInDb?.status).toBe("claimed");
      expect(isClaimable(claimedVoucherInDb!)).toBe(false);

      // Step F: Attempting double-claim fails atomically
      await expect(claimVoucher(angelVouchers[0].id)).rejects.toThrow("claim_failed: voucher is not available");

      // Step G: Admin logs in & views all vouchers + activity log
      currentSessionUser = mockUserAdmin;
      const allVouchers = await listAllVouchers();
      expect(allVouchers).toHaveLength(1);
      expect(allVouchers[0].status).toBe("claimed");
      expect(allVouchers[0].recipient?.email).toBe("angelicogn@gmail.com");

      const activityLog = await listActivity(angelVouchers[0].id);
      expect(activityLog.some((a) => a.action === "claimed")).toBe(true);
      expect(activityLog.some((a) => a.action === "viewed")).toBe(true);

      // Step H: Admin redeems the claimed voucher
      const redeemResult = await redeemVoucher(angelVouchers[0].id);
      expect(redeemResult.status).toBe("redeemed");
      expect(claimedVoucherInDb?.status).toBe("redeemed");

      // Step I: Admin deletes the voucher permanently
      const deleted = await deleteVoucher(angelVouchers[0].id);
      expect(deleted).toBe(true);
      expect(mockDatabase.vouchers).toHaveLength(0);
    });

    it("prevents User A from claiming a voucher assigned to User B", async () => {
      // Admin creates voucher for Angel
      currentSessionUser = mockUserAdmin;
      const voucher = await createVoucher({
        title: "Personal Massage",
        voucher_type: "custom",
        recipient_id: mockUserAngel.id,
        send: true,
      });

      // Other User attempts to claim
      currentSessionUser = { id: "user-other-id", email: "other@example.com" };
      await expect(claimVoucher(voucher!.id)).rejects.toThrow("claim_failed: voucher not assigned to you");
    });
  });

  describe("3. Music Catalogue & Response Data System", () => {
    it("fetches songs list", async () => {
      const songs = await fetchSongs();
      expect(songs.length).toBeGreaterThan(0);
      expect(songs[0].title).toBeTruthy();
    });

    it("saves selected song ID in localStorage", () => {
      saveSelectedSongId("song-1");
      expect(localStorage.getItem("monthsary_selected_song_id")).toBe("song-1");
    });
  });
});
