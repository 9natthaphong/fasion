import { test, chromium } from "@playwright/test";

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 } // mobile
  });
  const page = await context.newPage();

  // Login as admin
  await page.goto("http://localhost:3000/login/customer");
  await page.getByLabel("อีเมล").fill(process.env.E2E_ADMIN_EMAIL!);
  await page.locator("#auth-password").fill(process.env.E2E_ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
  await page.waitForURL((url: URL) => !url.pathname.startsWith("/login"), { timeout: 15_000 });

  await page.goto("http://localhost:3000/admin/ads");
  await page.waitForTimeout(1000);

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

  console.log("Admin Ads Overflowing Elements:");
  console.log(overflowElements.slice(-5)); // Get the deepest elements

  // Now for tablet merchant ad
  const context2 = await browser.newContext({
    viewport: { width: 1024, height: 768 } // tablet
  });
  const page2 = await context2.newPage();
  
  await page2.goto("http://localhost:3000/login/merchant");
  await page2.getByLabel("อีเมล").fill(process.env.E2E_MERCHANT_EMAIL!);
  await page2.locator("#auth-password").fill(process.env.E2E_MERCHANT_PASSWORD!);
  await page2.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
  await page2.waitForURL((url: URL) => !url.pathname.startsWith("/login"), { timeout: 15_000 });

  await page2.goto("http://localhost:3000/merchant/ads/new");
  await page2.waitForTimeout(1000);

  const overflowElements2 = await page2.evaluate(() => {
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

  console.log("Merchant Ad New Overflowing Elements:");
  console.log(overflowElements2.slice(-5));

  await browser.close();
})();
