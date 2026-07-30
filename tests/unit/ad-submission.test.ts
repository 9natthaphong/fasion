import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { normalizeShopeeUrl } from "@/lib/shopee";
import { adSchema, adminAdActionSchema } from "@/lib/validation";

describe("Task 2 Invariant: Merchant Ad Creation & Submission Zero OpenAI Calls", () => {
  it("proves merchant ad routes never import OpenAI", () => {
    const merchantAdRoute = fs.readFileSync(
      path.join(process.cwd(), "src/app/api/merchant/ads/route.ts"),
      "utf-8",
    );
    const merchantAdIdRoute = fs.readFileSync(
      path.join(process.cwd(), "src/app/api/merchant/ads/[id]/route.ts"),
      "utf-8",
    );
    const adminAdRoute = fs.readFileSync(
      path.join(process.cwd(), "src/app/api/admin/ads/[id]/route.ts"),
      "utf-8",
    );

    expect(merchantAdRoute.toLowerCase()).not.toContain("openai");
    expect(merchantAdIdRoute.toLowerCase()).not.toContain("openai");
    expect(adminAdRoute.toLowerCase()).not.toContain("openai");
  });
});

describe("Merchant Ad Submission & Status Invariants", () => {
  it("validates Shopee destination URL and rejects invalid hosts or non-HTTPS URLs", () => {
    expect(() => normalizeShopeeUrl("https://shopee.co.th/product-i.1234.5678")).not.toThrow();
    expect(() => normalizeShopeeUrl("http://shopee.co.th/product")).toThrow();
    expect(() => normalizeShopeeUrl("https://evil.com/fake-shopee")).toThrow();
    expect(() => normalizeShopeeUrl("javascript:alert(1)")).toThrow();
  });

  it("prevents merchant from setting active status directly via client schema", () => {
    const shopId = "00000000-0000-4000-8000-000000000101";
    const payload = {
      shopId,
      title: "ชุดเดรสผ้าฝ้ายมินิมอล",
      description: "เดรสผ้าฝ้ายระบายอากาศดี เหมาะกับวันสบายๆ",
      adType: "single_product",
      priceText: "฿590",
      destinationUrl: "https://shopee.co.th/sample-dress",
      coverImagePath: `${shopId}/00000000-0000-4000-8000-000000000099.jpg`,
      categoryIds: ["00000000-0000-4000-8000-000000000201"],
      images: [],
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 86400000).toISOString(),
      intent: "submit",
      status: "active", // attempted privilege escalation
    };

    const parsed = adSchema.parse(payload);
    // adSchema ignores client-supplied status and status defaults to draft -> pending_review
    expect((parsed as Record<string, unknown>).status).toBeUndefined();
  });

  it("validates admin moderation action schema", () => {
    expect(adminAdActionSchema.safeParse({ action: "approve" }).success).toBe(true);
    expect(adminAdActionSchema.safeParse({ action: "reject" }).success).toBe(true);
    expect(adminAdActionSchema.safeParse({ action: "pause" }).success).toBe(true);
    expect(adminAdActionSchema.safeParse({ action: "invalid_action" }).success).toBe(false);
  });
});
