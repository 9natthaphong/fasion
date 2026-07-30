import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import { adSchema, adminAdActionSchema } from "@/lib/validation";
import { calculateCtr, formatCtr } from "@/lib/domain";
import {
  toAdInsertRow,
  toAdUpdateRow,
} from "@/lib/merchant-ad-write";

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

  it("allows merchant to save a draft with no purchase info (null/empty)", () => {
    const payload = {
      shopId,
      title: "เสื้อเชิ้ตคอตตอนลินินทรงหลวม",
      description: "ไม่มีช่องทางสั่งซื้อ",
      adType: "single_product",
      priceText: "890 บาท",
      purchaseInfo: "",
      coverImagePath: `${shopId}/00000000-0000-4000-8000-000000000099.jpg`,
      categoryIds: ["00000000-0000-4000-8000-000000000201"],
      images: [],
      startsAt: null,
      endsAt: null,
      intent: "draft",
    };

    const parsed = adSchema.parse(payload);
    expect(parsed.purchaseInfo).toBeNull();
  });

  it("allows merchant to submit an eligible ad without purchase info", () => {
    const payload = {
      shopId,
      title: "ชุดเซ็ต Minimal",
      description: "ส่งตรวจโดยไม่ใส่ช่องทางสั่งซื้อ",
      adType: "outfit_set",
      priceText: "1,290 บาท",
      purchaseInfo: "   ",
      coverImagePath: `${shopId}/00000000-0000-4000-8000-000000000099.jpg`,
      categoryIds: ["00000000-0000-4000-8000-000000000201"],
      images: [],
      startsAt: null,
      endsAt: null,
      intent: "submit",
    };

    const parsed = adSchema.parse(payload);
    expect(parsed.purchaseInfo).toBeNull();
    expect(parsed.intent).toBe("submit");
  });

  it("allows merchant to submit with arbitrary Thai plain-text purchase instructions", () => {
    const payload = {
      shopId,
      title: "สินค้าทดลอง",
      description: "สินค้าทดลอง ติดต่อร้านค้าทาง Line @testshop",
      adType: "single_product",
      priceText: null,
      purchaseInfo: "สินค้าทดลอง ติดต่อร้านค้าทาง Line @testshop",
      coverImagePath: `${shopId}/00000000-0000-4000-8000-000000000099.jpg`,
      categoryIds: ["00000000-0000-4000-8000-000000000201"],
      images: [],
      startsAt: null,
      endsAt: null,
      intent: "submit",
    };

    const parsed = adSchema.parse(payload);
    expect(parsed.purchaseInfo).toBe("สินค้าทดลอง ติดต่อร้านค้าทาง Line @testshop");
    expect(parsed.intent).toBe("submit");
  });

  it("writes purchase_info without clearing a legacy destination during edits", () => {
    const parsed = adSchema.parse({
      shopId,
      title: "สินค้าทดลอง",
      description: "",
      adType: "single_product",
      priceText: null,
      purchaseInfo: "นัดรับที่หน้าร้าน",
      coverImagePath: `${shopId}/00000000-0000-4000-8000-000000000099.jpg`,
      categoryIds: ["00000000-0000-4000-8000-000000000201"],
      images: [],
      startsAt: null,
      endsAt: null,
      intent: "draft",
    });

    expect(toAdUpdateRow(parsed)).not.toHaveProperty("destination_url");
    expect(toAdUpdateRow(parsed).purchase_info).toBe("นัดรับที่หน้าร้าน");
    expect(toAdInsertRow(parsed).destination_url).toBeNull();
  });

  it("prevents merchant from setting active status directly via client schema", () => {
    const payload = {
      shopId,
      title: "ชุดเดรสผ้าฝ้ายมินิมอล",
      description: "เดรสผ้าฝ้ายระบายอากาศดี เหมาะกับวันสบายๆ",
      adType: "single_product",
      priceText: "฿590",
      purchaseInfo: "ติดต่อร้านค้าเพื่อสั่งซื้อ",
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
