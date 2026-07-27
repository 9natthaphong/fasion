import { expect, test } from "@playwright/test";

test("public discovery journey has no overflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /วันนี้จะไปไหน/ })).toBeVisible();
  await page.getByRole("link", { name: "ดูสไตล์จากร้านค้า" }).click();
  await expect(page).toHaveURL(/\/discover/);
  await expect(page.getByRole("heading", { name: "ค้นหาสไตล์จากร้านค้า" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});

test("opens a demo shop and ad without broken images", async ({ page }) => {
  await page.goto("/shops/quiet-form");
  await expect(page.getByRole("heading", { name: "Quiet Form" })).toBeVisible();
  await page.goto("/ads/linen-utility-shirt");
  await expect(page.getByRole("heading", { name: "เสื้อลินิน Utility" })).toBeVisible();
  await expect(page.locator("img").first()).toHaveJSProperty("complete", true);
});

test("AI form is explicit when the server key is absent", async ({ page }) => {
  await page.goto("/ai-stylist");
  await expect(page.getByText("Development configuration missing")).toBeVisible();
  await expect(page.getByRole("button", { name: "สร้างคำแนะนำ 3 ชุด" })).toBeDisabled();
});

test("customer and merchant authentication entry points are separate", async ({ page }) => {
  await page.goto("/login/customer");
  await expect(page.getByRole("heading", { name: /เข้าสู่ระบบลูกค้า/ })).toBeVisible();
  await page.goto("/login/merchant");
  await expect(page.getByRole("heading", { name: /เข้าสู่ระบบร้านค้า/ })).toBeVisible();
});

test("admin route redirects an anonymous visitor", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login\/customer/);
});
