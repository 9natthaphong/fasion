import { expect, test } from "@playwright/test";

test("find overflow elements", async ({ page, browser }) => {
  // Mobile test
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login/customer");
  await page.getByLabel("อีเมล").fill(process.env.E2E_ADMIN_EMAIL!);
  await page.locator("#auth-password").fill(process.env.E2E_ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
  await page.waitForURL((url: URL) => !url.pathname.startsWith("/login"), { timeout: 15_000 });

  await page.goto("/admin/ads");
  await page.waitForTimeout(2000);

  const overflowElements = await page.evaluate(() => {
    const docWidth = document.documentElement.clientWidth;
    const all = document.querySelectorAll('*');
    const overflowing = [];
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      const rect = el.getBoundingClientRect();
      if (rect.right > docWidth) {
        let identifier = el.tagName.toLowerCase();
        if (el.id) identifier += '#' + el.id;
        if (el.className && typeof el.className === 'string') identifier += '.' + el.className.split(' ').join('.');
        overflowing.push({
          tag: identifier,
          width: rect.width,
          right: rect.right,
          docWidth
        });
      }
    }
    return overflowing;
  });

  console.log("=== Admin Ads Overflowing Elements ===");
  console.log(overflowElements.slice(-5));

  // Tablet test
  await page.setViewportSize({ width: 1024, height: 768 });
  // Login as merchant
  await page.goto("/login/merchant");
  await page.getByLabel("อีเมล").fill(process.env.E2E_MERCHANT_EMAIL!);
  await page.locator("#auth-password").fill(process.env.E2E_MERCHANT_PASSWORD!);
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
  await page.waitForURL((url: URL) => !url.pathname.startsWith("/login"), { timeout: 15_000 });

  await page.goto("/merchant/ads/new");
  await page.waitForTimeout(2000);

  const overflowElements2 = await page.evaluate(() => {
    const docWidth = document.documentElement.clientWidth;
    const all = document.querySelectorAll('*');
    const overflowing = [];
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      const rect = el.getBoundingClientRect();
      if (rect.right > docWidth) {
        let identifier = el.tagName.toLowerCase();
        if (el.id) identifier += '#' + el.id;
        if (el.className && typeof el.className === 'string') identifier += '.' + el.className.split(' ').join('.');
        overflowing.push({
          tag: identifier,
          width: rect.width,
          right: rect.right,
          docWidth
        });
      }
    }
    return overflowing;
  });

  console.log("=== Merchant Ad New Overflowing Elements ===");
  console.log(overflowElements2.slice(-5));
});
