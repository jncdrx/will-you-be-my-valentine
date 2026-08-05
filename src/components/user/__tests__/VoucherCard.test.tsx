import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VoucherCard } from "../VoucherCard";
import { Voucher } from "../../../lib/vouchers";

const base: Voucher = {
  id: "v1",
  recipient_id: "u1",
  created_by: null,
  title: "Premium Nail Care Session",
  description: "A treat for you",
  voucher_type: "nail",
  image_url: "https://example.com/img.jpg",
  instructions: "Show at the salon",
  status: "available",
  expires_at: null,
  sent_at: "2026-08-05T00:00:00.000Z",
  claimed_at: null,
  created_at: "2026-08-05T00:00:00.000Z",
  updated_at: "2026-08-05T00:00:00.000Z",
};

describe("VoucherCard", () => {
  it("renders title, message, and an available badge", () => {
    render(<VoucherCard voucher={base} onClaim={vi.fn()} />);
    expect(screen.getByText("Premium Nail Care Session")).toBeInTheDocument();
    expect(screen.getByText("A treat for you")).toBeInTheDocument();
    expect(screen.getByText("Available")).toBeInTheDocument();
  });

  it("shows the Claim Voucher button when available and calls onClaim", () => {
    const onClaim = vi.fn();
    render(<VoucherCard voucher={base} onClaim={onClaim} />);
    const btn = screen.getByRole("button", { name: /claim voucher/i });
    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);
    expect(onClaim).toHaveBeenCalledWith(base);
  });

  it("disables claiming when already claimed and shows the claim timestamp", () => {
    const claimed: Voucher = { ...base, status: "claimed", claimed_at: "2026-08-05T10:00:00.000Z" };
    render(<VoucherCard voucher={claimed} onClaim={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /claim voucher/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Claimed on/i)).toBeInTheDocument();
  });

  it("shows expired messaging when expiry is in the past", () => {
    const expired: Voucher = {
      ...base,
      status: "available",
      expires_at: "2020-01-01T00:00:00.000Z",
    };
    render(<VoucherCard voucher={expired} onClaim={vi.fn()} />);
    expect(screen.getByText("This voucher has expired.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /claim voucher/i })).not.toBeInTheDocument();
  });

  it("shows cancelled messaging", () => {
    render(<VoucherCard voucher={{ ...base, status: "cancelled" }} onClaim={vi.fn()} />);
    expect(screen.getByText("This voucher was cancelled.")).toBeInTheDocument();
  });
});