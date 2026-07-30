import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const hasAdminFixture = Boolean(
  process.env.RUN_ADMIN_IMAGE_E2E === "1" &&
    process.env.E2E_ADMIN_EMAIL &&
    process.env.E2E_ADMIN_PASSWORD &&
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

async function imageBytesLoaded(image: import("@playwright/test").Locator) {
  await expect
    .poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
}

test.describe("Admin private advertisement images", () => {
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== "chromium" || !hasAdminFixture,
      "Requires RUN_ADMIN_IMAGE_E2E=1 and the reusable admin fixture.",
    );
  });

  test("loads real pending-review cover and gallery bytes on desktop and mobile", async ({
    page,
  }) => {
    const admin = adminClient();
    const { data: ad, error } = await admin
      .from("ads")
      .select("id, title, cover_image_path, ad_images(storage_path)")
      .eq("status", "pending_review")
      .not("cover_image_path", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    expect(error).toBeNull();
    expect(ad?.id, "a pending-review ad with a real cover is required").toBeTruthy();

    const imageResponses: { url: string; status: number }[] = [];
    const consoleErrors: string[] = [];
    page.on("response", (response) => {
      if (
        response.url().includes("/api/assets") ||
        response.url().includes("/_next/image")
      ) {
        imageResponses.push({ url: response.url(), status: response.status() });
      }
    });
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    await page.goto("/login/customer");
    await page.locator("#auth-email").fill(process.env.E2E_ADMIN_EMAIL!);
    await page.locator("#auth-password").fill(process.env.E2E_ADMIN_PASSWORD!);
    await page.locator("button[type=submit]").click();
    await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
      timeout: 15_000,
    });

    await page.goto("/admin/ads");
    const listRow = page.locator("article").filter({ hasText: ad!.title });
    await expect(listRow).toBeVisible();
    const listImage = listRow.locator("img").first();
    await imageBytesLoaded(listImage);
    expect(await listImage.getAttribute("src")).toContain("/api/assets?");

    await page.goto(`/admin/ads/${ad!.id}`);
    const detailImages = page.locator('img[src*="/api/assets?"][alt]');
    await expect(detailImages).not.toHaveCount(0);
    for (const image of await detailImages.all()) await imageBytesLoaded(image);

    const previewButton = page.getByRole("button", { name: /ขยายดูภาพ/ }).first();
    if (await previewButton.isVisible()) {
      await previewButton.click();
      const previewImage = page.getByRole("dialog").locator('img[src*="/api/assets?"]');
      await imageBytesLoaded(previewImage);
      await page.keyboard.press("Escape");
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    const mobileImages = page.locator('img[src*="/api/assets?"][alt]');
    for (const image of await mobileImages.all()) await imageBytesLoaded(image);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true);

    const protectedAssetResponses = imageResponses.filter((response) =>
      response.url.includes("/api/assets"),
    );
    expect(protectedAssetResponses.length).toBeGreaterThan(0);
    expect(
      imageResponses.some(
        (response) =>
          response.url.includes("/_next/image") &&
          decodeURIComponent(response.url).includes("/api/assets?"),
      ),
    ).toBe(false);
    expect(
      protectedAssetResponses.every((response) => [200, 307].includes(response.status)),
    ).toBe(true);
    expect(consoleErrors).toEqual([]);
  });
});
