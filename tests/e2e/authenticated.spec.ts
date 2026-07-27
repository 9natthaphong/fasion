import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

const hasLiveSupabase = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SECRET_KEY,
);

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

function temporaryIdentity(role: "customer" | "merchant") {
  const suffix = randomUUID();
  return {
    email: `fittoday-e2e-${role}-${suffix}@example.com`,
    password: `Ft!${suffix}a9`,
    displayName: `FitToday E2E ${role}`,
  };
}

test("registration creates only the requested customer or merchant role", async ({ request }, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium" ||
      !hasLiveSupabase ||
      process.env.RUN_REGISTRATION_E2E !== "1",
  );
  const admin = adminClient();
  const createdUserIds: string[] = [];
  const origin = new URL(
    process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000",
  ).origin;

  try {
    for (const role of ["customer", "merchant"] as const) {
      const identity = temporaryIdentity(role);
      const response = await request.post("/api/auth/register", {
        headers: { Origin: origin },
        data: {
          email: identity.email,
          password: identity.password,
          displayName: identity.displayName,
          role,
          acceptTerms: true,
        },
      });
      expect(response.status()).toBe(200);

      const user = await expect
        .poll(async () => {
          const users = await admin.auth.admin.listUsers({
            page: 1,
            perPage: 1000,
          });
          return users.data.users.find(
            (candidate) => candidate.email === identity.email,
          );
        })
        .toBeTruthy();
      void user;

      const users = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      const createdUser = users.data.users.find(
        (candidate) => candidate.email === identity.email,
      );
      expect(createdUser).toBeTruthy();
      createdUserIds.push(createdUser!.id);
      const profile = await admin
        .from("profiles")
        .select("role")
        .eq("id", createdUser!.id)
        .single();
      expect(profile.data?.role).toBe(role);
    }
  } finally {
    for (const userId of createdUserIds) {
      await admin.auth.admin.deleteUser(userId);
    }
  }
});

test("customer can update private preferences, like safely, and request deletion", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium" || !hasLiveSupabase);
  const admin = adminClient();
  const identity = temporaryIdentity("customer");
  let userId = "";
  let adId = "";
  let storagePath = "";

  try {
    const created = await admin.auth.admin.createUser({
      email: identity.email,
      password: identity.password,
      email_confirm: true,
      user_metadata: {
        requested_role: "customer",
        display_name: identity.displayName,
      },
    });
    expect(created.error).toBeNull();
    userId = created.data.user!.id;

    const { data: shop } = await admin
      .from("shops")
      .select("id")
      .eq("slug", "quiet-form")
      .single();
    expect(shop?.id).toBeTruthy();
    storagePath = `${shop!.id}/${randomUUID()}.webp`;
    const upload = await admin.storage
      .from("ad-assets")
      .upload(
        storagePath,
        readFileSync("public/images/fittoday/direction-safe-editorial-v1.webp"),
        { contentType: "image/webp", upsert: false },
      );
    expect(upload.error).toBeNull();

    const slug = `e2e-customer-${randomUUID()}`;
    const inserted = await admin
      .from("ads")
      .insert({
        shop_id: shop!.id,
        title: "ชุดทดสอบ Customer E2E",
        slug,
        description: "โฆษณาชั่วคราวสำหรับทดสอบ like และ redirect",
        ad_type: "single_product",
        price_text: "1,290 บาท",
        destination_url: "https://shopee.co.th/test-item",
        cover_image_path: storagePath,
        status: "active",
        is_demo: false,
      })
      .select("id")
      .single();
    expect(inserted.error).toBeNull();
    adId = inserted.data!.id;

    await page.goto("/login/customer");
    await page.getByLabel("อีเมล").fill(identity.email);
    await page.locator("#auth-password").fill(identity.password);
    await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
    await expect(page).toHaveURL(/\/account$/);

    await page.goto("/account/profile");
    await page.getByLabel("ชื่อที่แสดง").fill("Customer E2E Updated");
    const saveBody = page.getByRole("checkbox", {
      name: /บันทึกส่วนสูงและน้ำหนัก/,
    });
    await saveBody.check();
    await page.getByLabel("ส่วนสูง (ซม.)").fill("168");
    await page.getByLabel("น้ำหนัก (กก.)").fill("60");
    await page.getByRole("button", { name: "บันทึกโปรไฟล์" }).click();
    await expect(page.getByText("บันทึกโปรไฟล์แล้ว")).toBeVisible();

    let preference = await admin
      .from("customer_preferences")
      .select("height_cm, weight_kg, save_body_information")
      .eq("user_id", userId)
      .single();
    expect(preference.data).toMatchObject({
      height_cm: 168,
      weight_kg: 60,
      save_body_information: true,
    });

    await saveBody.uncheck();
    await page.getByRole("button", { name: "บันทึกโปรไฟล์" }).click();
    await expect(page.getByText("บันทึกโปรไฟล์แล้ว")).toBeVisible();
    preference = await admin
      .from("customer_preferences")
      .select("height_cm, weight_kg, save_body_information")
      .eq("user_id", userId)
      .single();
    expect(preference.data).toMatchObject({
      height_cm: null,
      weight_kg: null,
      save_body_information: false,
    });

    await page.goto(`/ads/${slug}`);
    const like = page.getByRole("button", { name: "ถูกใจ", exact: true });
    await like.click();
    await expect(page.getByRole("button", { name: "ถูกใจแล้ว" })).toBeVisible();
    await page.request.post(`/api/likes/${adId}`);
    let likes = await admin
      .from("ad_likes")
      .select("ad_id", { count: "exact", head: true })
      .eq("ad_id", adId)
      .eq("user_id", userId);
    expect(likes.count).toBe(1);
    await page.getByRole("button", { name: "ถูกใจแล้ว" }).click();
    await expect(page.getByRole("button", { name: "ถูกใจ", exact: true })).toBeVisible();
    await expect.poll(async () => {
      likes = await admin
        .from("ad_likes")
        .select("ad_id", { count: "exact", head: true })
        .eq("ad_id", adId)
        .eq("user_id", userId);
      return likes.count;
    }).toBe(0);

    const redirect = await page.request.get(`/go/ad/${adId}`, {
      maxRedirects: 0,
    });
    expect(redirect.status()).toBe(303);
    const clicks = await admin
      .from("ad_clicks")
      .select("id", { count: "exact", head: true })
      .eq("ad_id", adId)
      .eq("user_id", userId);
    expect(clicks.count).toBe(1);

    await page.goto("/account/settings");
    await page.getByLabel(/พิมพ์ DELETE/).fill("DELETE");
    const [deletionResponse] = await Promise.all([
      page.waitForResponse((response) =>
        response.url().includes("/api/account/delete-request"),
      ),
      page.getByRole("button", { name: "ส่งคำขอลบบัญชี" }).click(),
    ]);
    expect(deletionResponse.status()).toBe(200);
    await expect(page).toHaveURL(/account-deletion=requested/);
    const deletion = await admin
      .from("account_deletion_requests")
      .select("status")
      .eq("user_id", userId)
      .single();
    expect(deletion.data?.status).toBe("pending");
  } finally {
    if (adId) {
      await admin.from("ad_clicks").delete().eq("ad_id", adId);
      await admin.from("ad_impressions").delete().eq("ad_id", adId);
      await admin.from("ad_likes").delete().eq("ad_id", adId);
      await admin.from("ad_images").delete().eq("ad_id", adId);
      await admin.from("ad_categories").delete().eq("ad_id", adId);
      await admin.from("ads").delete().eq("id", adId);
    }
    if (storagePath) {
      await admin.storage.from("ad-assets").remove([storagePath]);
    }
    if (userId) {
      await admin
        .from("account_deletion_requests")
        .delete()
        .eq("user_id", userId);
      await admin.auth.admin.deleteUser(userId);
    }
  }
});

