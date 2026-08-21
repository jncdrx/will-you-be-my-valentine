import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AngelFlix } from "../AngelFlix";
import * as angelflixApi from "../../lib/angelflixApi";

describe("AngelFlix", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(angelflixApi, "fetchAngelFlixMedia").mockResolvedValue([]);
  });

  it("renders brand name and billboard hero heading", () => {
    render(<AngelFlix onBackToHub={vi.fn()} onOpenLetter={vi.fn()} onLogout={vi.fn()} />);
    expect(screen.getByText("ANGELFLIX")).toBeInTheDocument();
    expect(screen.getByText("A Love Worth Remembering")).toBeInTheDocument();
  });

  it("renders recent memories category", () => {
    render(<AngelFlix onBackToHub={vi.fn()} onOpenLetter={vi.fn()} onLogout={vi.fn()} />);
    expect(screen.getByText("Recent Memories")).toBeInTheDocument();
    expect(screen.getByText("First Date")).toBeInTheDocument();
  });

  it("calls onOpenLetter when 'Love Letter' button is clicked", () => {
    const handleOpenLetter = vi.fn();
    render(<AngelFlix onBackToHub={vi.fn()} onOpenLetter={handleOpenLetter} onLogout={vi.fn()} />);
    const letterBtn = screen.getByText("Love Letter");
    fireEvent.click(letterBtn);
    expect(handleOpenLetter).toHaveBeenCalledOnce();
  });
});
