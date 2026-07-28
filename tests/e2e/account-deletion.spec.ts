import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

test.describe("Account Deletion", () => {
  test.beforeEach(({}, testInfo) => {
    const missingVars = [];
    if (process.env.RUN_DESTRUCTIVE_E2E !== "1") missingVars.push("RUN_DESTRUCTIVE_E2E=1");
    if (!process.env.E2E_ADMIN_EMAIL) missingVars.push("E2E_ADMIN_EMAIL");
    if (!process.env.E2E_ADMIN_PASSWORD) missingVars.push("E2E_ADMIN_PASSWORD");
    if (!process.env.E2E_CUSTOMER_EMAIL) missingVars.push("E2E_CUSTOMER_EMAIL");
    if (!process.env.E2E_CUSTOMER_PASSWORD) missingVars.push("E2E_CUSTOMER_PASSWORD");
    if (!process.env.E2E_MERCHANT_EMAIL) missingVars.push("E2E_MERCHANT_EMAIL");
    if (!process.env.E2E_MERCHANT_PASSWORD) missingVars.push("E2E_MERCHANT_PASSWORD");
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missingVars.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!process.env.SUPABASE_SECRET_KEY) missingVars.push("SUPABASE_SECRET_KEY");
    
    if (testInfo.project.name !== "chromium" || missingVars.length > 0) {
      test.skip(true, `Skipping - required variables missing: ${missingVars.join(", ")} or not chromium`);
    }
  });

  test("destructive account deletion workflow with retry safety", async ({ browser }) => {
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

    let reqId = crypto.randomUUID();
    const resId = crypto.randomUUID();
    const resItemId = crypto.randomUUID();
    const wardrobeId = crypto.randomUUID();
    const outfitId = crypto.randomUUID();
    const savedOutfitItemId = crypto.randomUUID();
    
    let impId: string | undefined;
    let clickId: string | undefined;
    let viewId: string | undefined;

    try {
      // 2. Add fixtures
      const { error: profErr } = await admin.from("profiles").update({ 
        display_name: "Test", role: "customer" 
      }).eq("id", userId);
      expect(profErr).toBeNull();
      
      const { error: prefErr } = await admin.from("customer_preferences").insert({
        user_id: userId, preferred_styles: ["Minimal"]
      });
      expect(prefErr).toBeNull();
      
      const { error: fitErr } = await admin.from("customer_fit_profiles").insert({
        user_id: userId, self_described_body_shape: "hourglass"
      });
      expect(fitErr).toBeNull();

      // Real storage files
      const tinyPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
      const wardrobePath = `${userId}/${wardrobeId}/wardrobe-test.png`;
      const { error: up1Err } = await admin.storage.from("wardrobe-assets").upload(wardrobePath, tinyPng, { contentType: 'image/png' });
      expect(up1Err).toBeNull();
      
      const avatarPath = `${userId}/nested/avatar-test.png`;
      const { error: up2Err } = await admin.storage.from("avatars").upload(avatarPath, tinyPng, { contentType: 'image/png' });
      expect(up2Err).toBeNull();

      const { error: wErr } = await admin.from("wardrobe_items").insert({
        id: wardrobeId, user_id: userId, item_type: "top", name: "test", image_path: wardrobePath
      });
      expect(wErr).toBeNull();
      
      const { error: soErr } = await admin.from("saved_outfits").insert({
        id: outfitId, user_id: userId, name: "Test Outfit", notes: "test", direction: "safe"
      });
      expect(soErr).toBeNull();

      const { error: soiErr } = await admin.from("saved_outfit_items").insert({
        id: savedOutfitItemId, saved_outfit_id: outfitId, wardrobe_item_id: wardrobeId, item_role: "top", sort_order: 0
      });
      expect(soiErr).toBeNull();

      const { error: orErr } = await admin.from("outfit_requests").insert({
        id: reqId, user_id: userId, input_data: { test: true }
      });
      expect(orErr).toBeNull();

      const { error: oresErr } = await admin.from("outfit_results").insert({
        id: resId, request_id: reqId, model_name: "test-model", result_data: { test: true }
      });
      expect(oresErr).toBeNull();

      const { error: oriErr } = await admin.from("outfit_result_items").insert({
        id: resItemId, outfit_result_id: resId, item_role: "top", styling_instruction: "test", outfit_index: 0
      });
      expect(oriErr).toBeNull();

      const { data: ads } = await admin.from("ads").select("id").limit(1);
      const adId = ads?.[0]?.id;
      if (adId) {
        const { error: likeErr } = await admin.from("ad_likes").insert({ user_id: userId, ad_id: adId });
        expect(likeErr).toBeNull();
        
        const sessionId = crypto.randomUUID();
        const { data: impData, error: impErr } = await admin.from("ad_impressions").insert({ user_id: userId, ad_id: adId, page_context: "feed", anonymous_session_id: sessionId }).select("id").single();
        expect(impErr).toBeNull();
        impId = impData?.id;
        
        const { data: clickData, error: clickErr } = await admin.from("ad_clicks").insert({ user_id: userId, ad_id: adId, destination_host: "test.com", anonymous_session_id: sessionId }).select("id").single();
        expect(clickErr).toBeNull();
        clickId = clickData?.id;
      }

      const { data: shops } = await admin.from("shops").select("id").limit(1);
      const shopId = shops?.[0]?.id;
      if (shopId) {
        const sessionId = crypto.randomUUID();
        const { data: viewData, error: viewErr } = await admin.from("shop_views").insert({ user_id: userId, shop_id: shopId, anonymous_session_id: sessionId }).select("id").single();
        expect(viewErr).toBeNull();
        viewId = viewData?.id;
      }

      // 3. Customer login (Context 1)
      const customerContext = await browser.newContext();
      const customerPage = await customerContext.newPage();
      
      await customerPage.goto("/login/customer");
      await customerPage.getByLabel("อีเมล").fill(email);
      await customerPage.locator("#auth-password").fill(password);
      await customerPage.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
      await customerPage.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 });

      // Request deletion
      const res = await customerPage.request.post('/api/account/delete-request', {
        data: { confirmation: 'DELETE' }
      });
      expect(res.ok()).toBeTruthy();
      await customerContext.close();

      // Retrieve the real request ID
      const { data: requestRow, error: checkReqErr } = await admin.from("account_deletion_requests").select("id").eq("target_user_id", userId).single();
      expect(checkReqErr).toBeNull();
      expect(requestRow).toBeTruthy();
      reqId = requestRow!.id;

      // 4. Setup retry scenario: Delete Auth user and set status to failed
      await admin.auth.admin.deleteUser(userId);
      const { error: setFailedErr } = await admin.from("account_deletion_requests").update({ status: 'failed' }).eq("id", reqId);
      expect(setFailedErr).toBeNull();

      // 5. Admin processing (Context 2)
      const adminContext = await browser.newContext();
      const adminPage = await adminContext.newPage();
      
      const adminEmail = process.env.E2E_ADMIN_EMAIL!;
      const adminPassword = process.env.E2E_ADMIN_PASSWORD!;
      
      await adminPage.goto("/login/customer");
      await adminPage.getByLabel("อีเมล").fill(adminEmail);
      await adminPage.locator("#auth-password").fill(adminPassword);
      await adminPage.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
      await adminPage.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 });

      const processRes = await adminPage.request.post(`/api/admin/account-deletion/${reqId}/process`);
      expect(processRes.ok()).toBeTruthy();
      await adminContext.close();

      // 6. Verify deletion
      const { data: checkAuth } = await admin.auth.admin.getUserById(userId);
      expect(checkAuth.user).toBeNull();
      
      const { data: checkProfile } = await admin.from("profiles").select("id").eq("id", userId).maybeSingle();
      expect(checkProfile).toBeNull();

      const { data: checkW } = await admin.from("wardrobe_items").select("id").eq("user_id", userId);
      expect(checkW?.length).toBe(0);
      
      const { data: checkSO } = await admin.from("saved_outfits").select("id").eq("user_id", userId);
      expect(checkSO?.length).toBe(0);

      const { data: checkSOI } = await admin.from("saved_outfit_items").select("id").eq("saved_outfit_id", outfitId);
      expect(checkSOI?.length).toBe(0);

      // Verify Storage
      const { data: checkWFiles } = await admin.storage.from("wardrobe-assets").list(userId);
      expect(checkWFiles).toHaveLength(0);

      const { data: checkAFiles } = await admin.storage.from("avatars").list(userId);
      expect(checkAFiles).toHaveLength(0);

      if (adId && impId) {
        const { data: checkImp } = await admin.from("ad_impressions").select("user_id").eq("id", impId).single();
        expect(checkImp?.user_id).toBeNull();
      }

      // Verify request is completed and user_id is null
      const { data: finalReq, error: finalErr } = await admin.from("account_deletion_requests").select("status, user_id, processed_by, attempt_count").eq("id", reqId).single();
      expect(finalErr).toBeNull();
      expect(finalReq!.status).toBe("completed");
      expect(finalReq!.user_id).toBeNull();
      expect(finalReq!.processed_by).toBeTruthy();
      expect(finalReq!.attempt_count).toBeGreaterThanOrEqual(1);

    } finally {
      // Complete manual cleanup of all artifacts
      await admin.auth.admin.deleteUser(userId);
      await admin.from("account_deletion_requests").delete().eq("target_user_id", userId);
      
      if (impId) await admin.from("ad_impressions").delete().eq("id", impId);
      if (clickId) await admin.from("ad_clicks").delete().eq("id", clickId);
      if (viewId) await admin.from("shop_views").delete().eq("id", viewId);

      // Remove storage files manually in case of failure
      await admin.storage.from("wardrobe-assets").remove([`${userId}/${wardrobeId}/wardrobe-test.png`]);
      await admin.storage.from("avatars").remove([`${userId}/nested/avatar-test.png`]);
    }
  });

  test("reusable accounts can still authenticate after destructive tests", async ({ browser }) => {
    const roles = [
      { name: "customer", email: process.env.E2E_CUSTOMER_EMAIL, password: process.env.E2E_CUSTOMER_PASSWORD, path: "/login/customer" },
      { name: "merchant", email: process.env.E2E_MERCHANT_EMAIL, password: process.env.E2E_MERCHANT_PASSWORD, path: "/login/merchant" },
      { name: "admin", email: process.env.E2E_ADMIN_EMAIL, password: process.env.E2E_ADMIN_PASSWORD, path: "/login/customer" }
    ];

    for (const role of roles) {
      if (!role.email || !role.password) continue;

      const context = await browser.newContext();
      const page = await context.newPage();
      
      await page.goto(role.path);
      await page.getByLabel("อีเมล").fill(role.email);
      await page.locator("#auth-password").fill(role.password);
      await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
      await page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 });
      expect(page.url()).not.toContain("/login");
      
      await context.close();
    }
  });
});
