import { expect, test } from "@playwright/test";

test("public discovery journey has no overflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /วันนี้จะไปไหน/ })).toBeVisible();
  await page.getByRole("link", { name: "สำรวจแฟชั่นจากร้านค้า" }).click();
  await expect(page).toHaveURL(/\/discover/);
  await expect(page.getByRole("heading", { name: "ค้นหาสไตล์จากร้านค้า" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});

test("opens a demo shop and ad without broken images", async ({ page }) => {
  await page.goto("/shops/quiet-form");
  await expect(page.getByRole("heading", { name: "Quiet Form" })).toBeVisible();
  await page.goto("/ads/linen-utility-shirt");
  await expect(page.getByRole("heading", { name: "เสื้อลินิน Utility" })).toBeVisible();
  await expect(page.locator("img").first()).toHaveJSProperty("complete", true);
});

test("AI form reflects the server configuration honestly", async ({ page }) => {
  await page.goto("/ai-stylist");
  const submit = page.getByRole("button", { name: /สร้างคำแนะนำ 3 ชุด/ });
  if (process.env.OPENAI_API_KEY) {
    await expect(page.getByText("Development configuration missing")).toHaveCount(0);
    await expect(submit).toBeEnabled();
  } else {
    await expect(page.getByText("Development configuration missing")).toBeVisible();
    await expect(submit).toBeDisabled();
  }
});

test("customer and merchant authentication entry points are separate", async ({ page }) => {
  await page.goto("/login/customer");
  await expect(page.getByText("Customer account", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "เข้าสู่ระบบ", exact: true })).toBeVisible();
  await page.goto("/login/merchant");
  await expect(page.getByText("Merchant account", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "เข้าสู่ระบบ", exact: true })).toBeVisible();
});

test("admin route redirects an anonymous visitor", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login\/customer/);
});

const publicRoutes = [
  "/",
  "/ai-stylist",
  "/discover",
  "/categories/minimal",
  "/shops/quiet-form",
  "/ads/linen-utility-shirt",
  "/login/customer",
  "/login/merchant",
  "/register/customer",
  "/register/merchant",
  "/privacy",
  "/terms",
];

test("required public routes render without console, CSP, or image errors", async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(message.text());
  });
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  for (const route of publicRoutes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBeLessThan(400);
    await page.locator("main").waitFor();
    const state = await page.evaluate(() => ({
      overflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
      brokenImages: Array.from(document.images).filter(
        (image) => image.complete && image.naturalWidth === 0,
      ).length,
    }));
    expect(state.overflow, `${route} has horizontal overflow`).toBe(false);
    expect(state.brokenImages, `${route} has broken images`).toBe(0);
  }
  expect(runtimeErrors).toEqual([]);
});

test("homepage mobile menu is keyboard reachable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const menu = page.locator("summary[aria-label='เปิดเมนู']");
  await menu.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("navigation", { name: "เมนูมือถือ" })).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "เมนูมือถือ" })
      .getByRole("link", { name: "เลือกชุดกับ AI", exact: true }),
  ).toBeVisible();
});

test("one live AI request returns the required three directions", async ({ request }, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium" ||
      !process.env.OPENAI_API_KEY ||
      process.env.RUN_LIVE_AI_E2E !== "1",
  );
  const response = await request.post("/api/ai-stylist", {
    data: {
      heightCm: null,
      weightKg: null,
      clothingPresentation: "unisex",
      activity: "ไปทำงานและทานข้าวกับเพื่อน",
      formality: "smart_casual",
      weather: "กรุงเทพ อากาศร้อนและอาจมีฝน",
      timeOfDay: "all_day",
      preferredStyles: ["minimal", "contemporary"],
      preferredColors: ["กรมท่า", "ครีม"],
      avoidedColors: [],
      preferredFit: "relaxed",
      budget: 2500,
      anchorItem: "กางเกงขายาวสีกรมท่า",
      notes: "ขอชุดสุภาพและเดินทางสะดวก",
      saveForNextTime: false,
    },
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.outfits).toHaveLength(3);
  expect(body.outfits.map((outfit: { direction: string }) => outfit.direction)).toEqual([
    "safe",
    "elevated",
    "comfortable",
  ]);
});
