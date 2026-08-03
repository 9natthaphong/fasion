import { test, expect } from "@playwright/test";

const themes = [
  { name: "light", theme: "light", accent: "olive" },
  { name: "dark-olive", theme: "dark", accent: "olive" },
];

test.describe("Targeted Typography Rhythm and Shop Scalability Audit", () => {
  for (const t of themes) {
    test(`Verify Thai Heading Line-Heights and Spacing (${t.name})`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto("/");
      await page.evaluate(({ theme, accent }) => {
        document.documentElement.setAttribute("data-theme", theme);
        document.documentElement.setAttribute("data-accent", accent);
      }, { theme: t.theme, accent: t.accent });
      await page.waitForTimeout(300);

      // Check all large editorial headings
      const headingSelectors = [
        ".wardrobe-story-copy h2",
        ".directions-heading h2",
        ".ai-standard-grid h2",
        ".sponsored-zone-heading h2",
        ".merchant-story-grid h2",
        ".cinematic-chapter h1",
      ];

      for (const selector of headingSelectors) {
        const heading = page.locator(selector).first();
        if (await heading.isVisible()) {
          const metrics = await heading.evaluate((el) => {
            const style = window.getComputedStyle(el);
            const fontSize = parseFloat(style.fontSize);
            const lineHeightStr = style.lineHeight;
            const lineHeight = parseFloat(lineHeightStr);
            return { fontSize, lineHeight, lineHeightStr };
          });

          // Line height MUST be strictly greater than font-size (i.e. line-height unitless multiplier > 1.05)
          expect(
            metrics.lineHeight,
            `Heading ${selector} line-height (${metrics.lineHeight}px) must be greater than font-size (${metrics.fontSize}px)`
          ).toBeGreaterThan(metrics.fontSize * 1.05);
        }
      }

      // Capture screenshot of heading 513/514 sections
      if (t.name === "light") {
        await page.locator(".home-wardrobe-story").first().screenshot({
          path: "test-results/screenshots/heading-wardrobe-story-light.png",
        });
        await page.locator(".home-ai-standard").first().screenshot({
          path: "test-results/screenshots/heading-ai-standard-light.png",
        });
      }
    });

    test(`Verify Landing Shops Limit & View All Link (${t.name})`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto("/");
      await page.evaluate(({ theme, accent }) => {
        document.documentElement.setAttribute("data-theme", theme);
        document.documentElement.setAttribute("data-accent", accent);
      }, { theme: t.theme, accent: t.accent });

      const shopCards = page.locator(".home-shops .shop-card");
      const shopCount = await shopCards.count();
      expect(shopCount, "Landing page must display at most 4 shops").toBeLessThanOrEqual(4);

      // Verify View All Shops link
      const viewAllLink = page.locator('.home-shops a[href="/shops"]');
      await expect(viewAllLink).toBeVisible();
      await expect(viewAllLink).toHaveText(/ดูร้านค้าทั้งหมด/);

      if (t.name === "light") {
        await page.locator(".home-shops").first().screenshot({
          path: "test-results/screenshots/landing-shops-desktop.png",
        });
      }
    });

    test(`Verify /shops Route Catalog Page (${t.name})`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto("/shops");
      await page.evaluate(({ theme, accent }) => {
        document.documentElement.setAttribute("data-theme", theme);
        document.documentElement.setAttribute("data-accent", accent);
      }, { theme: t.theme, accent: t.accent });

      // Title & Header
      await expect(page.locator("h1")).toHaveText("ร้านค้าทั้งหมด");
      
      const shopCards = page.locator(".shop-card");
      const shopCount = await shopCards.count();
      expect(shopCount).toBeGreaterThan(0);

      if (t.name === "light") {
        await page.screenshot({
          path: "test-results/screenshots/shops-catalog-desktop.png",
          fullPage: true,
        });
      }
    });
  }

  test("Verify Mobile Responsiveness & No Horizontal Overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(overflow, "Mobile landing page should not have horizontal overflow").toBe(false);

    await page.goto("/shops");
    const shopsOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(shopsOverflow, "Mobile /shops catalog page should not have horizontal overflow").toBe(false);

    await page.screenshot({
      path: "test-results/screenshots/shops-catalog-mobile.png",
    });
  });
});
