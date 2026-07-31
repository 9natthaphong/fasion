import { expect, test, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import path from "node:path";

const hasCredentials = Boolean(
  process.env.RUN_AUTHENTICATED_E2E === "1" &&
    process.env.E2E_CUSTOMER_EMAIL &&
    process.env.E2E_CUSTOMER_PASSWORD &&
    process.env.E2E_CUSTOMER_USER_ID &&
    process.env.E2E_ADMIN_EMAIL &&
    process.env.E2E_ADMIN_PASSWORD &&
    process.env.E2E_ADMIN_USER_ID &&
    process.env.SUPABASE_SECRET_KEY &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
);

function serviceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function authenticatedAdminClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

async function login(page: Page, route: string, email: string, password: string) {
  await page.goto(route);
  await page.getByLabel("อีเมล").fill(email);
  await page.locator("#auth-password").fill(password);
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 });
}

async function cleanupCustomerData(admin: SupabaseClient, userId: string) {
  const { data: requests } = await admin
    .from("customer_subscription_requests")
    .select("id")
    .eq("user_id", userId);

  for (const request of requests ?? []) {
    const { data: proofs } = await admin
      .from("subscription_payment_proofs")
      .select("id, storage_path")
      .eq("request_id", request.id);

    const storagePaths = (proofs ?? []).map((proof) => proof.storage_path);
    if (storagePaths.length > 0) {
      await admin.storage.from("payment-slips").remove(storagePaths);
    }
    await admin.from("subscription_payment_proofs").delete().eq("request_id", request.id);
  }

  await admin.from("customer_subscription_requests").delete().eq("user_id", userId);
  await admin.from("customer_subscriptions").delete().eq("user_id", userId);
}

test.describe("Membership lifecycle", () => {
  test.beforeEach(({ }, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium" || !hasCredentials,
      "Authenticated E2E requires the ignored disposable account environment.",
    );
  });

  test("customer upload navigates, admin approves atomically, and Pro activates", async ({ page, browser }) => {
    const customerUserId = process.env.E2E_CUSTOMER_USER_ID!;
    const adminUserId = process.env.E2E_ADMIN_USER_ID!;
    const admin = serviceClient();
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    let requestId: string | null = null;
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();

    try {
      await cleanupCustomerData(admin, customerUserId);

      await login(
        page,
        "/login/customer",
        process.env.E2E_CUSTOMER_EMAIL!,
        process.env.E2E_CUSTOMER_PASSWORD!,
      );
      await page.goto("/pricing");
      await page.getByRole("button", { name: "ขอเปิดใช้งาน Pro", exact: true }).click();
      await page.waitForURL("**/account/subscription/payment", { timeout: 20_000 });
      await expect(page.getByText("9 บาท")).toBeVisible();

      const qr = page.getByAltText("Payment QR Code");
      await expect(qr).toBeVisible();
      await expect.poll(() => qr.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);

      await page.locator('input[type="file"]').setInputFiles(
        path.resolve("tests/fixtures/payment-slip.jpg"),
      );
      await page.getByLabel("ฉันตรวจสอบยอดและข้อมูลการโอนแล้ว").check();
      await page.getByRole("button", { name: "ส่งเพื่อตรวจสอบ", exact: true }).click();
      await page.waitForURL((url) => url.pathname === "/account/subscription", { timeout: 20_000 });
      await expect(page.getByText("คำขอของคุณอยู่ระหว่างการพิจารณา (Pending Review)")).toBeVisible();

      const { data: request, error: requestError } = await admin
        .from("customer_subscription_requests")
        .select("id, payment_status")
        .eq("user_id", customerUserId)
        .eq("status", "pending")
        .single();
      expect(requestError).toBeNull();
      expect(request?.payment_status).toBe("submitted");
      requestId = request?.id ?? null;
      expect(requestId).toBeTruthy();

      const { data: proof, error: proofError } = await admin
        .from("subscription_payment_proofs")
        .select("storage_path, expected_amount_thb, status")
        .eq("request_id", requestId!)
        .eq("status", "submitted")
        .single();
      expect(proofError).toBeNull();
      expect(proof?.expected_amount_thb).toBe(9);

      await login(
        adminPage,
        "/login/customer",
        process.env.E2E_ADMIN_EMAIL!,
        process.env.E2E_ADMIN_PASSWORD!,
      );
      await adminPage.goto(`/admin/subscriptions/${requestId}`);
      const slip = adminPage.getByAltText("Payment Proof");
      await expect(slip).toBeVisible();
      await expect.poll(() => slip.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);

      await adminPage.getByRole("button", { name: "ยืนยันสลิปและอนุมัติ Pro", exact: true }).click();
      await expect.poll(async () => {
        const { data } = await admin
          .from("customer_subscription_requests")
          .select("status, payment_status")
          .eq("id", requestId!)
          .single();
        return data;
      }).toEqual({ status: "approved", payment_status: "verified" });

      await page.goto("/account/subscription");
      await expect(page.getByText("แพ็กเกจปัจจุบัน: Pro")).toBeVisible();

      // Re-run the RPC through a real authenticated admin session. The
      // forward-fix should return already_approved without another mutation.
      const adminSession = authenticatedAdminClient();
      const { error: signInError } = await adminSession.auth.signInWithPassword({
        email: process.env.E2E_ADMIN_EMAIL!,
        password: process.env.E2E_ADMIN_PASSWORD!,
      });
      expect(signInError).toBeNull();
      const { data: repeatResult, error: repeatError } = await adminSession.rpc(
        "approve_subscription_request",
        {
          p_request_id: requestId,
          p_user_id: customerUserId,
          p_is_first_month: true,
          p_admin_id: adminUserId,
        },
      );
      expect(repeatError).toBeNull();
      expect(repeatResult).toEqual({ status: "already_approved" });

      const { data: subscriptions } = await admin
        .from("customer_subscriptions")
        .select("id, status, approved_price_thb")
        .eq("user_id", customerUserId);
      expect(subscriptions).toHaveLength(1);
      expect(subscriptions?.[0]?.status).toBe("active");
      expect(subscriptions?.[0]?.approved_price_thb).toBe(9);
    } finally {
      await adminContext.close();
      await cleanupCustomerData(admin, customerUserId);
      expect(consoleErrors).toEqual([]);
    }
  });
});
