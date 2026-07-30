import { describe, expect, it } from "vitest";
import { adSchema, outfitInputSchema, outfitResponseSchema, preferencesSchema, shopSchema } from "@/lib/validation";

const validOutfit = {
  summary: "เหมาะกับวันที่อากาศร้อน",
  outfits: ["safe", "elevated", "comfortable"].map((direction, index) => ({
    name: `ชุด ${index + 1}`,
    direction,
    style: "Minimal",
    top: "เสื้อเชิ้ตผ้าบาง",
    bottom: "กางเกงทรงตรง",
    outerwear: null,
    shoes: "รองเท้าผ้าใบ",
    accessories: ["นาฬิกา"],
    colorPalette: ["ขาว", "มะกอก"],
    reason: "เคลื่อนไหวง่ายและเหมาะกับอากาศ",
    comfortNote: "เลือกผ้าระบายอากาศ",
    sizeNote: "ตรวจตารางไซซ์ของร้าน",
    estimatedBudgetText: "ประมาณ 1,500 บาท",
  })),
  generalTips: ["พกร่มขนาดเล็ก"],
};

describe("input validation", () => {
  it("does not retain body information when opt-out is selected", () => {
    const result = preferencesSchema.parse({
      heightCm: 172,
      weightKg: 65,
      clothingPresentation: "unisex",
      preferredStyles: [],
      preferredColors: [],
      avoidedColors: [],
      preferredFit: "unspecified",
      defaultBudget: null,
      saveBodyInformation: false,
    });
    expect(result.heightCm).toBeNull();
    expect(result.weightKg).toBeNull();
  });
  it("normalizes optional empty strings and missing body measurements in stylist input", () => {
    const parsed = outfitInputSchema.parse({
      activity: "ไปคาเฟ่",
      weather: "32°C ร้อนชื้น",
    });
    expect(parsed.anchorItem).toBe("");
    expect(parsed.notes).toBe("");
    expect(parsed.heightCm).toBeNull();
    expect(parsed.weightKg).toBeNull();
    expect(parsed.preferredStyles).toEqual([]);
    expect(parsed.preferredColors).toEqual([]);
    expect(parsed.avoidedColors).toEqual([]);
  });
  it("rejects invalid stylist ranges", () => {
    expect(outfitInputSchema.safeParse({
      heightCm: 20,
      weightKg: null,
      clothingPresentation: "unspecified",
      activity: "ไปทำงาน",
      formality: "casual",
      weather: "ร้อน",
      timeOfDay: "morning",
      preferredStyles: [],
      preferredColors: [],
      avoidedColors: [],
      preferredFit: "unspecified",
      budget: 1000,
      anchorItem: "",
      notes: "",
      saveForNextTime: false,
    }).success).toBe(false);
  });
  it("validates an ad and normalizes its purchase_info free-text field", () => {
    const parsed = adSchema.parse({
      shopId: "00000000-0000-4000-8000-000000000001",
      title: "ลุคประจำวัน",
      slug: "daily-look",
      description: "",
      adType: "outfit_set",
      priceText: "1,200 บาท",
      purchaseInfo: "  ทัก Line @testshop  ",
      coverImagePath: null,
      categoryIds: ["00000000-0000-4000-8000-000000000002"],
      images: [],
      startsAt: null,
      endsAt: null,
      intent: "draft",
    });
    // purchaseInfo should be trimmed
    expect(parsed.purchaseInfo).toBe("ทัก Line @testshop");
  });
  it("rejects ad assets outside the owning shop prefix", () => {
    const result = adSchema.safeParse({
      shopId: "00000000-0000-4000-8000-000000000001",
      title: "ลุคประจำวัน",
      slug: "daily-look",
      description: "",
      adType: "outfit_set",
      priceText: null,
      purchaseInfo: null,
      coverImagePath:
        "00000000-0000-4000-8000-000000000099/10000000-0000-4000-8000-000000000001.webp",
      categoryIds: ["00000000-0000-4000-8000-000000000002"],
      images: [],
      startsAt: null,
      endsAt: null,
      intent: "draft",
    });
    expect(result.success).toBe(false);
  });
  it("accepts an empty optional Instagram URL without throwing", () => {
    expect(
      shopSchema.safeParse({
        name: "FitToday Shop",
        slug: "fittoday-shop",
        description: "",
        websiteUrl: "https://example.com/fittoday",
        instagramUrl: "",
      }).success,
    ).toBe(true);
  });
});

describe("outfit structured output", () => {
  it("accepts exactly three distinct required directions", () => {
    expect(outfitResponseSchema.safeParse(validOutfit).success).toBe(true);
  });
  it("rejects missing and repeated directions", () => {
    expect(outfitResponseSchema.safeParse({ ...validOutfit, outfits: validOutfit.outfits.slice(0, 2) }).success).toBe(false);
    expect(outfitResponseSchema.safeParse({ ...validOutfit, outfits: validOutfit.outfits.map((outfit) => ({ ...outfit, direction: "safe" })) }).success).toBe(false);
  });
});
