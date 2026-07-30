import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { adSchema, adminAdActionSchema } from "@/lib/validation";
import { calculateCtr, formatCtr } from "@/lib/domain";

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
  const shopId = "00000000-0000-4000-8000-000000000101";

  it("allows merchant to save a draft with no destination URL (null/empty)", () => {
    const payload = {
      shopId,
      title: "เสื้อเชิ้ตคอตตอนลินินทรงหลวม",
      description: "ไม่มีลิงก์ปลายทาง",
      adType: "single_product",
      priceText: "890 บาท",
      destinationUrl: "",
      coverImagePath: `${shopId}/00000000-0000-4000-8000-000000000099.jpg`,
      categoryIds: ["00000000-0000-4000-8000-000000000201"],
      images: [],
      startsAt: null,
      endsAt: null,
      intent: "draft",
    };

    const parsed = adSchema.parse(payload);
    expect(parsed.destinationUrl).toBeNull();
  });

  it("allows merchant to submit an eligible ad with no destination URL", () => {
    const payload = {
      shopId,
      title: "ชุดเซ็ต Minimal",
      description: "ส่งตรวจโดยไม่ใส่ลิงก์",
      adType: "outfit_set",
      priceText: "1,290 บาท",
      destinationUrl: "   ",
      coverImagePath: `${shopId}/00000000-0000-4000-8000-000000000099.jpg`,
      categoryIds: ["00000000-0000-4000-8000-000000000201"],
      images: [],
      startsAt: null,
      endsAt: null,
      intent: "submit",
    };

    const parsed = adSchema.parse(payload);
    expect(parsed.destinationUrl).toBeNull();
    expect(parsed.intent).toBe("submit");
  });

  it("prevents merchant from setting active status directly via client schema", () => {
    const payload = {
      shopId,
      title: "ชุดเดรสผ้าฝ้ายมินิมอล",
      description: "เดรสผ้าฝ้ายระบายอากาศดี เหมาะกับวันสบายๆ",
      adType: "single_product",
      priceText: "฿590",
      destinationUrl: "https://example.com/sample-dress",
      coverImagePath: `${shopId}/00000000-0000-4000-8000-000000000099.jpg`,
      categoryIds: ["00000000-0000-4000-8000-000000000201"],
      images: [],
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 86400000).toISOString(),
      intent: "submit",
      status: "active",
    };

    const parsed = adSchema.parse(payload);
    expect((parsed as Record<string, unknown>).status).toBeUndefined();
  });

  it("validates admin moderation action schema and allows approving ads without destination", () => {
    expect(adminAdActionSchema.safeParse({ action: "approve" }).success).toBe(true);
    expect(adminAdActionSchema.safeParse({ action: "reject" }).success).toBe(true);
    expect(adminAdActionSchema.safeParse({ action: "pause" }).success).toBe(true);
  });

  it("calculates CTR safely when impressions are zero", () => {
    expect(calculateCtr(0, 0)).toBe(0);
    expect(calculateCtr(5, 0)).toBe(0);
    expect(formatCtr(0, 0)).toBe("0%");
  });
});
