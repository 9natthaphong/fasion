import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

test.describe("Account Deletion", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "chromium" || !process.env.E2E_ADMIN_EMAIL);
  });

  test("destructive account deletion workflow", async ({ page }) => {
    const admin = adminClient();
    
    // 1. Create disposable user
    const email = `disposable-${Date.now()}@example.com`;
    const password = "TestPassword123!";
    
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: "Disposable Test", requested_role: "customer" }
    });
    
    expect(authErr).toBeNull();
    const userId = authData.user!.id;

    // 2. Add fixtures
    await admin.from("customer_preferences").insert({
      user_id: userId,
      preferred_styles: ["Minimal"]
    });
    
    await admin.from("outfit_requests").insert({
      id: "44444444-4444-4444-4444-444444444444",
      user_id: userId,
      input_data: { test: true }
    });
    await admin.from("outfit_results").insert({
      id: "55555555-5555-5555-5555-555555555555",
      request_id: "44444444-4444-4444-4444-444444444444",
      model_name: "test-model",
      result_data: { test: true }
    });
    await admin.from("outfit_result_items").insert({
      outfit_result_id: "55555555-5555-5555-5555-555555555555",
      item_type: "top",
      name: "test",
      search_query: "test"
    });

    // 3. Customer login
    await page.goto("/login/customer");
    await page.getByLabel("อีเมล").fill(email);
    await page.locator("#auth-password").fill(password);
    await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 });

    // Request deletion
    const res = await page.request.post('/api/account/delete-request', {
      data: { confirmation: 'DELETE' }
    });
    expect(res.ok()).toBeTruthy();

    // 4. Admin processing
    const { data: requestRow } = await admin.from("account_deletion_requests").select("id").eq("user_id", userId).single();
    expect(requestRow).toBeTruthy();

    const adminEmail = process.env.E2E_ADMIN_EMAIL!;
    const adminPassword = process.env.E2E_ADMIN_PASSWORD!;
    
    // Call API as admin (server to server basically, via request context)
    // Wait, the API requires the user to be signed in as admin. We need to create a new context or sign in as admin.
    await page.goto("/login/customer");
    await page.getByLabel("อีเมล").fill(adminEmail);
    await page.locator("#auth-password").fill(adminPassword);
    await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 });

    const processRes = await page.request.post(`/api/admin/account-deletion/${requestRow.id}/process`);
    expect(processRes.ok()).toBeTruthy();

    // 5. Verify deletion
    const { data: checkAuth } = await admin.auth.admin.getUserById(userId);
    expect(checkAuth.user).toBeNull();
    
    const { data: checkProfile } = await admin.from("profiles").select("id").eq("id", userId).maybeSingle();
    expect(checkProfile).toBeNull();
    
    // Verify request is completed and user_id is null
    const { data: finalReq } = await admin.from("account_deletion_requests").select("status, user_id").eq("id", requestRow.id).single();
    expect(finalReq.status).toBe("completed");
    expect(finalReq.user_id).toBeNull();
  });
});
