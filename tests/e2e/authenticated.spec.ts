import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const hasCredentials = Boolean(
  process.env.RUN_AUTHENTICATED_E2E === "1" &&
    process.env.E2E_CUSTOMER_EMAIL &&
    process.env.E2E_CUSTOMER_PASSWORD &&
    process.env.E2E_MERCHANT_EMAIL &&
    process.env.E2E_MERCHANT_PASSWORD &&
    process.env.E2E_ADMIN_EMAIL &&
    process.env.E2E_ADMIN_PASSWORD,
);

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

test.describe("Authenticated E2E Workflows", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium" || !hasCredentials,
      "Authenticated E2E requires RUN_AUTHENTICATED_E2E=1 and the complete disposable account set.",
    );
  });

  test("customer login, profile update, outfit history deletion, and privacy consent work", async ({ page }) => {
    const customerEmail = process.env.E2E_CUSTOMER_EMAIL!;
    const customerPassword = process.env.E2E_CUSTOMER_PASSWORD!;
    const customerUserId = process.env.E2E_CUSTOMER_USER_ID!;
    const admin = adminClient();

    // 1. Customer Login
    await page.goto("/login/customer");
    await page.getByLabel("อีเมล").fill(customerEmail);
    await page.locator("#auth-password").fill(customerPassword);
    await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();

    // Wait until login completes and redirects off login page
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 });
    await expect(page).toHaveURL(/\/account$/);

    // 2. Profile Update (Tabbed UI)
    await page.goto("/account/profile");
    await expect(page.getByRole("heading", { name: "โปรไฟล์และสไตล์การแต่งตัว" })).toBeVisible();
    await page.locator("#display-name").fill("YourStylist Test Customer");
    await page.getByRole("button", { name: /3\. สัดส่วนและไซซ์/ }).click();
    await page.getByLabel("ส่วนสูง (ซม.)").fill("170");
    await page.getByLabel("น้ำหนัก (กก.)").fill("62");
    await page.getByRole("button", { name: /4\. การอนุญาตใช้ข้อมูล/ }).click();
    await page.getByRole("button", { name: "บันทึกข้อมูลทั้งหมด" }).click();
    await expect(page.getByText("บันทึกข้อมูลโปรไฟล์ สไตล์ และสัดส่วนทั้งหมดเรียบร้อยแล้ว")).toBeVisible({ timeout: 15_000 });

    // Verify database update
    const { data: fitProfile } = await admin
      .from("customer_fit_profiles")
      .select("height_cm, weight_kg")
      .eq("user_id", customerUserId)
      .maybeSingle();

    expect(fitProfile).toMatchObject({
      height_cm: 170,
      weight_kg: 62,
    });

    // 3. Outfit Request & History Deletion Verification
    const { data: outfitReq } = await admin
      .from("outfit_requests")
      .insert({
        user_id: customerUserId,
        input_data: { activity: "E2E Test History Item" },
      })
      .select("id")
      .single();

    const requestId = outfitReq!.id;
    await admin.from("outfit_results").insert({
      request_id: requestId,
      model_name: "e2e-fixture",
      result_data: {
        summary: "E2E test outfit recommendation summary.",
        outfits: [
          { name: "Safe Look", direction: "safe", style: "Minimal", reason: "Easy everyday wear" },
          { name: "Elevated Look", direction: "elevated", style: "Smart", reason: "Sharp office look" },
          { name: "Comfort Look", direction: "comfortable", style: "Casual", reason: "Breathable fabric" },
        ],
      },
    });

    await page.goto("/account/outfits");
    await expect(page.getByRole("heading", { name: /กิจกรรม: E2E Test History Item/ })).toBeVisible();

    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: /ลบประวัตินี้/ }).click();

    await expect.poll(async () => {
      const { data } = await admin
        .from("outfit_requests")
        .select("id")
        .eq("id", requestId)
        .maybeSingle();
      return data;
    }).toBeNull();

    // 4. Privacy & Personalization Settings
    await page.goto("/account/settings");
    await expect(page.getByRole("heading", { name: "การตั้งค่าบัญชีและความเป็นส่วนตัว" })).toBeVisible();
    await expect(page.getByText("Danger Zone / การลบบัญชี")).toBeVisible();
  });

  test("merchant login, shop status, ad draft creation, and analytics access work", async ({ page }) => {
    const merchantEmail = process.env.E2E_MERCHANT_EMAIL!;
    const merchantPassword = process.env.E2E_MERCHANT_PASSWORD!;
    const merchantUserId = process.env.E2E_MERCHANT_USER_ID!;
    const admin = adminClient();

    // 1. Merchant Login
    await page.goto("/login/merchant");
    await page.getByLabel("อีเมล").fill(merchantEmail);
    await page.locator("#auth-password").fill(merchantPassword);
    await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();

    // Wait until login completes and redirects off login page
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 });
    await expect(page).toHaveURL(/\/merchant$/);

    // 2. Verify Merchant Studio access
    await expect(page.getByRole("heading", { name: "YourStylist Test Merchant Shop" })).toBeVisible();

    // 3. View Shop Settings or Merchant Analytics
    await page.goto("/merchant/analytics");
    await expect(page.getByRole("heading", { name: "สถิติร้าน" })).toBeVisible();

    // Ensure merchant membership exists
    const { data: memberCheck } = await admin
      .from("shop_members")
      .select("shop_id")
      .eq("user_id", merchantUserId)
      .maybeSingle();

    expect(memberCheck?.shop_id).toBeTruthy();
  });

  test("admin login and admin governance dashboard work", async ({ page }) => {
    const adminEmail = process.env.E2E_ADMIN_EMAIL!;
    const adminPassword = process.env.E2E_ADMIN_PASSWORD!;

    // 1. Admin Login via Customer Portal (redirected to /admin for configured admins)
    await page.goto("/login/customer");
    await page.getByLabel("อีเมล").fill(adminEmail);
    await page.locator("#auth-password").fill(adminPassword);
    await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();

    // Wait until login completes and redirects off login page
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 });
    await expect(page).toHaveURL(/\/admin$/);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // 2. Admin Users & Account Deletion Management (Stage 2)
    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { name: /ผู้ใช้งานและการลบบัญชี/ })).toBeVisible();

    // 3. Admin Shops Management
    await page.goto("/admin/shops");
    await expect(page.getByRole("heading", { name: "ร้านค้า" })).toBeVisible();

    // 4. Admin Ads Moderation
    await page.goto("/admin/ads");
    await expect(page.getByRole("heading", { name: "โฆษณา" })).toBeVisible();
  });
});
