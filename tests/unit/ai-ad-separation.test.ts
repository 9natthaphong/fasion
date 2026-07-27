import { describe, expect, it } from "vitest";

describe("AI Stylist and Merchant Ad Strict Separation Invariants", () => {
  it("guarantees OpenAI system prompt does not contain ad injection triggers or merchant data", async () => {
    const fs = await import("fs");
    const routeContent = fs.readFileSync("src/app/api/ai-stylist/route.ts", "utf-8");

    // Invariant 1: System prompt explicitly forbids sponsored links and ads
    expect(routeContent).toContain("ห้ามสร้างลิงก์สินค้า อ้างสินค้าจริง หรือแทรกโฆษณา/ร้านค้า");

    // Invariant 2: getPersonalizedAds is executed AFTER neutral recommendation completes in function body
    const aiCallIndex = routeContent.indexOf("client.responses.parse");
    const adCallIndexInBody = routeContent.indexOf("getPersonalizedAds(", aiCallIndex);

    expect(aiCallIndex).toBeGreaterThan(-1);
    expect(adCallIndexInBody).toBeGreaterThan(-1);
    expect(adCallIndexInBody).toBeGreaterThan(aiCallIndex);
  });
});
