import { expect, test } from "@playwright/test";

const hasMerchantCredentials = Boolean(
  process.env.RUN_AUTHENTICATED_E2E === "1" &&
    process.env.E2E_MERCHANT_EMAIL &&
    process.env.E2E_MERCHANT_PASSWORD,
);

test.describe("Merchant purchase information", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium" || !hasMerchantCredentials,
      "Requires RUN_AUTHENTICATED_E2E=1 and merchant credentials.",
    );
  });

  test("accepts optional free text without marketplace or URL validation", async ({
    page,
  }) => {
    const openAiRequests: string[] = [];
    page.on("request", (request) => {
      if (/openai/i.test(request.url())) openAiRequests.push(request.url());
    });

    await page.goto("/login/merchant");
    await page.getByLabel("อีเมล").fill(process.env.E2E_MERCHANT_EMAIL!);
    await page.locator("#auth-password").fill(process.env.E2E_MERCHANT_PASSWORD!);
    await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
      timeout: 15_000,
    });

    await page.goto("/merchant/ads/new");
    await expect(
      page.getByRole("heading", { name: "สร้างโฆษณา", exact: true }),
    ).toBeVisible();

    const purchaseInfo = page.locator('textarea[name="purchaseInfo"]');
    await expect(purchaseInfo).toBeVisible();
    await expect(purchaseInfo).toHaveAttribute("maxlength", "500");
    await expect(page.locator('input[name="destinationUrl"]')).toHaveCount(0);

    await purchaseInfo.fill("สินค้าทดลอง ติดต่อร้านค้าทาง Line @testshop");
    await expect(
      page.getByText("สินค้าทดลอง ติดต่อร้านค้าทาง Line @testshop"),
    ).toBeVisible();

    await expect(page.getByText("ลิงก์ Shopee ไม่ถูกต้อง")).toHaveCount(0);
    await expect(page.getByText("ปลายทาง Shopee")).toHaveCount(0);
    await expect(page.getByText("ไป Shopee")).toHaveCount(0);

    await purchaseInfo.fill("");
    await expect(page.getByText("ช่องทางสั่งซื้อ", { exact: true })).toHaveCount(
      0,
    );
    expect(openAiRequests).toHaveLength(0);
  });
});
