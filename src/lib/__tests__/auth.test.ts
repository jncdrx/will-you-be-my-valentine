import { describe, it, expect, vi, beforeEach } from "vitest";
import { LoginError } from "../auth";

// Mock the supabase module. The secure-login flow uses functions.invoke + auth.setSession;
// signInRecipient still reads the allowed email via supabase.from('site_settings').
const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  setSession: vi.fn(),
  signOut: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: { value: "angel@example.com" }, error: null }),
        })),
        maybeSingle: vi.fn().mockResolvedValue({ data: { value: "angel@example.com" }, error: null }),
      })),
    })),
  })),
}));

vi.mock("../supabase", () => ({
  supabase: {
    auth: {
      setSession: mocks.setSession,
      signOut: mocks.signOut,
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
    },
    functions: { invoke: mocks.invoke },
    rpc: mocks.rpc,
    from: mocks.from,
  },
  isSupabaseConfigured: () => true,
}));

const { invoke, setSession, signOut, rpc } = mocks;
import { signInRecipient, signInAdmin, isAdmin } from "../auth";

function okSession(email: string) {
  return {
    success: true,
    session: {
      access_token: "at",
      refresh_token: "rt",
      expires_in: 3600,
      user: { email },
    },
  };
}

describe("signInRecipient", () => {
  beforeEach(() => {
    invoke.mockReset();
    setSession.mockReset();
    signOut.mockReset();
  });

  it("succeeds for the allowed email", async () => {
    invoke.mockResolvedValue({ data: okSession("angel@example.com"), error: null });
    setSession.mockResolvedValue({ data: { session: { user: { email: "angel@example.com" } } }, error: null });
    const res = await signInRecipient("angel@example.com", "pw");
    expect(res.allowed).toBe(true);
    expect(setSession).toHaveBeenCalledWith({ access_token: "at", refresh_token: "rt" });
  });

  it("throws LoginError when email does not match the allowed email", async () => {
    invoke.mockResolvedValue({ data: okSession("someone-else@example.com"), error: null });
    setSession.mockResolvedValue({
      data: { session: { user: { email: "someone-else@example.com" } } },
      error: null,
    });
    await expect(signInRecipient("someone-else@example.com", "pw")).rejects.toMatchObject({
      name: "LoginError",
      message: expect.stringMatching(/Access restricted/i),
    });
    expect(signOut).toHaveBeenCalled();
  });

  it("surfaces attempts-remaining LoginError on invalid credentials", async () => {
    invoke.mockResolvedValue({
      data: { success: false, locked: false, attempts_remaining: 3, message: "Incorrect email or password. 3 attempts remaining." },
      error: null,
    });
    await expect(signInRecipient("angel@example.com", "wrong")).rejects.toMatchObject({
      name: "LoginError",
      locked: false,
      attemptsRemaining: 3,
    });
    expect(setSession).not.toHaveBeenCalled();
  });

  it("surfaces a locked LoginError (no email-existence leak) when locked", async () => {
    invoke.mockResolvedValue({
      data: { success: false, locked: true, message: "Too many failed login attempts. Please try again later." },
      error: null,
    });
    await expect(signInRecipient("angel@example.com", "pw")).rejects.toMatchObject({
      name: "LoginError",
      locked: true,
    });
  });

  it("throws a generic LoginError on invoke failure", async () => {
    invoke.mockResolvedValue({ data: null, error: { message: "network" } });
    await expect(signInRecipient("angel@example.com", "pw")).rejects.toThrow(/Sign-in failed/i);
  });
});

describe("signInAdmin", () => {
  beforeEach(() => {
    invoke.mockReset();
    setSession.mockReset();
    signOut.mockReset();
    rpc.mockReset();
  });

  it("succeeds when is_admin returns true", async () => {
    invoke.mockResolvedValue({ data: okSession("admin@example.com"), error: null });
    setSession.mockResolvedValue({ data: { session: { user: { id: "a1" } } }, error: null });
    rpc.mockResolvedValue({ data: true, error: null });
    await expect(signInAdmin("admin@example.com", "pw")).resolves.toBe(true);
  });

  it("rejects and signs out when not an admin", async () => {
    invoke.mockResolvedValue({ data: okSession("regular@example.com"), error: null });
    setSession.mockResolvedValue({ data: { session: { user: { id: "a1" } } }, error: null });
    rpc.mockResolvedValue({ data: false, error: null });
    await expect(signInAdmin("regular@example.com", "pw")).rejects.toMatchObject({
      name: "LoginError",
      message: expect.stringMatching(/administrator access/i),
    });
    expect(signOut).toHaveBeenCalled();
  });

  it("surfaces lockout before the admin check", async () => {
    invoke.mockResolvedValue({ data: { success: false, locked: true, message: "Too many failed login attempts. Please try again later." }, error: null });
    await expect(signInAdmin("admin@example.com", "pw")).rejects.toMatchObject({ locked: true });
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe("isAdmin", () => {
  beforeEach(() => rpc.mockReset());

  it("returns true when the RPC returns true", async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    expect(await isAdmin()).toBe(true);
  });

  it("returns false when the RPC returns false", async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    expect(await isAdmin()).toBe(false);
  });

  it("returns false on RPC error", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    expect(await isAdmin()).toBe(false);
  });
});

describe("LoginError", () => {
  it("carries locked + attemptsRemaining", () => {
    const e = new LoginError("msg", { locked: true, attemptsRemaining: 0 });
    expect(e.locked).toBe(true);
    expect(e.attemptsRemaining).toBe(0);
    expect(e.message).toBe("msg");
  });
});