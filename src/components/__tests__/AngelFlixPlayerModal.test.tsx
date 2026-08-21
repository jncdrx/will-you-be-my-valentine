import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AngelFlixPlayerModal } from "../AngelFlixPlayerModal";
import { angelflixConfig } from "../../config/angelflixConfig";

describe("AngelFlixPlayerModal", () => {
  const mockItem = angelflixConfig.recentMemories[0];

  it("renders memory details and title when open", () => {
    render(
      <AngelFlixPlayerModal
        item={mockItem}
        isOpen={true}
        onClose={vi.fn()}
        onNext={vi.fn()}
        onPrev={vi.fn()}
      />
    );
    expect(screen.getByRole("heading", { name: "First Date" })).toBeInTheDocument();
    expect(screen.getByText(mockItem.subtitle!)).toBeInTheDocument();
  });

  it("triggers onClose when close button clicked", () => {
    const handleClose = vi.fn();
    render(
      <AngelFlixPlayerModal
        item={mockItem}
        isOpen={true}
        onClose={handleClose}
        onNext={vi.fn()}
        onPrev={vi.fn()}
      />
    );
    const closeBtn = screen.getByLabelText("Close cinema player");
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledOnce();
  });
});
