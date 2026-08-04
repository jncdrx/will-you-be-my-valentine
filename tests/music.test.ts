import { describe, it, expect } from "vitest";

describe("Music Feature Logic", () => {
  it("validates YouTube URL formats correctly", () => {
    const validUrl1 = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    const validUrl2 = "https://youtu.be/dQw4w9WgXcQ";
    const invalidUrl = "https://example.com/audio.mp3";

    const isYoutube = (url: string) => url.includes("youtube.com") || url.includes("youtu.be");

    expect(isYoutube(validUrl1)).toBe(true);
    expect(isYoutube(validUrl2)).toBe(true);
    expect(isYoutube(invalidUrl)).toBe(false);
  });

  it("filters songs by search query (title or artist)", () => {
    const mockSongs = [
      { id: "1", title: "Golden Hour", artist: "JVKE" },
      { id: "2", title: "Nothing", artist: "Bruno Major" },
      { id: "3", title: "Until I Found You", artist: "Stephen Sanchez" },
    ];

    const filterSongs = (query: string) =>
      mockSongs.filter(
        (s) =>
          s.title.toLowerCase().includes(query.toLowerCase()) ||
          s.artist.toLowerCase().includes(query.toLowerCase())
      );

    expect(filterSongs("golden")).toHaveLength(1);
    expect(filterSongs("golden")[0].title).toBe("Golden Hour");

    expect(filterSongs("bruno")).toHaveLength(1);
    expect(filterSongs("bruno")[0].artist).toBe("Bruno Major");

    expect(filterSongs("nonexistent")).toHaveLength(0);
  });
});
