import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ send: vi.fn(), verify: vi.fn() }));
vi.mock("../../lib/auth", () => ({ RECIPIENT_EMAIL: "angelicogn@gmail.com", requestRecipientCode: mocks.send, verifyRecipientCode: mocks.verify }));
import { AngelAuthGate } from "../AngelAuthGate";

describe("email code sign-in", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.send.mockResolvedValue(undefined); mocks.verify.mockResolvedValue(undefined); });
  it("requests a code without unlocking, then verifies before unlocking", async () => {
    const unlocked = vi.fn(); render(<AngelAuthGate onUnlocked={unlocked} />);
    expect(screen.getByText("angelicogn@gmail.com")).toBeInTheDocument();
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /send me/i }));
    const input = await screen.findByLabelText("Email verification code");
    expect(unlocked).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /resend code in/i })).toBeDisabled();
    fireEvent.change(input, { target: { value: "123 456" } });
    fireEvent.click(screen.getByRole("button", { name: /verify & open/i }));
    await waitFor(() => expect(unlocked).toHaveBeenCalledOnce());
    expect(mocks.verify).toHaveBeenCalledWith("123456");
  });
  it("keeps the gate closed on send failure", async () => {
    mocks.send.mockRejectedValue(new Error("Email delivery unavailable"));
    const unlocked = vi.fn(); render(<AngelAuthGate onUnlocked={unlocked} />);
    fireEvent.click(screen.getByRole("button", { name: /send me/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Email delivery unavailable");
    expect(screen.queryByLabelText("Email verification code")).not.toBeInTheDocument();
    expect(unlocked).not.toHaveBeenCalled();
  });
  it("keeps an expired code editable and does not unlock", async () => {
    mocks.verify.mockRejectedValue(new Error("Code expired"));
    const unlocked = vi.fn(); render(<AngelAuthGate onUnlocked={unlocked} />);
    fireEvent.click(screen.getByRole("button", { name: /send me/i }));
    fireEvent.change(await screen.findByLabelText("Email verification code"), { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: /verify & open/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Code expired");
    expect(unlocked).not.toHaveBeenCalled();
  });
});
