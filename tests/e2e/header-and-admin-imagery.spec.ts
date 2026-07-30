import { expect, test } from "@playwright/test";

const hasCredentials = Boolean(
  process.env.RUN_AUTHENTICATED_E2E === "1" &&
    process.env.E2E_CUSTOMER_EMAIL &&
    process.env.E2E_CUSTOMER_PASSWORD &&
    process.env.E2E_ADMIN_EMAIL &&
    process.env.E2E_ADMIN_PASSWORD,
);

test.describe("Header Session Awareness & Admin Imagery E2E", () => {
  test("logged-out visitor sees login link on homepage and discover", async ({ page, isMobile }) => {
    await page.goto("/");
    if (!isMobile) {
      await expect(page.locator("header").getByText("เข้าสู่ระบบ", { exact: true })).toBeVisible();
    }
    await expect(page.locator("header").getByText("เลือกชุดวันนี้")).toBeVisible();

    await page.goto("/discover");
    if (!isMobile) {
      await expect(page.locator("header").getByText("เข้าสู่ระบบ", { exact: true })).toBeVisible();
    }
  });

  test("authenticated customer sees session header and hides login link", async ({ page, isMobile }) => {
    test.skip(!hasCredentials, "Requires RUN_AUTHENTICATED_E2E=1 and credentials in .env.test.local");

    const customerEmail = process.env.E2E_CUSTOMER_EMAIL!;
    const customerPassword = process.env.E2E_CUSTOMER_PASSWORD!;

    // 1. Customer Login
    await page.goto("/login/customer");
    await page.getByLabel("อีเมล").fill(customerEmail);
    await page.locator("#auth-password").fill(customerPassword);
    await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();

    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 });

    // 2. Verify login CTA is completely gone from header
    await expect(page.locator("header").getByText("เข้าสู่ระบบ", { exact: true })).not.toBeVisible();

    if (!isMobile) {
      // 3. Desktop: User account menu trigger button
      const menuTrigger = page.locator("header button[aria-label*='เมนูบัญชีผู้ใช้']");
      await expect(menuTrigger).toBeVisible();

      // 4. Open user account menu dropdown and verify customer links
      await menuTrigger.click();
      await expect(page.getByRole("menuitem", { name: "บัญชีของฉัน" })).toBeVisible();
      await expect(page.getByRole("menuitem", { name: "ตู้เสื้อผ้าของฉัน" })).toBeVisible();

      // 5. Test Escape key closes dropdown
      await page.keyboard.press("Escape");
      await expect(page.getByRole("menuitem", { name: "บัญชีของฉัน" })).not.toBeVisible();

      // 6. Test Logout form action
      await menuTrigger.click();
      await page.locator("form[action='/api/auth/logout'] button").first().click();
      await page.goto("/");
      await expect(page.locator("header").getByText("เข้าสู่ระบบ", { exact: true })).toBeVisible();
    } else {
      // Mobile Drawer Menu
      const mobileDrawer = page.locator("header details summary");
      await mobileDrawer.click();
      await expect(page.getByRole("navigation", { name: "เมนูมือถือ" }).getByText("บัญชีของฉัน")).toBeVisible();
    }
  });

  test("authenticated admin sees admin menu and can inspect ad moderation images", async ({ page, isMobile }) => {
    test.skip(!hasCredentials, "Requires RUN_AUTHENTICATED_E2E=1 and credentials in .env.test.local");

    const adminEmail = process.env.E2E_ADMIN_EMAIL!;
    const adminPassword = process.env.E2E_ADMIN_PASSWORD!;

    // 1. Admin Login
    await page.goto("/login/customer");
    await page.getByLabel("อีเมล").fill(adminEmail);
    await page.locator("#auth-password").fill(adminPassword);
    await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();

    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 });
    await expect(page).toHaveURL(/\/admin$/);

    if (!isMobile) {
      // 2. Verify admin header menu trigger and admin items
      const menuTrigger = page.locator("header button[aria-label*='เมนูบัญชีผู้ใช้']");
      await expect(menuTrigger).toBeVisible();
      await menuTrigger.click();
      await expect(page.getByRole("menuitem", { name: "Admin Console" })).toBeVisible();
      await expect(page.getByRole("menuitem", { name: "ตรวจสอบโฆษณา" })).toBeVisible();
      await page.keyboard.press("Escape");
    }

    // 3. Admin Ads List (Verify cover thumbnail)
    await page.goto("/admin/ads");
    await expect(page.getByRole("heading", { name: "รายการโฆษณา" })).toBeVisible();
    const firstAdCheckLink = page.locator("a[href^='/admin/ads/']").first();
    await expect(firstAdCheckLink).toBeVisible();

    // 4. Admin Ad Detail Page (Verify Cover image & Gallery)
    const adHref = await firstAdCheckLink.getAttribute("href");
    if (adHref) await page.goto(adHref);
    await expect(page.getByText("ตรวจสอบโดยผู้ดูแล")).toBeVisible();
    await expect(page.locator("img[alt]")).not.toHaveCount(0);

    // 5. Test Lightbox image preview modal
    const previewBtn = page.getByRole("button", { name: /ขยายดูภาพ/ }).first();
    if (await previewBtn.isVisible()) {
      await previewBtn.click();
      await expect(page.getByRole("dialog", { name: /พรีวิวภาพ/ })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog", { name: /พรีวิวภาพ/ })).not.toBeVisible();
    }

    // 6. Admin Shops Page & Detail (Verify Shop logo)
    await page.goto("/admin/shops");
    await expect(page.getByRole("heading", { name: "รายการร้านค้า" })).toBeVisible();
    const firstShopCheckLink = page.locator("a[href^='/admin/shops/']").first();
    await expect(firstShopCheckLink).toBeVisible();
    await firstShopCheckLink.click();
    await page.waitForURL(/\/admin\/shops\/[0-9a-f-]+$/, { timeout: 15_000 });
    await expect(page.getByText("Review shop")).toBeVisible();
  });
});