test("merchant can onboard, upload, reorder, edit, submit, and read owned analytics", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium" || !hasLiveSupabase);
  const admin = adminClient();
  const identity = temporaryIdentity("merchant");
  let userId = "";
  let shopId = "";
  let adId = "";
  let uploadedPaths: string[] = [];

  try {
    const created = await admin.auth.admin.createUser({
      email: identity.email,
      password: identity.password,
      email_confirm: true,
      user_metadata: {
        requested_role: "merchant",
        display_name: identity.displayName,
      },
    });
    expect(created.error).toBeNull();
    userId = created.data.user!.id;

    await page.goto("/login/merchant");
    await page.getByLabel("อีเมล").fill(identity.email);
    await page.locator("#auth-password").fill(identity.password);
    await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
    await expect(page).toHaveURL(/\/merchant$/);
    const createShop = page.getByRole("link", { name: "สร้างร้าน" });
    await expect(createShop).toBeVisible();
    await createShop.click();
    await expect(page).toHaveURL(/\/merchant\/onboarding$/);

    const shopSlug = `e2e-shop-${randomUUID()}`;
    await page.getByLabel("ชื่อร้าน").fill("FitToday E2E Shop");
    await page.getByLabel("Slug ร้าน").fill(shopSlug);
    await page.getByLabel("เรื่องราวของร้าน").fill("ร้านชั่วคราวสำหรับ functional verification");
    await page.getByLabel("ลิงก์ Shopee").fill("https://shopee.co.th/e2e-shop");
    await page.getByRole("button", { name: "สร้างโปรไฟล์ร้าน" }).click();
    await expect(page).toHaveURL(/\/merchant$/);

    const shopResult = await admin
      .from("shops")
      .select("id, status, subscription_status")
      .eq("owner_id", userId)
      .single();
    expect(shopResult.data).toMatchObject({
      status: "pending",
      subscription_status: "inactive",
    });
    shopId = shopResult.data!.id;

    await page.goto("/merchant/ads/new");
    await page.locator("input[type=file]").setInputFiles([
      "public/images/fittoday/direction-safe-editorial-v1.webp",
      "public/images/fittoday/direction-comfortable-editorial-v1.webp",
    ]);
    await expect(page.locator(".upload-item")).toHaveCount(2);
    await page.locator(".upload-grid").scrollIntoViewIfNeeded();
    await expect.poll(() =>
      page.locator(".upload-item img").evaluateAll((images) =>
        images.every((image) =>
          (image as HTMLImageElement).complete &&
          (image as HTMLImageElement).naturalWidth > 0,
        ),
      ),
    ).toBe(true);
    await page.getByLabel("ชื่อโฆษณา").fill("FitToday E2E Campaign");
    const adSlug = `e2e-ad-${randomUUID()}`;
    await page.getByLabel("Slug").fill(adSlug);
    await page.getByLabel("รายละเอียด").fill("ดราฟต์ชั่วคราวสำหรับทดสอบ merchant workflow");
    await page.getByLabel("ลิงก์ Shopee").fill("https://shopee.co.th/e2e-item");
    await page.locator("input[name=categoryIds]").first().check();
    await page.getByRole("button", { name: "บันทึกร่าง" }).click();
    await expect(page).toHaveURL(/\/merchant\/ads$/);

    const adResult = await admin
      .from("ads")
      .select("id, status")
      .eq("shop_id", shopId)
      .eq("slug", adSlug)
      .single();
    expect(adResult.data?.status).toBe("draft");
    adId = adResult.data!.id;
    const initialImages = await admin
      .from("ad_images")
      .select("storage_path")
      .eq("ad_id", adId)
      .order("sort_order");
    uploadedPaths = (initialImages.data ?? []).map((image) => image.storage_path);
    expect(uploadedPaths).toHaveLength(2);

    await page.goto(`/merchant/ads/${adId}/edit`);
    await page.getByLabel("Alt text รูป 1").fill("ลุคเรียบง่ายสำหรับวันทำงาน");
    await page.getByLabel("Alt text รูป 2").fill("ลุคสบายสำหรับเดินทาง");
    await page.getByRole("button", { name: "เลื่อนรูป 2 ไปซ้าย" }).click();
    await page.getByRole("button", { name: "บันทึกร่าง" }).click();
    await expect(page).toHaveURL(/\/merchant\/ads$/);

    const reordered = await admin
      .from("ad_images")
      .select("storage_path, alt_text, sort_order")
      .eq("ad_id", adId)
      .order("sort_order");
    expect(reordered.data?.map((image) => image.storage_path)).toEqual([
      uploadedPaths[1],
      uploadedPaths[0],
    ]);
    expect(reordered.data?.map((image) => image.alt_text)).toEqual([
      "ลุคสบายสำหรับเดินทาง",
      "ลุคเรียบง่ายสำหรับวันทำงาน",
    ]);

    const approval = await admin
      .from("shops")
      .update({
        status: "approved",
        subscription_status: "active",
        subscription_ends_at: new Date(Date.now() + 86_400_000).toISOString(),
      })
      .eq("id", shopId);
    expect(approval.error).toBeNull();

    await page.goto(`/merchant/ads/${adId}/edit`);
    const submit = page.getByRole("button", { name: "ส่งตรวจ" });
    await expect(submit).toBeEnabled();
    await submit.click();
    await expect(page).toHaveURL(/\/merchant\/ads$/);
    const submitted = await admin
      .from("ads")
      .select("status")
      .eq("id", adId)
      .single();
    expect(submitted.data?.status).toBe("pending_review");

    await page.goto("/merchant/analytics");
    await expect(page.getByRole("heading", { name: "สถิติร้าน" })).toBeVisible();
    await expect(page.getByText("CTR", { exact: true })).toBeVisible();
  } finally {
    if (adId) {
      await admin.from("ad_clicks").delete().eq("ad_id", adId);
      await admin.from("ad_impressions").delete().eq("ad_id", adId);
      await admin.from("ad_likes").delete().eq("ad_id", adId);
      await admin.from("ad_images").delete().eq("ad_id", adId);
      await admin.from("ad_categories").delete().eq("ad_id", adId);
      await admin.from("ads").delete().eq("id", adId);
    }
    if (uploadedPaths.length) {
      await admin.storage.from("ad-assets").remove(uploadedPaths);
    }
    if (shopId) {
      const remainingUploads = await admin.storage.from("ad-assets").list(shopId, {
        limit: 100,
      });
      const remainingPaths = (remainingUploads.data ?? [])
        .filter((object) => object.name)
        .map((object) => `${shopId}/${object.name}`);
      if (remainingPaths.length) {
        await admin.storage.from("ad-assets").remove(remainingPaths);
      }
      await admin.from("shop_members").delete().eq("shop_id", shopId);
      await admin.from("shops").delete().eq("id", shopId);
    }
    if (userId) {
      await admin.auth.admin.deleteUser(userId);
    }
  }
});
