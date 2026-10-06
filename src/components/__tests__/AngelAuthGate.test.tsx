import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ signIn: vi.fn() }));
vi.mock("../../lib/auth", () => ({ RECIPIENT_EMAIL: "angelicogn@gmail.com", signInRecipient: mocks.signIn }));
import { AngelAuthGate } from "../AngelAuthGate";

describe("password sign-in", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.signIn.mockResolvedValue({ allowed: true, user: {} }); });
  it("signs in the fixed recipient with the password and unlocks", async () => {
    const unlocked = vi.fn(); render(<AngelAuthGate onUnlocked={unlocked} />);
    expect(screen.getByText("angelicogn@gmail.com")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret" } });
    fireEvent.click(screen.getByRole("button", { name: /open my page/i }));
    await waitFor(() => expect(unlocked).toHaveBeenCalledOnce());
    expect(mocks.signIn).toHaveBeenCalledWith("angelicogn@gmail.com", "secret");
  });
  it("shows the error and stays locked on a wrong password", async () => {
    mocks.signIn.mockRejectedValue(new Error("Incorrect email or password."));
    const unlocked = vi.fn(); render(<AngelAuthGate onUnlocked={unlocked} />);
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "nope" } });
    fireEvent.click(screen.getByRole("button", { name: /open my page/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Incorrect email or password.");
    expect(unlocked).not.toHaveBeenCalled();
  });
});
