import { describe, it, expect } from "vitest";
import { angelflixConfig } from "../angelflixConfig";

describe("angelflixConfig", () => {
  it("contains hero configuration with title and description", () => {
    expect(angelflixConfig.hero.title).toBe("A Love Worth Remembering");
    expect(angelflixConfig.hero.tags).toContain("Romance");
    expect(angelflixConfig.hero.tags).toContain("Memories");
    expect(angelflixConfig.hero.tags).toContain("Adventures");
  });

  it("contains recent memories categories and items", () => {
    expect(angelflixConfig.recentMemories.length).toBeGreaterThan(0);
    const first = angelflixConfig.recentMemories[0];
    expect(first.title).toBe("First Date");
    expect(first.description).toBeDefined();
  });

  it("contains chapters of us matching 7 months", () => {
    expect(angelflixConfig.chapters.length).toBe(7);
  });
});
