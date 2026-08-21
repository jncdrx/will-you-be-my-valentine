import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminAngelFlixPanel } from "../AdminAngelFlixPanel";
import * as angelflixApi from "../../../lib/angelflixApi";

describe("AdminAngelFlixPanel", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders upload form and title", () => {
    vi.spyOn(angelflixApi, "fetchAngelFlixMedia").mockResolvedValue([]);
    render(<AdminAngelFlixPanel />);
    expect(screen.getByText("AngelFlix Studio")).toBeInTheDocument();
    expect(screen.getByText("Upload Video or Photo Memory")).toBeInTheDocument();
  });

  it("displays media items in the manager table", async () => {
    vi.spyOn(angelflixApi, "fetchAngelFlixMedia").mockResolvedValue([
      {
        id: "m-1",
        title: "Sunset Drive",
        subtitle: "Golden hour together",
        description: "A magical evening",
        category: "Our Videos",
        imageUrl: "https://example.com/sunset.jpg",
        videoUrl: "https://example.com/sunset.mp4",
        isFavorite: true,
      },
    ]);

    render(<AdminAngelFlixPanel />);
    await waitFor(() => {
      expect(screen.getByText("Sunset Drive")).toBeInTheDocument();
    });
  });
});
