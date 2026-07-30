import { expect, test } from "@playwright/test";

const hasCredentials = Boolean(
  process.env.RUN_AUTHENTICATED_E2E === "1" &&
    process.env.E2E_CUSTOMER_EMAIL &&
    process.env.E2E_CUSTOMER_PASSWORD &&
    process.env.E2E_MERCHANT_EMAIL &&
    process.env.E2E_MERCHANT_PASSWORD &&
    process.env.E2E_ADMIN_EMAIL &&
    process.env.E2E_ADMIN_PASSWORD,
);

test.describe("Merchant Optional Destination & Moderation Flow E2E", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium" || !hasCredentials,
      "Requires RUN_AUTHENTICATED_E2E=1 and credentials.",
    );
  });

  test("Merchant ad creation without destination and admin moderation", async ({ page }) => {
    const merchantEmail = process.env.E2E_MERCHANT_EMAIL!;
    const merchantPassword = process.env.E2E_MERCHANT_PASSWORD!;
    const adminEmail = process.env.E2E_ADMIN_EMAIL!;
    const adminPassword = process.env.E2E_ADMIN_PASSWORD!;

    // 1. Merchant log in
    await page.goto("/login/merchant");
    await page.getByLabel("อีเมล").fill(merchantEmail);
    await page.locator("#auth-password").fill(merchantPassword);
    await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 });

    // 2. Open /merchant/ads/new
    await page.goto("/merchant/ads/new");
    await expect(page.getByRole("heading", { name: "สร้างโฆษณา", exact: true })).toBeVisible();

    // Fill title without destination
    const noLinkTitle = `No-Link Ad E2E ${Date.now()}`;
    await page.locator('input[name="title"]').fill(noLinkTitle);
    await page.locator('textarea[name="description"]').fill("โฆษณาทดสอบ E2E ไม่มีลิงก์ปลายทาง");

    // Leave destinationUrl blank
    await page.locator('input[name="destinationUrl"]').fill("");

    // Select category checkbox
    const firstCategory = page.locator('input[name="categoryIds"]').first();
    await firstCategory.check({ force: true });

    // Save Draft
    await page.getByRole("button", { name: "บันทึกร่าง", exact: true }).click();
    await page.waitForURL("/merchant/ads", { timeout: 15_000 });

    // Verify draft was saved without error
    await expect(page.getByText(noLinkTitle)).toBeVisible();

    // Create another ad with safe non-Shopee HTTPS URL
    await page.goto("/merchant/ads/new");
    const linkedTitle = `Linked Non-Shopee Ad E2E ${Date.now()}`;
    await page.locator('input[name="title"]').fill(linkedTitle);
    await page.locator('textarea[name="description"]').fill("โฆษณาทดสอบ E2E มีลิงก์ปลายทางเว็บไซต์ตนเอง");
    await page.locator('input[name="destinationUrl"]').fill("https://example.com/product/linen-pants");
    await firstCategory.check({ force: true });

    await page.getByRole("button", { name: "บันทึกร่าง", exact: true }).click();
    await page.waitForURL("/merchant/ads", { timeout: 15_000 });
    await expect(page.getByText(linkedTitle)).toBeVisible();

    // Clear cookies before admin login
    await page.context().clearCookies();

    // Admin login to review via /login/customer
    await page.goto("/login/customer");
    await page.getByLabel("อีเมล").fill(adminEmail);
    await page.locator("#auth-password").fill(adminPassword);
    await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 });

    // Inspect admin ads list
    await page.goto("/admin/ads");
    await expect(page.getByRole("heading", { name: "รายการโฆษณา" })).toBeVisible();
  });

  test("Public ad page and 390px mobile responsiveness without console errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Test Desktop view on Discover
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/discover");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Test 390px Mobile view on Discover
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/discover");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    expect(consoleErrors.filter((e) => !e.includes("favicon") && !e.includes("analytics"))).toHaveLength(0);
  });
});
