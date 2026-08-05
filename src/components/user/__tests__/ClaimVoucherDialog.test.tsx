import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ClaimVoucherDialog } from "../ClaimVoucherDialog";
import { Voucher } from "../../../lib/vouchers";

vi.mock("canvas-confetti", () => ({
  default: vi.fn(() => undefined),
}));

const claimVoucherMock = vi.fn();
vi.mock("../../../lib/vouchers", async () => {
  const actual = await vi.importActual("../../../lib/vouchers");
  return { ...actual, claimVoucher: (...args: unknown[]) => claimVoucherMock(...args) };
});

const voucher: Voucher = {
  id: "v1",
  recipient_id: "u1",
  created_by: null,
  title: "Nail Voucher",
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

describe("ClaimVoucherDialog", () => {
  beforeEach(() => {
    claimVoucherMock.mockReset();
  });

  it("does not render when voucher is null", () => {
    render(<ClaimVoucherDialog voucher={null} onClose={vi.fn()} onClaimed={vi.fn()} />);
    expect(screen.queryByText(/Claim this voucher/i)).not.toBeInTheDocument();
  });

  it("confirms, calls claimVoucher, and fires onClaimed", async () => {
    claimVoucherMock.mockResolvedValue({ id: "v1", claimed_at: "2026-08-05T00:00:00.000Z" });
    const onClaimed = vi.fn();
    render(<ClaimVoucherDialog voucher={voucher} onClose={vi.fn()} onClaimed={onClaimed} />);

    fireEvent.click(screen.getByRole("button", { name: /claim it/i }));
    await waitFor(() => expect(claimVoucherMock).toHaveBeenCalledWith("v1"));
    await waitFor(() => expect(onClaimed).toHaveBeenCalledWith("v1"));
  });

  it("shows success state after a successful claim", async () => {
    claimVoucherMock.mockResolvedValue({ id: "v1", claimed_at: "2026-08-05T00:00:00.000Z" });
    render(<ClaimVoucherDialog voucher={voucher} onClose={vi.fn()} onClaimed={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /claim it/i }));
    await waitFor(() => expect(screen.getByText(/Claimed!/i)).toBeInTheDocument());
  });

  it("blocks a double claim while loading (button disabled)", async () => {
    let resolve: (v: unknown) => void = () => {};
    claimVoucherMock.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      })
    );
    render(<ClaimVoucherDialog voucher={voucher} onClose={vi.fn()} onClaimed={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /claim it/i }));
    const btn = await screen.findByRole("button", { name: /claiming/i });
    expect(btn).toBeDisabled();
    // Resolve to unblock cleanup
    resolve({ id: "v1", claimed_at: "now" });
  });
});