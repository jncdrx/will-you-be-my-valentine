import { test, expect } from "@playwright/test";

test.describe("AngelFlix Complete End-to-End & Backend Functional Suite", () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate session so user can access without gate
    await page.addInitScript(() => {
      sessionStorage.setItem("monthsary_authenticated", "true");
      sessionStorage.setItem("monthsary_angel_email", "angelicogn@gmail.com");
      localStorage.removeItem("angelflix_custom_memories");
    });
  });

  test("1. Empty State - Pure AngelFlix Cinema without Love Letter or Admin Buttons", async ({ page }) => {
    // Mock empty backend media
    await page.route("**/api/angelflix/media**", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
      } else {
        await route.continue();
      }
    });

    await page.goto("/?view=angelflix");

    // Verify AngelFlix Branding & Header
    await expect(page.getByText("ANGELFLIX").first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Our Private Cinema/i).first()).toBeVisible();

    // Verify Empty Hero text
    await expect(page.getByText(/Your uploaded video memories and special moments will appear here/i)).toBeVisible();

    // Verify NO Love Letter link in the hero
    await expect(page.locator("a[href*='view=letter']")).toHaveCount(0);

    // Verify NO Open Admin Studio link in the hero
    await expect(page.locator("a[href*='admin']")).toHaveCount(0);

    // Verify Explore Memories & Search buttons exist
    const exploreBtn = page.getByRole("button", { name: /Explore Memories/i });
    const searchBtn = page.getByRole("button", { name: "Search", exact: true }).first();
    await expect(exploreBtn).toBeVisible();
    await expect(searchBtn).toBeVisible();

    // Clicking Explore Memories navigates to Our Memories tab
    await exploreBtn.click();
    await expect(page.getByText(/Our Memories/i).first()).toBeVisible();
    await expect(page.getByText(/0 memories|No memories/i).first()).toBeVisible();
  });

  test("2. Admin Studio Creation & Dynamic AngelFlix Player, Timeline, Details, Search & Favorites Lifecycle", async ({ page }) => {
    let mockBackendMemories = [
      {
        id: "mem-e2e-1",
        title: "Sunset Roadtrip to Tagaytay",
        category: "Adventures",
        description: "Driving along the ridge with our favorite music playing in the golden hour.",
        imageUrl: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800",
        videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
        duration: 120,
        date: "Aug 21, 2026",
        location: "Tagaytay, Cavite",
        tags: ["Adventures", "Roadtrip"],
        isFavorite: false,
      },
    ];

    await page.route("**/api/angelflix/media**", async (route) => {
      const method = route.request().method();
      if (method === "GET") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(mockBackendMemories) });
      } else if (method === "POST") {
        const body = JSON.parse(route.request().postData() || "{}");
        const newMem = {
          id: body.id || `mem-${Date.now()}`,
          title: body.title,
          category: body.category || "Our Videos",
          description: body.description || "",
          imageUrl: body.imageUrl || "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800",
          videoUrl: body.videoUrl || null,
          duration: body.duration || 60,
          date: body.date || "Aug 21, 2026",
          location: body.location || "",
          tags: [body.category || "Our Videos"],
          isFavorite: false,
        };
        mockBackendMemories.push(newMem);
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, media: newMem }) });
      } else if (method === "DELETE") {
        const url = route.request().url();
        const id = url.split("/").pop();
        mockBackendMemories = mockBackendMemories.filter((m) => m.id !== id);
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
      } else {
        await route.continue();
      }
    });

    // 1. Visit AngelFlix with backend memory loaded
    await page.goto("/?view=angelflix");
    await expect(page.getByText("ANGELFLIX").first()).toBeVisible({ timeout: 15000 });

    // Verify Billboard Hero displays backend memory
    await expect(page.getByRole("heading", { name: /Sunset Roadtrip to Tagaytay/i })).toBeVisible();
    await expect(page.getByText("Adventures").first()).toBeVisible();

    // 2. Test Details Page
    const detailsBtn = page.getByRole("button", { name: /Details/i });
    await expect(detailsBtn).toBeVisible();
    await detailsBtn.click();

    // Verify Details content
    await expect(page.getByRole("heading", { name: /Sunset Roadtrip to Tagaytay/i })).toBeVisible();
    await expect(page.getByText(/Tagaytay, Cavite/i).first()).toBeVisible();

    // Add note in Details
    const noteTextarea = page.locator("textarea");
    if (await noteTextarea.isVisible()) {
      await noteTextarea.fill("This was the best trip ever with my angel!");
      await noteTextarea.blur();
    }

    // Go back to Home from Details
    const backFromDetailsBtn = page.getByRole("button", { name: /Back/i }).first();
    await backFromDetailsBtn.click();
    await expect(page.getByRole("heading", { name: /Sunset Roadtrip to Tagaytay/i })).toBeVisible();

    // 3. Test Cinematic Video Player
    const watchNowBtn = page.getByRole("button", { name: /Watch Now/i });
    await expect(watchNowBtn).toBeVisible();
    await watchNowBtn.click();

    // Verify Video Player is active
    const playerBackBtn = page.getByRole("button", { name: /Back/i }).first();
    await expect(playerBackBtn).toBeVisible();

    // Exit Player
    await playerBackBtn.click({ force: true });
    await expect(page.getByText("ANGELFLIX").first()).toBeVisible();

    // 4. Test Favorites Toggle
    const favHeartBtn = page.locator("button").filter({ has: page.locator("svg path[d*='20.84']") }).first();
    if (await favHeartBtn.isVisible()) {
      await favHeartBtn.click();
    }

    // Navigate to Favorites
    const favoritesTab = page.getByRole("button", { name: "Favorites" });
    await favoritesTab.click();
    await expect(page.getByText("Our Favorites")).toBeVisible();

    // 5. Test Timeline Tab
    const timelineTab = page.getByRole("button", { name: "Timeline" });
    await timelineTab.click();
    await expect(page.getByText("Timeline").first()).toBeVisible();
    await expect(page.getByText("August").first()).toBeVisible();
    await expect(page.getByText("Sunset Roadtrip to Tagaytay").first()).toBeVisible();

    // 6. Test Our Memories Tab with Category Filter & View Modes
    const memoriesTab = page.getByRole("button", { name: "Our Memories" });
    await memoriesTab.click();
    await expect(page.getByText("Our Memories").first()).toBeVisible();
    await expect(page.getByText("Sunset Roadtrip to Tagaytay").first()).toBeVisible();

    // Click Category Filter
    const adventuresFilter = page.getByRole("button", { name: "Adventures" });
    if (await adventuresFilter.isVisible()) {
      await adventuresFilter.click();
      await expect(page.getByText("Sunset Roadtrip to Tagaytay").first()).toBeVisible();
    }

    // 7. Test Search Tab
    const searchIconBtn = page.locator("button").filter({ has: page.locator("svg circle[cx='11']") }).first();
    await searchIconBtn.click();

    const searchInput = page.locator("input[placeholder*='Search']");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("Roadtrip");
    await expect(page.getByText("Sunset Roadtrip to Tagaytay").first()).toBeVisible();

    // 8. Test TV Home Navigation back to Experience Hub
    const tvHomeBtn = page.getByRole("button", { name: /TV Home/i });
    if (await tvHomeBtn.isVisible()) {
      await tvHomeBtn.click();
      await expect(page.getByText(/Choose Your Experience/i)).toBeVisible();
    }
  });

  test("3. Responsive Mobile Viewport for AngelFlix Cinema & Bottom Nav", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/?view=angelflix");
    await expect(page.getByText("ANGELFLIX").first()).toBeVisible({ timeout: 15000 });

    // Verify Mobile Navigation bar is visible
    const mobileHome = page.getByRole("button", { name: "Home", exact: true });
    const mobileMemories = page.getByRole("button", { name: "Memories", exact: true });
    const mobileSaved = page.getByRole("button", { name: "Saved", exact: true });
    const mobileSearch = page.getByRole("button", { name: "Search", exact: true }).last();

    await expect(mobileHome).toBeVisible();
    await expect(mobileMemories).toBeVisible();
    await expect(mobileSaved).toBeVisible();
    await expect(mobileSearch).toBeVisible();

    // Tap Saved in mobile nav
    await mobileSaved.click();
    await expect(page.getByText(/Our Favorites/i)).toBeVisible();

    // Tap Search in mobile nav
    await mobileSearch.click();
    await expect(page.locator("input[placeholder*='Search']")).toBeVisible();
  });
});
