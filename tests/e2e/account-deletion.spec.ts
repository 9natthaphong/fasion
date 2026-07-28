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
    if (!process.env.E2E_ADMIN_EMAIL) missingVars.push("E2E_ADMIN_EMAIL");
    if (!process.env.E2E_ADMIN_PASSWORD) missingVars.push("E2E_ADMIN_PASSWORD");
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missingVars.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!process.env.SUPABASE_SECRET_KEY) missingVars.push("SUPABASE_SECRET_KEY");
    
    if (testInfo.project.name !== "chromium" || missingVars.length > 0) {
      test.skip(true, `Skipping - required variables missing: ${missingVars.join(", ")} or not chromium`);
    }
  });

  test("destructive account deletion workflow", async ({ browser }) => {
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

    // Use try/finally to clean up the disposable user
    try {
      // 2. Add fixtures
      const reqId = crypto.randomUUID();
      const resId = crypto.randomUUID();
      const resItemId = crypto.randomUUID();
      const wardrobeId = crypto.randomUUID();
      const outfitId = crypto.randomUUID();
      
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

      const { error: wErr } = await admin.from("wardrobe_items").insert({
        id: wardrobeId, user_id: userId, item_type: "top", name: "test", image_path: "test.jpg"
      });
      expect(wErr).toBeNull();
      
      const { error: soErr } = await admin.from("saved_outfits").insert({
        id: outfitId, user_id: userId, name: "Test Outfit", notes: "test", direction: "safe"
      });
      expect(soErr).toBeNull();

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

      let impId: string | undefined;
      let clickId: string | undefined;
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

      let viewId: string | undefined;
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

      // 4. Admin processing (Context 2)
      const adminContext = await browser.newContext();
      const adminPage = await adminContext.newPage();
      
      const { data: requestRow, error: checkReqErr } = await admin.from("account_deletion_requests").select("id").eq("user_id", userId).single();
      expect(checkReqErr).toBeNull();
      expect(requestRow).toBeTruthy();

      const adminEmail = process.env.E2E_ADMIN_EMAIL!;
      const adminPassword = process.env.E2E_ADMIN_PASSWORD!;
      
      await adminPage.goto("/login/customer");
      await adminPage.getByLabel("อีเมล").fill(adminEmail);
      await adminPage.locator("#auth-password").fill(adminPassword);
      await adminPage.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
      await adminPage.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 });

      const processRes = await adminPage.request.post(`/api/admin/account-deletion/${requestRow!.id}/process`);
      expect(processRes.ok()).toBeTruthy();
      await adminContext.close();

      // 5. Verify deletion
      const { data: checkAuth } = await admin.auth.admin.getUserById(userId);
      expect(checkAuth.user).toBeNull();
      
      const { data: checkProfile } = await admin.from("profiles").select("id").eq("id", userId).maybeSingle();
      expect(checkProfile).toBeNull();

      const { data: checkPref } = await admin.from("customer_preferences").select("user_id").eq("user_id", userId);
      expect(checkPref?.length).toBe(0);

      const { data: checkFit } = await admin.from("customer_fit_profiles").select("user_id").eq("user_id", userId);
      expect(checkFit?.length).toBe(0);

      const { data: checkW } = await admin.from("wardrobe_items").select("id").eq("user_id", userId);
      expect(checkW?.length).toBe(0);
      
      const { data: checkSO } = await admin.from("saved_outfits").select("id").eq("user_id", userId);
      expect(checkSO?.length).toBe(0);

      const { data: checkOR } = await admin.from("outfit_requests").select("id").eq("user_id", userId);
      expect(checkOR?.length).toBe(0);
      
      const { data: checkORes } = await admin.from("outfit_results").select("id").eq("request_id", reqId);
      expect(checkORes?.length).toBe(0);
      
      const { data: checkOResItems } = await admin.from("outfit_result_items").select("id").eq("outfit_result_id", resId);
      expect(checkOResItems?.length).toBe(0);

      if (adId) {
        const { data: checkLike } = await admin.from("ad_likes").select("user_id").eq("user_id", userId);
        expect(checkLike?.length).toBe(0);
        
        const { data: checkImp } = await admin.from("ad_impressions").select("user_id").eq("id", impId).single();
        expect(checkImp?.user_id).toBeNull();
        
        const { data: checkClick } = await admin.from("ad_clicks").select("user_id").eq("id", clickId).single();
        expect(checkClick?.user_id).toBeNull();
      }

      if (shopId) {
        const { data: checkView } = await admin.from("shop_views").select("user_id").eq("id", viewId).single();
        expect(checkView?.user_id).toBeNull();
      }
      
      // Verify request is completed and user_id is null
      const { data: finalReq, error: finalErr } = await admin.from("account_deletion_requests").select("status, user_id, processed_by, attempt_count").eq("id", requestRow!.id).single();
      expect(finalErr).toBeNull();
      expect(finalReq!.status).toBe("completed");
      expect(finalReq!.user_id).toBeNull();
      expect(finalReq!.processed_by).toBeTruthy();
      expect(finalReq!.attempt_count).toBeGreaterThanOrEqual(1);

    } finally {
      // Ensure auth user is deleted in case of failure
      await admin.auth.admin.deleteUser(userId);
      // Clean up orphaned records if they failed to be deleted (cascade might not be enough if they were set to set null)
      // We don't have to clean up much manually since deleteUser cascades to profiles, and profiles cascades to many things.
    }
  });
});
