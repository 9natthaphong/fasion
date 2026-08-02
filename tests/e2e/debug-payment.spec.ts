import { test, expect } from "@playwright/test";

test("check payment page redirect", async ({ page }) => {
  await page.goto("/login/customer");
  await page.getByLabel("อีเมล").fill(process.env.E2E_CUSTOMER_EMAIL!);
  await page.locator("#auth-password").fill(process.env.E2E_CUSTOMER_PASSWORD!);
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
  await page.waitForURL((url: URL) => !url.pathname.startsWith("/login"), { timeout: 15_000 });

  console.log("Logged in, going to payment page...");
  const response = await page.goto("/account/subscription/payment");
  await page.waitForTimeout(2000);
  
  console.log("Current URL:", page.url());
  const loginCTAs = await page.getByRole("link", { name: "เข้าสู่ระบบ", exact: true }).all();
  console.log("Found login CTAs:", loginCTAs.length);
  
  if (loginCTAs.length > 0) {
    console.log("HTML of the body:", await page.evaluate(() => document.body.innerHTML.substring(0, 500) + "..."));
  }
});
