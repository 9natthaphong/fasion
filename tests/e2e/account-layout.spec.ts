import { expect, test, type Page } from "@playwright/test";

const hasAdminCredentials = Boolean(
  process.env.RUN_AUTHENTICATED_E2E === "1" &&
    process.env.E2E_ADMIN_EMAIL &&
    process.env.E2E_ADMIN_PASSWORD,
);

const routes = [
  "/account/style-memory",
  "/account/weekly-planner",
  "/account",
  "/account/settings",
  "/account/subscription",
];

const themes = [
  { name: "light-olive", theme: "light", accent: "olive", scheme: "light" as const },
  { name: "dark-olive", theme: "dark", accent: "olive", scheme: "dark" as const },
  { name: "dark-navy", theme: "dark", accent: "navy", scheme: "dark" as const },
  { name: "dark-mono", theme: "dark", accent: "monochrome", scheme: "dark" as const },
  { name: "system-light", theme: "system", accent: "olive", scheme: "light" as const },
  { name: "system-dark", theme: "system", accent: "olive", scheme: "dark" as const },
];

async function loginAdmin(page: Page) {
  await page.goto("/login/customer");
  await page.locator('input[type="email"]').fill(process.env.E2E_ADMIN_EMAIL!);
  await page.locator("#auth-password").fill(process.env.E2E_ADMIN_PASSWORD!);
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(2_000);
  await expect(page).not.toHaveURL(/\/login(?:\/|$)/, { timeout: 15_000 });
}

async function applyAppearance(page: Page, theme: (typeof themes)[number]) {
  const host = new URL(page.url()).hostname;
  await page.context().addCookies([
    { name: "appearance_theme", value: theme.theme, domain: host, path: "/" },
    { name: "appearance_accent", value: theme.accent, domain: host, path: "/" },
  ]);
  await page.emulateMedia({ colorScheme: theme.scheme });
}

async function getLayoutMetrics(page: Page) {
  return page.evaluate(() => {
    const rect = (element: Element | null) => {
      if (!element) return null;
      const box = element.getBoundingClientRect();
      return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, width: box.width, height: box.height };
    };
    const shell = document.querySelector(".dashboard-shell");
    const nav = document.querySelector(".dashboard-nav");
    const content = document.querySelector(".dashboard-content");
    const title = document.querySelector(".dashboard-content h1");
    const headerActions = document.querySelector<HTMLElement>(".site-header-actions");
    const logout = nav?.querySelector("form") ?? null;
    const decorations = [...document.querySelectorAll<HTMLElement>("[data-account-decoration]")].map((element) => ({
      box: rect(element),
      ariaHidden: element.getAttribute("aria-hidden"),
      parentBox: rect(element.parentElement),
      parentPosition: getComputedStyle(element.parentElement ?? element).position,
      parentOverflow: getComputedStyle(element.parentElement ?? element).overflow,
    }));
    const titleBox = rect(title);
    const contentBox = rect(content);
    const navBox = rect(nav);
    const logoutBox = rect(logout);
    const overlap = Boolean(
      titleBox && logoutBox &&
        titleBox.left < logoutBox.right && titleBox.right > logoutBox.left &&
        titleBox.top < logoutBox.bottom && titleBox.bottom > logoutBox.top,
    );
    return {
      viewportWidth: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      shell: rect(shell),
      nav: navBox,
      content: contentBox,
      title: titleBox,
      headerActions: rect(headerActions),
      headerOverflow: headerActions ? headerActions.scrollWidth - headerActions.clientWidth : 0,
      logout: logoutBox,
      titleLogoutOverlap: overlap,
      titleStyle: title ? {
        fontSize: getComputedStyle(title).fontSize,
        lineHeight: getComputedStyle(title).lineHeight,
        maxWidth: getComputedStyle(title).maxWidth,
        textWrap: getComputedStyle(title).textWrap,
      } : null,
      decorations,
    };
  });
}

