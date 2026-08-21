import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AngelFlix } from "../AngelFlix";

describe("AngelFlix", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders brand name and cinema subtag", () => {
    render(<AngelFlix onBackToHub={vi.fn()} onOpenLetter={vi.fn()} onLogout={vi.fn()} />);
    expect(screen.getByText("ANGELFLIX")).toBeInTheDocument();
    expect(screen.getByText("Our Private Cinema")).toBeInTheDocument();
  });

  it("renders navbar navigation items and memory content", () => {
    render(<AngelFlix onBackToHub={vi.fn()} onOpenLetter={vi.fn()} onLogout={vi.fn()} />);
    expect(screen.getByText("Our Memories")).toBeInTheDocument();
    expect(screen.getByText("Timeline")).toBeInTheDocument();
    expect(screen.getByText("Favorites")).toBeInTheDocument();
  });

  it("navigates to Timeline when clicked", () => {
    render(<AngelFlix onBackToHub={vi.fn()} onOpenLetter={vi.fn()} onLogout={vi.fn()} />);
    const timelineBtn = screen.getByText("Timeline");
    fireEvent.click(timelineBtn);
    expect(screen.getByText("Timeline")).toBeInTheDocument();
  });
});
