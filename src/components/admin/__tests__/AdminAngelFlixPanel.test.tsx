import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminAngelFlixPanel } from "../AdminAngelFlixPanel";

describe("AdminAngelFlixPanel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders Figma AngelFlix Studio title, header and stats", () => {
    render(<AdminAngelFlixPanel />);
    expect(screen.getByText("ANGELFLIX")).toBeInTheDocument();
    expect(screen.getByText("CMS")).toBeInTheDocument();
    expect(screen.getByText("Video + Images")).toBeInTheDocument();
    expect(screen.getByText("Images Only")).toBeInTheDocument();
  });

  it("switches to Library tab and displays custom & built-in memory items", () => {
    render(<AdminAngelFlixPanel />);
    const libTabBtn = screen.getByRole("button", { name: /Library/i });
    fireEvent.click(libTabBtn);
    expect(screen.getByText("Our 7th Monthsary")).toBeInTheDocument();
  });
});
