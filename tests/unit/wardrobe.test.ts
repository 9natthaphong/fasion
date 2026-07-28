import { describe, expect, it } from "vitest";
import {
  isOwnedWardrobeAssetPath,
  wardrobeItemSchema,
  wardrobeAnalysisOutputSchema,
  wardrobeOutfitResponseSchema,
} from "@/lib/validation";
import { parseWardrobeFilters } from "@/lib/wardrobe-filters";

const validWardrobeItem = {
  imagePath: "00000000-0000-4000-8000-000000000001/00000000-0000-4000-8000-000000000002/10000000-0000-4000-8000-000000000003.webp",
  itemType: "top" as const,
  subcategory: "เชิ้ตแขนยาว",
  name: "เสื้อเชิ้ตผ้าลินินสีขาว",
  primaryColors: ["ขาว"],
  styles: ["เรียบง่าย", "มินิมอล"],
  material: "ผ้าลินิน",
  preferredFit: "regular" as const,
  formality: "casual" as const,
  weatherSuitability: ["warm", "indoor"],
  aiDescription: "เสื้อเชิ้ตลินินใส่สบาย",
  availabilityStatus: "available" as const,
  isFavorite: true,
};

const validWardrobeOutfitResult = {
  summary: "ชุดแนะนำจากตู้เสื้อผ้าของคุณสำหรับวันนี้",
  outfits: ["safe", "elevated", "comfortable"].map((direction, idx) => ({
    name: `ลุค ${idx + 1}`,
    direction: direction as "safe" | "elevated" | "comfortable",
    style: "มินิมอล",
    items: [
      {
        wardrobeItemId: "00000000-0000-4000-8000-000000000001",
        role: "top",
        stylingInstruction: "พับแขนเสื้อเล็กน้อย",
      },
      {
        wardrobeItemId: "00000000-0000-4000-8000-000000000002",
        role: "bottom",
        stylingInstruction: "ใส่กางเกงขายาวทรงตรง",
      },
    ],
    missingItems: [
      {
        role: "shoes",
        description: "รองเท้าผ้าใบสีขาวหรือสนีกเกอร์เรียบๆ",
        optional: false,
      },
    ],
    reason: "แมตช์สีนิวทรัลและระบายอากาศดี",
    comfortNote: "เน้นผ้าระบายอากาศ",
    sizeNote: "ทรงพอดีตัว",
    estimatedBudgetText: "ใช้เสื้อผ้าที่คุณมีอยู่แล้ว",
  })),
  generalTips: ["พกร่มพับขนาดเล็ก"],
};

describe("wardrobe asset path validation", () => {
  it("validates owned wardrobe asset storage path structure", () => {
    const userId = "00000000-0000-4000-8000-000000000001";
    const validPath = `${userId}/00000000-0000-4000-8000-000000000002/10000000-0000-4000-8000-000000000003.webp`;
    expect(isOwnedWardrobeAssetPath(validPath, userId)).toBe(true);
  });

  it("rejects path with foreign userId or malformed path", () => {
    const userId = "00000000-0000-4000-8000-000000000001";
    const foreignUserPath = "99999999-0000-4000-8000-000000000099/00000000-0000-4000-8000-000000000002/10000000-0000-4000-8000-000000000003.webp";
    expect(isOwnedWardrobeAssetPath(foreignUserPath, userId)).toBe(false);

    const invalidExtPath = `${userId}/00000000-0000-4000-8000-000000000002/10000000-0000-4000-8000-000000000003.exe`;
    expect(isOwnedWardrobeAssetPath(invalidExtPath, userId)).toBe(false);
  });
});

describe("wardrobe query filters", () => {
  it("accepts known filters", () => {
    expect(
      parseWardrobeFilters({
        type: "dress",
        status: "available",
        favorite: "true",
      }),
    ).toEqual({
      type: "dress",
      status: "available",
      favoriteOnly: true,
      invalid: false,
    });
  });

  it("marks unknown filters invalid instead of treating them as all items", () => {
    const parsed = parseWardrobeFilters({
      type: "unknown-type",
      status: "not-a-status",
    });
    expect(parsed.invalid).toBe(true);
    expect(parsed.type).toBe("all");
    expect(parsed.status).toBe("all");
  });
});

describe("wardrobe item schema validation", () => {
  it("accepts valid wardrobe item metadata", () => {
    const res = wardrobeItemSchema.safeParse(validWardrobeItem);
    expect(res.success).toBe(true);
  });

  it("rejects invalid item types or missing required name", () => {
    const invalidType = { ...validWardrobeItem, itemType: "invalid_type" };
    expect(wardrobeItemSchema.safeParse(invalidType).success).toBe(false);

    const missingName = { ...validWardrobeItem, name: "" };
    expect(wardrobeItemSchema.safeParse(missingName).success).toBe(false);
  });
});

describe("wardrobe vision analysis output schema", () => {
  it("parses valid AI vision analysis output", () => {
    const mockAnalysis = {
      itemType: "top",
      subcategory: "เสื้อเชิ้ต",
      suggestedName: "เสื้อเชิ้ตผ้าลินินสีขาว",
      primaryColors: ["ขาว"],
      styles: ["มินิมอล"],
      material: "ผ้าลินิน",
      preferredFit: "regular",
      formality: "casual",
      weatherSuitability: ["warm", "indoor"],
      description: "เสื้อเชิ้ตเรียบง่ายสำหรับใส่ทั่วไป",
      confidence: 0.95,
    };
    const res = wardrobeAnalysisOutputSchema.safeParse(mockAnalysis);
    expect(res.success).toBe(true);
  });
});

describe("wardrobe outfit response schema", () => {
  it("accepts exactly 3 distinct outfit directions for wardrobe mode", () => {
    const res = wardrobeOutfitResponseSchema.safeParse(validWardrobeOutfitResult);
    expect(res.success).toBe(true);
  });

  it("rejects response missing required direction (e.g. missing safe)", () => {
    const missingSafe = {
      ...validWardrobeOutfitResult,
      outfits: validWardrobeOutfitResult.outfits.map((o) => ({ ...o, direction: "elevated" })),
    };
    expect(wardrobeOutfitResponseSchema.safeParse(missingSafe).success).toBe(false);
  });
});
