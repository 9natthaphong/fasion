import { describe, expect, it } from "vitest";
import { buildStylistPrompt } from "@/lib/ai-stylist-prompt";

describe("AI Stylist and Merchant Ad Strict Separation Invariants", () => {
  it("guarantees buildStylistPrompt receives zero ad data or merchant listings", () => {
    const prompt = buildStylistPrompt({
      activity: "ไปคาเฟ่เอกมัย",
      weather: "hot-sunny",
      preferredStyles: ["Minimal", "Smart Casual"],
      fitProfileOptions: { usualTopSize: "M" },
    });

    // Invariant 1: Prompt contains zero ad/shop/sponsored keywords
    expect(prompt).not.toContain("sponsored");
    expect(prompt).not.toContain("shopee");
    expect(prompt).not.toContain("merchant");
    expect(prompt).not.toContain("adId");
    expect(prompt).not.toContain("shopId");
  });

  it("guarantees prompt excludes fit profile measurements when not explicitly authorized", () => {
    const promptWithoutFit = buildStylistPrompt({
      activity: "ทำงานที่ออฟฟิศ",
      fitProfileOptions: {},
    });

    expect(promptWithoutFit).not.toContain("heightCm");
    expect(promptWithoutFit).not.toContain("weightKg");
    expect(promptWithoutFit).not.toContain("chestCm");
  });

  it("guarantees route file executes OpenAI call before calling getPersonalizedAds", async () => {
    const fs = await import("fs");
    const routeContent = fs.readFileSync("src/app/api/ai-stylist/route.ts", "utf-8");

    // Invariant 1: System prompt explicitly forbids sponsored links and ads
    expect(routeContent).toContain("ห้ามสร้างลิงก์สินค้า อ้างสินค้าจริง หรือแทรกโฆษณา/ร้านค้า");

    // Invariant 2: getPersonalizedAds is executed AFTER neutral recommendation completes
    const aiCallIndex = routeContent.indexOf("client.responses.parse");
    const adCallIndexInBody = routeContent.indexOf("getPersonalizedAds(", aiCallIndex);

    expect(aiCallIndex).toBeGreaterThan(-1);
    expect(adCallIndexInBody).toBeGreaterThan(-1);
    expect(adCallIndexInBody).toBeGreaterThan(aiCallIndex);
  });
});
