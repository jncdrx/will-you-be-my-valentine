import { test, expect } from "@playwright/test";

test.describe("Full Feature & End-to-End Functional Test Suite", () => {
  test.beforeEach(async ({ page }) => {
    // Inject authenticated session into sessionStorage before any page load
    await page.addInitScript(() => {
      sessionStorage.setItem("monthsary_authenticated", "true");
      sessionStorage.setItem("monthsary_angel_email", "angelicogn@gmail.com");
    });

    // Mock AngelFlix media API endpoint
    await page.route("**/api/angelflix/media", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "v-1",
              title: "Our Romantic Sunset Drive",
              subtitle: "Singing along with Angel",
              description: "Golden hour skies and the sweetest laughter.",
              category: "Our Videos",
              imageUrl: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800",
              videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
              duration: 10,
              date: "Aug 4, 2026",
              tags: ["Romance", "RoadTrip", "Sunset"],
              isFavorite: true,
            },
          ]),
        });
      } else {
        await route.continue();
      }
    });
  });

  test("1. Experience Hub Flow: Selection, Stats, Music Toggle & Route Switching", async ({ page }) => {
    await page.goto("/?view=hub");

    // Verify Experience Hub Headings
    await expect(page.getByText(/Choose Your Experience/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Happy 7th Monthsary/i).first()).toBeVisible();

    // Verify Both Selection Cards Exist
    const letterCard = page.getByText("The Love Letter");
    const angelflixCard = page.getByText("AngelFlix Cinema");
    await expect(letterCard).toBeVisible();
    await expect(angelflixCard).toBeVisible();

    // Verify Days in Love Counter in Hub
    await expect(page.getByText(/Days in Love/i)).toBeVisible();

    // Test Music Toggle in Hub
    const musicBtn = page.locator("button").filter({ hasText: /Play Music|Music Playing/i });
    await expect(musicBtn).toBeVisible();
    await musicBtn.click();
  });

  test("2. AngelFlix Full Cinema Experience & Interactive Player Flow", async ({ page }) => {
    await page.goto("/?view=angelflix");

    // Verify AngelFlix Branding & Subtitle
    await expect(page.getByText("ANGELFLIX")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Our Private Cinema/i).first()).toBeVisible();

    // Verify Hero Billboard Content
    await expect(page.getByText("A Love Worth Remembering")).toBeVisible();
    await expect(page.getByText(/Since 2024 · Every moment matters/i)).toBeVisible();

    // Verify Category Carousels
    await expect(page.getByText("Recent Memories")).toBeVisible();
    await expect(page.getByText("Chapters of Us (Months 1 to 7)")).toBeVisible();

    // Test "Made with love" Romantic Popup
    const madeWithLoveBtn = page.getByRole("button", { name: /Made with love/i });
    await expect(madeWithLoveBtn).toBeVisible();
    await madeWithLoveBtn.click();
    await expect(page.getByText(/Made with Love for Angel/i)).toBeVisible();

    // Close Romantic Popup
    const closeLoveBtn = page.getByRole("button", { name: /I Love You Too/i });
    await closeLoveBtn.click();
    await expect(page.getByText(/Made with Love for Angel/i)).not.toBeVisible();

    // Test Exact Favorites Filter in Navbar
    const favFilterBtn = page.getByRole("button", { name: "Favorites", exact: true });
    await expect(favFilterBtn).toBeVisible();
    await favFilterBtn.click();
    await expect(page.getByText(/Filtered: Favorites/i)).toBeVisible();

    // Open Cinema Player Modal by clicking "Watch Together"
    const watchTogetherBtn = page.getByRole("button", { name: /Watch Together/i });
    await watchTogetherBtn.click();

    // Verify Cinema Player Modal
    await expect(page.getByText(/ANGELFLIX VIDEO|ANGELFLIX CINEMA/i)).toBeVisible();

    // Test Cinema Like Heart Button inside Player
    const likeBtn = page.getByRole("button", { name: /Like memory/i });
    await expect(likeBtn).toBeVisible();
    await likeBtn.click();

    // Close Cinema Player Modal
    const closeCinemaBtn = page.getByRole("button", { name: /Close cinema player/i });
    await expect(closeCinemaBtn).toBeVisible();
    await closeCinemaBtn.click();
    await expect(closeCinemaBtn).not.toBeVisible();
  });

  test("3. Love Letter & Timeline Experience Flow", async ({ page }) => {
    await page.goto("/?view=letter");

    // Verify Navbar with 7 Months branding
    await expect(page.getByText(/7 Months of Us/i).first()).toBeVisible({ timeout: 15000 });

    // Verify Welcome Screen Components
    await expect(page.getByRole("button", { name: /Open My Letter/i })).toBeVisible();

    // Click "Open My Letter" to proceed to letter section
    const openLetterBtn = page.getByRole("button", { name: /Open My Letter/i });
    await openLetterBtn.click();

    // Verify Love Letter Section
    await expect(page.getByText(/To My Dearest Love/i)).toBeVisible();
    const continueBtn = page.getByRole("button", { name: /Continue to memories|Continue, my love/i });
    await expect(continueBtn).toBeVisible();

    // Proceed to Memories Section
    await continueBtn.click();

    // Verify Memories Section Heading
    await expect(page.getByText(/Our Memories & Timeline|Our Journey Over 7 Months/i).first()).toBeVisible();

    // Test Past Monthsaries Dropdown in Navbar
    const pastMonthsBtn = page.getByRole("button", { name: /Past Months/i });
    await pastMonthsBtn.click();
    await expect(page.getByText(/Our 7 Months Journey/i)).toBeVisible();
    await page.locator(".fixed.inset-0.z-40").click(); // Click backdrop overlay to close dropdown

    // Switch back to AngelFlix from Letter Navbar
    const angelflixSwitchBtn = page.getByRole("button", { name: /AngelFlix/i });
    await expect(angelflixSwitchBtn).toBeVisible();
    await angelflixSwitchBtn.click();
    await expect(page.getByText("ANGELFLIX")).toBeVisible();
  });

  test("4. Recipient Auth Gate & Admin Portal Access", async ({ page }) => {
    // Navigate to Admin Login Page
    await page.goto("/admin/login");
    await expect(page.getByText(/Admin Portal/i)).toBeVisible();
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test("5. Comprehensive Responsive Checks across Devices", async ({ page }) => {
    // Mobile Viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/?view=angelflix");
    await expect(page.getByText("ANGELFLIX")).toBeVisible();

    // Tablet Viewport
    await page.setViewportSize({ width: 820, height: 1180 });
    await page.goto("/?view=hub");
    await expect(page.getByText(/Choose Your Experience/i)).toBeVisible();

    // Desktop Viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/?view=letter");
    await expect(page.getByText(/7 Months of Us/i).first()).toBeVisible();
  });
});
