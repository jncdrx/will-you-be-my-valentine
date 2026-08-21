import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ExperienceHub } from "../ExperienceHub";

describe("ExperienceHub", () => {
  it("renders both experience choices (Love Letter and AngelFlix)", () => {
    render(
      <ExperienceHub
        onSelectExperience={vi.fn()}
        onLogout={vi.fn()}
        unclaimedVoucherCount={2}
        isPlayingMusic={false}
        onToggleMusic={vi.fn()}
      />
    );
    expect(screen.getByText("The Love Letter")).toBeInTheDocument();
    expect(screen.getByText("AngelFlix Cinema")).toBeInTheDocument();
  });

  it("calls onSelectExperience with 'letter' when clicking love letter card", () => {
    const handleSelect = vi.fn();
    render(
      <ExperienceHub
        onSelectExperience={handleSelect}
        onLogout={vi.fn()}
        unclaimedVoucherCount={0}
        isPlayingMusic={false}
        onToggleMusic={vi.fn()}
      />
    );
    const letterCard = screen.getByText("The Love Letter").closest("button") || screen.getByText("The Love Letter");
    fireEvent.click(letterCard);
    expect(handleSelect).toHaveBeenCalledWith("letter");
  });

  it("calls onSelectExperience with 'angelflix' when clicking angelflix card", () => {
    const handleSelect = vi.fn();
    render(
      <ExperienceHub
        onSelectExperience={handleSelect}
        onLogout={vi.fn()}
        unclaimedVoucherCount={0}
        isPlayingMusic={false}
        onToggleMusic={vi.fn()}
      />
    );
    const angelflixCard = screen.getByText("AngelFlix Cinema").closest("button") || screen.getByText("AngelFlix Cinema");
    fireEvent.click(angelflixCard);
    expect(handleSelect).toHaveBeenCalledWith("angelflix");
  });
});
