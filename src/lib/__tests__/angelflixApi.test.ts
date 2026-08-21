import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchAngelFlixMedia,
  updateAngelFlixMedia,
  deleteAngelFlixMedia,
} from "../angelflixApi";

describe("angelflixApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetchAngelFlixMedia returns parsed media array from server", async () => {
    const mockMedia = [
      {
        id: "media-1",
        title: "Test Road Trip",
        category: "Our Videos",
        imageUrl: "https://example.com/poster.jpg",
        videoUrl: "https://example.com/video.mp4",
        isFavorite: true,
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockMedia,
    });

    const result = await fetchAngelFlixMedia();
    expect(result).toEqual(mockMedia);
    expect(global.fetch).toHaveBeenCalledWith("/api/angelflix/media");
  });

  it("deleteAngelFlixMedia returns true on success", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    const result = await deleteAngelFlixMedia("media-1", "mock-token");
    expect(result).toBe(true);
  });
});
