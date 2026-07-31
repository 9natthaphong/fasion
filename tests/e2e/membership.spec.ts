import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const hasCredentials = Boolean(
  process.env.RUN_AUTHENTICATED_E2E === "1" &&
    process.env.E2E_CUSTOMER_EMAIL &&
    process.env.E2E_CUSTOMER_PASSWORD &&
    process.env.E2E_ADMIN_EMAIL &&
    process.env.E2E_ADMIN_PASSWORD
);

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

test.describe("Membership Lifecycle E2E Workflows", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium" || !hasCredentials,
      "Authenticated E2E requires RUN_AUTHENTICATED_E2E=1 and the complete disposable account set.",
    );
  });

  test("Customer requests Pro, Admin approves, Customer accesses Pro features", async ({ page, browser }) => {
    const customerEmail = process.env.E2E_CUSTOMER_EMAIL!;
    const customerPassword = process.env.E2E_CUSTOMER_PASSWORD!;
    const customerUserId = process.env.E2E_CUSTOMER_USER_ID!;
    
    const adminEmail = process.env.E2E_ADMIN_EMAIL!;
    const adminPassword = process.env.E2E_ADMIN_PASSWORD!;
    
    const admin = adminClient();

    // Reset state for this user (delete subscription, requests, and proofs)
    const reqList = await admin.from("customer_subscription_requests").select("id").eq("user_id", customerUserId);
    for (const req of (reqList.data ?? [])) {
      await admin.from("subscription_payment_proofs").delete().eq("request_id", req.id);
    }
    await admin.from("customer_subscriptions").delete().eq("user_id", customerUserId);
    await admin.from("customer_subscription_requests").delete().eq("user_id", customerUserId);

    // 1. Customer logs in and requests Pro
    await page.goto("/login/customer");
    await page.getByLabel("อีเมล").fill(customerEmail);
    await page.locator("#auth-password").fill(customerPassword);
    await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 });
    
    await page.goto("/pricing");
    await expect(page.getByRole("button", { name: "ขอเปิดใช้งาน Pro" })).toBeVisible();
    await page.getByRole("button", { name: "ขอเปิดใช้งาน Pro" }).click();
    await page.waitForURL("**/account/subscription/payment", { timeout: 20_000 });
    await expect(page.getByText("อัปโหลดสลิปการโอนเงิน")).toBeVisible();
    // Write temp test slip file
    const testSlipPath = 'test-slip.jpg';
    fs.writeFileSync(testSlipPath, Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64'));
    await page.locator('input[type="file"]').setInputFiles(testSlipPath);
    await page.getByLabel("ฉันตรวจสอบยอดและข้อมูลการโอนแล้ว").check();
    await page.getByRole("button", { name: "ส่งเพื่อตรวจสอบ" }).click();

    await page.waitForURL("**/account/subscription");
    await expect(page.getByText("คำขอของคุณอยู่ระหว่างการพิจารณา (Pending Review)")).toBeVisible();
    
    // Clean up test file
    fs.unlinkSync(testSlipPath);

    // 2. Admin approves Pro
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    
    await adminPage.goto("/login/admin"); // admin login is usually /login/admin
    await adminPage.getByLabel("อีเมล").fill(adminEmail);
    await adminPage.locator("#auth-password").fill(adminPassword);
    await adminPage.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
    await adminPage.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 });
    
    await adminPage.goto("/admin/subscriptions");
    await expect(adminPage.getByText("คำขอที่รออนุมัติ")).toBeVisible();
    await adminPage.getByRole("button", { name: "อนุมัติ (เดือนแรก 9 บ.)" }).first().click();
    
    // 3. Customer accesses Pro features
    await page.goto("/account/subscription");
    await expect(page.getByText("แพ็กเกจปัจจุบัน: Pro")).toBeVisible();
    
    // Weekly Planner
    await page.goto("/account/weekly-planner");
    await expect(page.getByText("Weekly Planner")).toBeVisible();
    
    // Style Memory
    await page.goto("/account/style-memory");
    await expect(page.getByText("บันทึกสไตล์ประจำสัปดาห์")).toBeVisible();

    // 4. Admin revokes Pro
    await adminPage.goto("/admin/subscriptions");
    await adminPage.getByRole("button", { name: "ระงับสิทธิ์" }).first().click();
    
    // 5. Customer loses access
    await page.goto("/account/weekly-planner");
    await expect(page.getByText("ฟีเจอร์สำหรับสมาชิก Pro")).toBeVisible();
  });
});
