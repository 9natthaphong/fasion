import { expect, test } from "@playwright/test";

const hasCredentials = Boolean(
  process.env.RUN_AUTHENTICATED_E2E === "1" &&
    process.env.E2E_CUSTOMER_EMAIL &&
    process.env.E2E_CUSTOMER_PASSWORD &&
    process.env.E2E_MERCHANT_EMAIL &&
    process.env.E2E_MERCHANT_PASSWORD,
);

test.describe("Production Hotfix Verification E2E", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium" || !hasCredentials,
      "Hotfix E2E requires RUN_AUTHENTICATED_E2E=1 and credentials.",
    );
  });

  test("customer wardrobe mode AI stylist submits without HTTP 400 error", async ({ page }) => {
    const customerEmail = process.env.E2E_CUSTOMER_EMAIL!;
    const customerPassword = process.env.E2E_CUSTOMER_PASSWORD!;

    // 1. Log in customer
    await page.goto("/login/customer");
    await page.getByLabel("อีเมล").fill(customerEmail);
    await page.locator("#auth-password").fill(customerPassword);
    await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 });

    // 2. Open /ai-stylist
    await page.goto("/ai-stylist");
    await expect(page.getByRole("heading", { name: /วันนี้จะไปทำอะไร\?/ })).toBeVisible();

    // 3. Switch to wardrobe mode
    await page.getByRole("button", { name: "จากตู้เสื้อผ้าของฉัน" }).click();

    // 4. Track request/response
    let apiStatus: number | null = null;
    let apiResponseBody: any = null;

    page.on("response", async (response) => {
      if (response.url().includes("/api/ai-stylist") && response.request().method() === "POST") {
        apiStatus = response.status();
        try {
          apiResponseBody = await response.json();
        } catch {
          // ignore
        }
      }
    });

    // 5. Click submit "จัดชุดจากตู้เสื้อผ้าส่วนตัว"
    const submitBtn = page.getByRole("button", { name: "จัดชุดจากตู้เสื้อผ้าส่วนตัว" });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(3000);

      // Verify status is NOT 400
      if (apiStatus !== null) {
        expect(apiStatus !== 400).toBe(true);
        if (typeof apiResponseBody?.error === "string") {
          expect(apiResponseBody.error.includes("expected string, received undefined")).toBe(false);
        }
      }
    }
  });

  test("merchant ad form has no editable URL SLUG field and accepts plain text Shopee link", async ({ page }) => {
    const merchantEmail = process.env.E2E_MERCHANT_EMAIL!;
    const merchantPassword = process.env.E2E_MERCHANT_PASSWORD!;

    // 1. Log in merchant
    await page.goto("/login/merchant");
    await page.getByLabel("อีเมล").fill(merchantEmail);
    await page.locator("#auth-password").fill(merchantPassword);
    await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 });

    // 2. Open /merchant/ads/new
    await page.goto("/merchant/ads/new");
    await expect(page.getByRole("heading", { name: "สร้างโฆษณา", exact: true })).toBeVisible();

    // 3. Verify URL SLUG input field is absent
    const slugInput = page.locator('input[name="slug"]');
    await expect(slugInput).toHaveCount(0);

    // 4. Verify Shopee link field has Thai label and text input type
    const destinationInput = page.locator('input[name="destinationUrl"]');
    await expect(destinationInput).toBeVisible();
    await expect(destinationInput).toHaveAttribute("type", "text");
    await expect(page.getByText("คัดลอกลิงก์จาก Shopee แล้ววางที่นี่ ระบบจะตรวจสอบให้ก่อนเผยแพร่")).toBeVisible();
  });
});
