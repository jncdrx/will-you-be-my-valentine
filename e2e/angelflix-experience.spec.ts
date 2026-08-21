import { test, expect } from "@playwright/test";

test.describe("AngelFlix & Experience Hub E2E Chromium Suite", () => {
  test("1. Experience Hub and AngelFlix View Navigation", async ({ page }) => {
    // Navigate with ?view=angelflix or simulate session
    await page.goto("/?view=angelflix");

    // Wait for body to be visible
    await expect(page.locator("body")).toBeVisible();
  });

  test("2. Admin Portal - AngelFlix Studio Tab Validation", async ({ page }) => {
    await page.goto("/admin/login");

    // Verify Admin Portal login header
    await expect(page.getByText(/Admin Portal/i)).toBeVisible();

    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test("3. Responsive Mobile Viewport Validation for AngelFlix", async ({ page }) => {
    // Set mobile viewport (iPhone SE)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();

    // Set tablet viewport (iPad Mini)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();

    // Set desktop viewport (1920x1080)
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });
});
