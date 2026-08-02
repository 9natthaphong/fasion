import { expect, test } from "@playwright/test";

test("redirects /login and /register top-level paths cleanly", async ({ page }) => {
  await page.goto("/login");
  await expect(page).toHaveURL(/\/login\/customer/);

  await page.goto("/register");
  await expect(page).toHaveURL(/\/register\/customer/);
});

test("pricing page links point to valid authentication routes", async ({ page }) => {
  await page.goto("/pricing");
  const freeLink = page.getByRole("link", { name: "สมัครสมาชิกฟรี" });
  await expect(freeLink).toHaveAttribute("href", "/register/customer");

  const proLink = page.getByRole("link", { name: "เข้าสู่ระบบเพื่อสมัคร Pro" });
  await expect(proLink).toHaveAttribute("href", "/login/customer");
});

test("theme accent attributes render without style failures", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    document.documentElement.setAttribute("data-accent", "navy");
  });
  const accent = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--olive").trim());
  expect(accent).toBe("#1e3a8a");
});
