import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const hasAdminCredentials = Boolean(
  process.env.RUN_AUTHENTICATED_E2E === "1" &&
    process.env.E2E_ADMIN_EMAIL &&
    process.env.E2E_ADMIN_PASSWORD,
);
const hasCustomerAndMerchantCredentials = Boolean(
  process.env.RUN_AUTHENTICATED_E2E === "1" &&
    process.env.E2E_CUSTOMER_EMAIL &&
    process.env.E2E_CUSTOMER_PASSWORD &&
    process.env.E2E_MERCHANT_EMAIL &&
    process.env.E2E_MERCHANT_PASSWORD,
);

test.describe("Admin customer experience mode", () => {
  test.beforeEach(({ }, testInfo) => {
    test.skip(testInfo.project.name === "mobile" && !hasAdminCredentials, "Admin E2E requires the ignored admin fixture.");
    test.skip(!hasAdminCredentials, "Admin E2E requires RUN_AUTHENTICATED_E2E=1 and the ignored admin fixture.");
  });

  test("switches between customer and admin views without enabling billing or deletion", async ({ page }) => {
    await page.goto("/login/customer");
    await page.locator('input[type="email"]').fill(process.env.E2E_ADMIN_EMAIL!);
    await page.locator("#auth-password").fill(process.env.E2E_ADMIN_PASSWORD!);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 });

    await page.goto("/account");
    await expect(page.getByText("โหมดทดสอบผู้ดูแล", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "มุมมองลูกค้า", exact: true })).toHaveCount(0);

    const wardrobeResponse = await page.request.get(new URL("/api/wardrobe", page.url()).toString());
    expect(wardrobeResponse.status()).toBe(200);
    let createdItemId: string | null = null;
    try {
      const uploadResponse = await page.request.post(new URL("/api/wardrobe/upload", page.url()).toString(), {
        multipart: {
          file: {
            name: "admin-mode-wardrobe.jpg",
            mimeType: "image/jpeg",
            buffer: fs.readFileSync(path.resolve("tests/fixtures/payment-slip.jpg")),
          },
        },
      });
      expect(uploadResponse.status()).toBe(200);
      const upload = await uploadResponse.json() as { storagePath: string };
      const createResponse = await page.request.post(new URL("/api/wardrobe", page.url()).toString(), {
        data: {
          imagePath: upload.storagePath,
          itemType: "top",
          name: "Admin mode wardrobe fixture",
          primaryColors: ["black"],
          styles: ["minimal"],
          weatherSuitability: ["warm"],
          availabilityStatus: "available",
          isFavorite: false,
        },
      });
      expect(createResponse.status()).toBe(200);
      const created = await createResponse.json() as { item: { id: string } };
      createdItemId = created.item.id;
      const updateResponse = await page.request.patch(new URL(`/api/wardrobe/${createdItemId}`, page.url()).toString(), {
        data: { name: "Admin mode wardrobe updated" },
      });
      expect(updateResponse.status()).toBe(200);
    } finally {
      if (createdItemId) {
        const deleteResponse = await page.request.delete(new URL(`/api/wardrobe/${createdItemId}?permanent=true`, page.url()).toString());
        expect(deleteResponse.status()).toBe(200);
      }
    }

    await page.goto("/account/subscription");
    await expect(page.getByText("บัญชีผู้ดูแลมีสิทธิ์ Pro สำหรับการทดสอบระบบ", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: /รายละเอียดแพ็กเกจ|ชำระเงิน|เปิดใช้งาน/ })).toHaveCount(0);

    await page.goto("/account/subscription/payment");
    await expect(page).toHaveURL(/\/account\/subscription\?adminMode=1/);
    await expect(page.getByText("ไม่สามารถส่งคำขอชำระเงินหรือแนบสลิปได้")).toBeVisible();

    await page.goto("/account/settings");
    await expect(page.getByText("ไม่สามารถส่งคำขอลบบัญชีผ่านมุมมองลูกค้าได้", { exact: false })).toBeVisible();
    await expect(page.getByRole("button", { name: /ลบบัญชี|ส่งคำขอลบบัญชี/ })).toHaveCount(0);

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin$/);
  });

  test("keeps customer and merchant roles out of the opposite areas", async ({ browser }) => {
    test.skip(!hasCustomerAndMerchantCredentials, "Customer and merchant fixtures are not configured.");
    const customerContext = await browser.newContext();
    const merchantContext = await browser.newContext();
    try {
      const customer = await customerContext.newPage();
      await customer.goto("/login/customer");
      await customer.locator('input[type="email"]').fill(process.env.E2E_CUSTOMER_EMAIL!);
      await customer.locator("#auth-password").fill(process.env.E2E_CUSTOMER_PASSWORD!);
      await customer.locator('button[type="submit"]').click();
      await customer.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 });
      await customer.goto("/admin");
      await expect(customer).not.toHaveURL(/\/admin(?:\/|$)/);

      const merchant = await merchantContext.newPage();
      await merchant.goto("/login/merchant");
      await merchant.locator('input[type="email"]').fill(process.env.E2E_MERCHANT_EMAIL!);
      await merchant.locator("#auth-password").fill(process.env.E2E_MERCHANT_PASSWORD!);
      await merchant.locator('button[type="submit"]').click();
      await merchant.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 });
      await merchant.goto("/account");
      await expect(merchant).not.toHaveURL(/\/account(?:\/|$)/);
    } finally {
      await customerContext.close();
      await merchantContext.close();
    }
  });
});
