import { expect, test } from "@playwright/test";

const viewports = [
  { width: 1440, height: 1000, name: "desktop" },
  { width: 1024, height: 768, name: "tablet" },
  { width: 390, height: 844, name: "mobile" },
  { width: 360, height: 800, name: "small_mobile" },
];

const themes = [
  { theme: "light", accent: "olive" },
  { theme: "dark", accent: "olive" },
  { theme: "dark", accent: "navy" },
  { theme: "dark", accent: "mono" },
];

const hasCredentials = Boolean(
  process.env.RUN_AUTHENTICATED_E2E === "1" &&
    process.env.E2E_CUSTOMER_EMAIL &&
    process.env.E2E_CUSTOMER_PASSWORD &&
    process.env.E2E_MERCHANT_EMAIL &&
    process.env.E2E_MERCHANT_PASSWORD &&
    process.env.E2E_ADMIN_EMAIL &&
    process.env.E2E_ADMIN_PASSWORD
);

async function login(page: unknown, route: string, email: string, password: string) {
  await page.goto(route);
  await page.getByLabel("อีเมล").fill(email);
  await page.locator("#auth-password").fill(password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
  await page.waitForURL((url: URL) => !url.pathname.startsWith("/login"), { timeout: 15_000 });
}

test.describe("Deep UX/UI Audit across Roles, Viewports, and Themes", () => {
  test.beforeEach(({}) => {
    test.skip(
      !hasCredentials,
      "Authenticated E2E requires RUN_AUTHENTICATED_E2E=1 and test accounts."
    );
  });

  const runAuditForRoutes = async (page: Page, routes: string[], rolePrefix: string) => {
    const contrastResults: unknown[] = [];
    
    for (const route of routes) {
      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        for (const t of themes) {
          await page.goto(route);
          
          // Apply theme
          await page.evaluate(({ theme, accent }: unknown) => {
            document.documentElement.setAttribute("data-theme", theme);
            document.documentElement.setAttribute("data-accent", accent);
          }, t);
          
          // Wait for rendering
          await page.waitForTimeout(500);

          // Assertions
          
          // 1. No horizontal overflow
          const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
          expect(overflow, `${rolePrefix} ${route} ${viewport.name} ${t.theme}/${t.accent} has horizontal overflow`).toBe(false);

          // 2. No broken images
          const brokenImages = await page.evaluate(() => {
            return Array.from(document.images).filter(img => img.complete && img.naturalWidth === 0).length;
          });
          expect(brokenImages, `${rolePrefix} ${route} ${viewport.name} ${t.theme}/${t.accent} has broken images`).toBe(0);

          // 3. Header contains no login CTA for authenticated users
          const loginCTACount = await page.getByRole("link", { name: "เข้าสู่ระบบ", exact: true }).count();
          expect(loginCTACount, `${rolePrefix} Header has login CTA on ${route}`).toBe(0);

          // 4. Contrast check (sampling primary buttons on page)
          const contrasts = await page.evaluate(() => {
            const getLuminance = (r: number, g: number, b: number) => {
              const a = [r, g, b].map((v) => {
                v /= 255;
                return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
              });
              return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
            };
            const getContrastRatio = (l1: number, l2: number) => {
              const lighter = Math.max(l1, l2);
              const darker = Math.min(l1, l2);
              return (lighter + 0.05) / (darker + 0.05);
            };
            const parseColor = (color: string) => {
              const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
              return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : [0,0,0];
            };

            const buttons = Array.from(document.querySelectorAll("button, a.button, a[class*='bg-']"));
            const results = [];
            for (let i = 0; i < Math.min(buttons.length, 3); i++) {
              const el = buttons[i];
              const style = window.getComputedStyle(el);
              const bg = parseColor(style.backgroundColor);
              const fg = parseColor(style.color);
              
              // Skip transparent backgrounds
              if (style.backgroundColor === "rgba(0, 0, 0, 0)" || style.backgroundColor === "transparent") continue;

              const l1 = getLuminance(bg[0], bg[1], bg[2]);
              const l2 = getLuminance(fg[0], fg[1], fg[2]);
              const ratio = getContrastRatio(l1, l2);
              
              results.push({
                text: el.textContent?.trim().substring(0, 20),
                ratio: Number(ratio.toFixed(2)),
                isPassing: ratio >= 3.0 // UI components and large text min WCAG AA
              });
            }
            return results;
          });

          for (const c of contrasts) {
            expect(c.isPassing, `${rolePrefix} Contrast too low (${c.ratio}) for button "${c.text}" on ${route} (${t.theme}/${t.accent})`).toBe(true);
            contrastResults.push({ route, theme: t.theme, accent: t.accent, ...c });
          }
          
          // 5. Take screenshots for specific combinations to save time (only Desktop Light Olive and Desktop Dark Navy)
          if (viewport.name === "desktop" && ( (t.theme === "light" && t.accent === "olive") || (t.theme === "dark" && t.accent === "navy") )) {
             const screenshotPath = `test-results/auth_${rolePrefix}_${route.replace(/\//g, "_")}_${t.theme}_${t.accent}.png`;
             await page.screenshot({ path: screenshotPath, fullPage: false });
          }
        }
      }
    }
  };

  test("Customer Routes Audit", async ({ page }) => {
    // Collect runtime errors
    const errors: string[] = [];
    page.on("pageerror", (err: Error) => errors.push(err.message));
    page.on("console", (msg: unknown) => { if (msg.type() === "error" && !msg.text().includes("webpack-hmr")) errors.push(msg.text()); });

    await login(page, "/login/customer", process.env.E2E_CUSTOMER_EMAIL!, process.env.E2E_CUSTOMER_PASSWORD!);
    await expect(page).toHaveURL(/\/account/);

    // Wait, the API route to request Pro is actually an action. 
    // I will just go to /pricing and click "ขอเปิดใช้งาน Pro" if it exists, or just do it via evaluate.
    await page.goto("/pricing");
    await page.waitForTimeout(1000);
    const requestProBtn = page.getByRole("button", { name: "ขอเปิดใช้งาน Pro" });
    if (await requestProBtn.isVisible()) {
      await requestProBtn.click();
      await page.waitForURL(/\/account\/subscription\/payment/);
    }

    const customerRoutes = [
      "/account", 
      "/account/wardrobe", 
      "/account/wardrobe/new", 
      "/account/profile", 
      "/account/outfits",
      "/account/style-memory", 
      "/account/weekly-planner", 
      "/account/subscription",
      "/account/subscription/payment", 
      "/account/settings"
    ];
    
    await runAuditForRoutes(page, customerRoutes, "customer");
    expect(errors, "Console or Page errors found during customer audit").toHaveLength(0);
  });

  test("Merchant Routes Audit", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err: Error) => errors.push(err.message));
    page.on("console", (msg: unknown) => { if (msg.type() === "error" && !msg.text().includes("webpack-hmr")) errors.push(msg.text()); });

    await login(page, "/login/merchant", process.env.E2E_MERCHANT_EMAIL!, process.env.E2E_MERCHANT_PASSWORD!);
    await expect(page).toHaveURL(/\/merchant/);
    
    const merchantRoutes = [
      "/merchant", 
      "/merchant/shop", 
      "/merchant/ads", 
      "/merchant/ads/new", 
      "/merchant/analytics", 
      "/merchant/settings"
    ];
    
    await runAuditForRoutes(page, merchantRoutes, "merchant");
    expect(errors, "Console or Page errors found during merchant audit").toHaveLength(0);
  });

  test("Admin Routes Audit", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err: Error) => errors.push(err.message));
    page.on("console", (msg: unknown) => { if (msg.type() === "error" && !msg.text().includes("webpack-hmr")) errors.push(msg.text()); });

    await login(page, "/login/customer", process.env.E2E_ADMIN_EMAIL!, process.env.E2E_ADMIN_PASSWORD!);
    await expect(page).toHaveURL(/\/admin/);
    
    const adminRoutes = [
      "/admin", 
      "/admin/shops", 
      "/admin/ads", 
      "/admin/users", 
      "/admin/subscriptions"
    ];
    
    await runAuditForRoutes(page, adminRoutes, "admin");
    expect(errors, "Console or Page errors found during admin audit").toHaveLength(0);
  });
});
