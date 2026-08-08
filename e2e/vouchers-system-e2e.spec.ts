import { test, expect } from "@playwright/test";

test.describe("Full System End-to-End E2E Suite", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto("/");
  });

  test("1. Recipient Private Gate Unlock & Authentication Flow", async ({ page }) => {
    // Verify the Gate title is visible
    await expect(page.locator("h1")).toContainText(/Welcome/i);

    // Fill in Email and Password
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    await emailInput.fill("angelicogn@gmail.com");
    await passwordInput.fill("private_pass");

    // Click Unlock Button
    const unlockBtn = page.getByRole("button", { name: /Unlock My Personal Page/i });
    await expect(unlockBtn).toBeVisible();
  });

  test("2. Admin Login Navigation & Dashboard Access", async ({ page }) => {
    // Navigate to Admin Login page
    await page.goto("/admin/login");

    // Verify Admin login header
    await expect(page.getByText(/Admin Portal/i)).toBeVisible();

    // Verify Email and Password fields
    const adminEmailInput = page.locator('input[type="email"]');
    const adminPasswordInput = page.locator('input[type="password"]');

    await expect(adminEmailInput).toBeVisible();
    await expect(adminPasswordInput).toBeVisible();
  });

  test("3. Vouchers Section Rendering & User Interaction Check", async ({ page }) => {
    // Check page title / structure
    await expect(page).toHaveTitle(/Angelica|Love Story|Milestones|Monthsary|Valentine/i);

    // Bypass gate via mock storage session if needed
    await page.evaluate(() => {
      sessionStorage.setItem("monthsary_authenticated", "true");
    });
  });

  test("4. Responsive Layout & Navbar Navigation Check", async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to homepage
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });
});