test.describe("account shell responsive layout and themes", () => {
  test.beforeEach(() => {
    test.skip(!hasAdminCredentials, "Requires RUN_AUTHENTICATED_E2E=1 and the ignored admin fixture.");
  });

  test("keeps every account page in the main column across supported themes", async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    await loginAdmin(page);
    await page.setViewportSize({ width: 1440, height: 1000 });
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));

    for (const theme of themes) {
      await applyAppearance(page, theme);
      for (const route of routes) {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await page.locator(".dashboard-content").waitFor({ state: "visible" });
        const metrics = await getLayoutMetrics(page);
        if (testInfo.project.name === "chromium" && route === "/account/style-memory" && theme.name === "dark-olive") {
          await page.screenshot({ path: `test-results/account-style-memory-${theme.name}.png`, fullPage: true });
          console.log(`account-layout ${route} ${theme.name}`, JSON.stringify(metrics));
        }
        expect(metrics.scrollWidth, `${route} ${theme.name} has horizontal overflow`).toBeLessThanOrEqual(metrics.viewportWidth + 1);
        expect(metrics.content, `${route} ${theme.name} is missing content`).not.toBeNull();
        expect(metrics.title, `${route} ${theme.name} is missing a title`).not.toBeNull();
        expect(metrics.nav, `${route} ${theme.name} is missing navigation`).not.toBeNull();
        expect(metrics.title!.left, `${route} ${theme.name} title starts before main content`).toBeGreaterThanOrEqual(metrics.content!.left - 1);
        expect(metrics.title!.right, `${route} ${theme.name} title ends outside main content`).toBeLessThanOrEqual(metrics.content!.right + 1);
        expect(metrics.title!.width, `${route} ${theme.name} title is abnormally narrow`).toBeGreaterThan(Math.min(240, metrics.content!.width * 0.5));
        expect(metrics.headerOverflow, `${route} ${theme.name} header actions overflow`).toBeLessThanOrEqual(1);
        expect(metrics.titleLogoutOverlap, `${route} ${theme.name} logout overlaps content`).toBe(false);
        expect(metrics.decorations.every((decoration) => {
          if (!decoration.box || !decoration.parentBox) return false;
          return decoration.ariaHidden === "true" &&
            decoration.box.left >= decoration.parentBox.left - 1 &&
            decoration.box.right <= decoration.parentBox.right + 1 &&
            decoration.box.top >= decoration.parentBox.top - 1 &&
            decoration.box.bottom <= decoration.parentBox.bottom + 1 &&
            decoration.parentPosition !== "static" &&
            ["hidden", "clip", "auto", "scroll"].includes(decoration.parentOverflow);
        }), `${route} ${theme.name} decoration escapes its container`).toBe(true);
      }
    }
    expect(errors, `browser errors: ${errors.join(" | ")}`).toEqual([]);
  });

  test("keeps style memory usable at tablet and small mobile sizes", async ({ page }) => {
    test.setTimeout(120_000);
    await loginAdmin(page);
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    const viewports = [
      { name: "tablet", width: 1024, height: 768 },
      { name: "mobile", width: 390, height: 844 },
      { name: "small-mobile", width: 360, height: 800 },
    ];
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      for (const theme of themes.slice(0, 2)) {
        await applyAppearance(page, theme);
        await page.goto("/account/style-memory", { waitUntil: "domcontentloaded" });
        await page.locator(".dashboard-content").waitFor({ state: "visible" });
        const metrics = await getLayoutMetrics(page);
        await page.screenshot({ path: `test-results/account-style-memory-${viewport.name}-${theme.name}.png`, fullPage: true });
        expect(metrics.scrollWidth, `${viewport.name} ${theme.name} has horizontal overflow`).toBeLessThanOrEqual(metrics.viewportWidth + 1);
        expect(metrics.title!.width, `${viewport.name} ${theme.name} title is abnormally narrow`).toBeGreaterThan(metrics.viewportWidth * 0.55);
        expect(metrics.headerOverflow, `${viewport.name} ${theme.name} header actions overflow`).toBeLessThanOrEqual(1);
        expect(metrics.titleLogoutOverlap, `${viewport.name} ${theme.name} logout overlaps content`).toBe(false);
      }
    }
    expect(errors, `mobile browser errors: ${errors.join(" | ")}`).toEqual([]);
  });
});
