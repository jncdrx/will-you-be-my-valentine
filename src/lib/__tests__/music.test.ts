import { describe, expect, it } from "vitest";
import { MAX_MUSIC_FILE_SIZE_BYTES, validateMusicFile } from "../supabase";

describe("music upload validation", () => {
  it("accepts supported audio file types", () => {
    const file = new File(["test"], "track.mp3", { type: "audio/mpeg" });
    expect(validateMusicFile(file)).toBeNull();
  });

  it("rejects unsupported audio extensions", () => {
    const file = new File(["test"], "track.txt", { type: "text/plain" });
    expect(validateMusicFile(file)).toBe("Only MP3, WAV, or M4A files are supported.");
  });

  it("rejects files larger than the configured limit", () => {
    const oversizedBlob = new Blob([new Uint8Array(MAX_MUSIC_FILE_SIZE_BYTES + 1)], {
      type: "audio/mpeg",
    });
    const file = new File([oversizedBlob], "track.mp3", { type: "audio/mpeg" });
    expect(validateMusicFile(file)).toBe("File is too large. The maximum upload size is 15MB.");
  });
});
