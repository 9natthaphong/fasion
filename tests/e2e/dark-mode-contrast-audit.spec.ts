import { test, expect } from "@playwright/test";

const themes = [
  { name: "light", theme: "light", accent: "olive" },
  { name: "dark-olive", theme: "dark", accent: "olive" },
  { name: "dark-navy", theme: "dark", accent: "navy" },
  { name: "dark-mono", theme: "dark", accent: "mono" },
];

const viewports = [
  { width: 1440, height: 1000, name: "desktop" },
  { width: 1024, height: 768, name: "tablet" },
  { width: 390, height: 844, name: "mobile" },
  { width: 360, height: 800, name: "small-mobile" },
];

function getLuminance(r: number, g: number, b: number) {
  const [rs, gs, bs] = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function parseRgb(colorStr: string): [number, number, number] {
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return [0, 0, 0];
  return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
}

function calculateContrastRatio(color1: string, color2: string): number {
  const [r1, g1, b1] = parseRgb(color1);
  const [r2, g2, b2] = parseRgb(color2);
  const l1 = getLuminance(r1, g1, b1);
  const l2 = getLuminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

test.describe("Targeted Dark Mode Visual Contrast Regression Audit", () => {
  for (const t of themes) {
    test(`Verify Landing Page Contrast & Visuals (${t.name})`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto("/");
      await page.evaluate(({ theme, accent }) => {
        document.documentElement.setAttribute("data-theme", theme);
        document.documentElement.setAttribute("data-accent", accent);
      }, { theme: t.theme, accent: t.accent });
      await page.waitForTimeout(300);

      if (t.name.startsWith("dark")) {
        await page.screenshot({
          path: `test-results/screenshots/landing-${t.name}.png`,
          fullPage: true,
        });
      }

      // 1. Hero Primary CTA Button
      const primaryBtn = page.locator(".cinematic-primary-action, .home-primary-action").first();
      if (await primaryBtn.isVisible()) {
        const btnColors = await primaryBtn.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return { fg: style.color, bg: style.backgroundColor };
        });
        const ratio = calculateContrastRatio(btnColors.fg, btnColors.bg);
        expect(ratio, `Landing Primary CTA contrast on ${t.name} must be >= 3:1`).toBeGreaterThanOrEqual(3.0);
      }

      // 2. Landing Sponsored Quick Action Card (Card 3)
      const sponsoredCard = page.locator(".quick-action-sponsored").first();
      if (await sponsoredCard.isVisible()) {
        const cardColors = await sponsoredCard.evaluate((el) => {
          const style = window.getComputedStyle(el);
          const titleEl = el.querySelector("strong") || el;
          return { fg: window.getComputedStyle(titleEl).color, bg: style.backgroundColor };
        });
        const ratio = calculateContrastRatio(cardColors.fg, cardColors.bg);
        expect(ratio, `Sponsored Card contrast on ${t.name} must be >= 4.5:1`).toBeGreaterThanOrEqual(4.5);
      }

      // 3. Neutral AI Standard Section Heading
      const aiHeading = page.locator(".home-ai-standard h2").first();
      if (await aiHeading.isVisible()) {
        const headingColors = await aiHeading.evaluate((el) => {
          const style = window.getComputedStyle(el);
          let parent = el.parentElement;
          let bg = window.getComputedStyle(parent!).backgroundColor;
          while (parent && (bg === "rgba(0, 0, 0, 0)" || bg === "transparent")) {
            parent = parent.parentElement;
            if (parent) bg = window.getComputedStyle(parent).backgroundColor;
          }
          return { fg: style.color, bg };
        });
        const ratio = calculateContrastRatio(headingColors.fg, headingColors.bg);
        expect(ratio, `AI Standard Heading contrast on ${t.name} must be >= 3:1`).toBeGreaterThanOrEqual(3.0);
      }

      // 4. Sponsored Zone Section Heading
      const sponsoredHeading = page.locator(".home-sponsored-zone h2").first();
      if (await sponsoredHeading.isVisible()) {
        const headingColors = await sponsoredHeading.evaluate((el) => {
          const style = window.getComputedStyle(el);
          let parent = el.parentElement;
          let bg = window.getComputedStyle(parent!).backgroundColor;
          while (parent && (bg === "rgba(0, 0, 0, 0)" || bg === "transparent")) {
            parent = parent.parentElement;
            if (parent) bg = window.getComputedStyle(parent).backgroundColor;
          }
          return { fg: style.color, bg };
        });
        const ratio = calculateContrastRatio(headingColors.fg, headingColors.bg);
        expect(ratio, `Sponsored Zone Heading contrast on ${t.name} must be >= 3:1`).toBeGreaterThanOrEqual(3.0);
      }

      // 5. Merchant Section Heading
      const merchantHeading = page.locator(".home-merchant-story h2").first();
      if (await merchantHeading.isVisible()) {
        const headingColors = await merchantHeading.evaluate((el) => {
          const style = window.getComputedStyle(el);
          let parent = el.parentElement;
          let bg = window.getComputedStyle(parent!).backgroundColor;
          while (parent && (bg === "rgba(0, 0, 0, 0)" || bg === "transparent")) {
            parent = parent.parentElement;
            if (parent) bg = window.getComputedStyle(parent).backgroundColor;
          }
          return { fg: style.color, bg };
        });
        const ratio = calculateContrastRatio(headingColors.fg, headingColors.bg);
        expect(ratio, `Merchant Story Heading contrast on ${t.name} must be >= 3:1`).toBeGreaterThanOrEqual(3.0);
      }
    });

    test(`Verify Discover Page Contrast & Visuals (${t.name})`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto("/discover");
      await page.evaluate(({ theme, accent }) => {
        document.documentElement.setAttribute("data-theme", theme);
        document.documentElement.setAttribute("data-accent", accent);
      }, { theme: t.theme, accent: t.accent });
      await page.waitForTimeout(300);

      if (t.name.startsWith("dark")) {
        await page.screenshot({
          path: `test-results/screenshots/discover-${t.name}.png`,
          fullPage: true,
        });
      }

      // Discover Hero Heading
      const heading = page.locator(".editorial-page-intro h1").first();
      const headingColors = await heading.evaluate((el) => {
        const style = window.getComputedStyle(el);
        let parent = el.parentElement;
        let bg = window.getComputedStyle(parent!).backgroundColor;
        while (parent && (bg === "rgba(0, 0, 0, 0)" || bg === "transparent")) {
          parent = parent.parentElement;
          if (parent) bg = window.getComputedStyle(parent).backgroundColor;
        }
        return { fg: style.color, bg };
      });
      const ratio = calculateContrastRatio(headingColors.fg, headingColors.bg);
      expect(ratio, `Discover Hero Heading contrast on ${t.name} must be >= 3:1`).toBeGreaterThanOrEqual(3.0);
    });

    test(`Verify AI Stylist Page Contrast & Visuals (${t.name})`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto("/ai-stylist");
      await page.evaluate(({ theme, accent }) => {
        document.documentElement.setAttribute("data-theme", theme);
        document.documentElement.setAttribute("data-accent", accent);
      }, { theme: t.theme, accent: t.accent });
      await page.waitForTimeout(300);

      if (t.name.startsWith("dark")) {
        await page.screenshot({
          path: `test-results/screenshots/ai-stylist-${t.name}.png`,
          fullPage: true,
        });
      }

      // AI Stylist Intro Body
      const bodyText = page.locator(".editorial-page-intro p").last();
      const bodyColors = await bodyText.evaluate((el) => {
        const style = window.getComputedStyle(el);
        let parent = el.parentElement;
        let bg = window.getComputedStyle(parent!).backgroundColor;
        while (parent && (bg === "rgba(0, 0, 0, 0)" || bg === "transparent")) {
          parent = parent.parentElement;
          if (parent) bg = window.getComputedStyle(parent).backgroundColor;
        }
        return { fg: style.color, bg };
      });
      const ratio = calculateContrastRatio(bodyColors.fg, bodyColors.bg);
      expect(ratio, `AI Stylist Body Text contrast on ${t.name} must be >= 4.5:1`).toBeGreaterThanOrEqual(4.5);
    });
  }
});
