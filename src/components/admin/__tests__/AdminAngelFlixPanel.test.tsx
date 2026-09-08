import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminAngelFlixPanel } from "../AdminAngelFlixPanel";

describe("AdminAngelFlixPanel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("renders Figma AngelFlix Studio title, header and stats", () => {
    render(<AdminAngelFlixPanel />);
    expect(screen.getByText("ANGELFLIX")).toBeInTheDocument();
    expect(screen.getByText("CMS")).toBeInTheDocument();
    expect(screen.getByText("Video + Images")).toBeInTheDocument();
    expect(screen.getByText("Images Only")).toBeInTheDocument();
  });

  it("switches to Library tab and displays memories", () => {
    localStorage.setItem(
      'angelflix_custom_memories',
      JSON.stringify([
        {
          id: 'test-1',
          title: 'Our First Sunset Date',
          category: 'Dates',
          date: 'Aug 21, 2026',
          dateSort: '2026-08-21',
          duration: '5 min',
          durationSec: 300,
          description: 'A special sunset together',
          thumbnail: 'https://example.com/thumb.jpg',
          backdropUrl: 'https://example.com/thumb.jpg',
        }
      ])
    );
    render(<AdminAngelFlixPanel />);
    const libTabBtn = screen.getByRole("button", { name: /Library/i });
    fireEvent.click(libTabBtn);
    expect(screen.getByText("Our First Sunset Date")).toBeInTheDocument();
  });
});
