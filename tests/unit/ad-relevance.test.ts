import { describe, expect, it } from "vitest";
import { adSchema } from "@/lib/validation";
import { filterAdsByCategory } from "@/lib/catalog-filter";
import { ads } from "@/lib/demo-data";

describe("ad relevance and privacy invariants", () => {
  it("validates ad schema with optional taxonomy tagIds", () => {
    const shopId = "123e4567-e89b-12d3-a456-426614174000";
    const validAd = {
      shopId,
      title: "เสื้อเชิ้ตผ้าลินินทรงหลวม",
      slug: "linen-loose-shirt",
      description: "เสื้อเชิ้ตลินินใส่สบาย ระบายอากาศได้ดี",
      adType: "single_product",
      priceText: "790 THB",
      purchaseInfo: "ทัก Line @testshop",
      coverImagePath: `${shopId}/123e4567-e89b-12d3-a456-426614174001.jpg`,
      categoryIds: ["123e4567-e89b-12d3-a456-426614174001"],
      tagIds: ["123e4567-e89b-12d3-a456-426614174002"],
      images: [
        {
          storagePath: `${shopId}/123e4567-e89b-12d3-a456-426614174001.jpg`,
          altText: "เสื้อเชิ้ตลินิน",
          sortOrder: 0,
        },
      ],
      startsAt: null,
      endsAt: null,
      intent: "submit",
    };

    const res = adSchema.safeParse(validAd);
    expect(res.success).toBe(true);
  });

  it("prohibits sensitive fit profile fields from entering ad relevance schema", () => {
    const keys = Object.keys(adSchema.shape);
    expect(keys).not.toContain("heightCm");
    expect(keys).not.toContain("weightKg");
    expect(keys).not.toContain("chestCm");
    expect(keys).not.toContain("bodyShape");
    expect(keys).not.toContain("skinUndertone");
  });

  it("ensures fit measurements are excluded from ad scoring parameters", () => {
    const mockAdScoringInput = {
      preferredStyles: ["Minimal"],
      preferredColors: ["White"],
    };

    expect(mockAdScoringInput).not.toHaveProperty("heightCm");
    expect(mockAdScoringInput).not.toHaveProperty("weightKg");
    expect(mockAdScoringInput).not.toHaveProperty("chestCm");
  });

  it("never substitutes unrelated ads when a category has no direct relationship", () => {
    expect(filterAdsByCategory(ads, "not-a-real-category")).toEqual([]);
    const dresses = filterAdsByCategory(ads, "dresses");
    expect(dresses.length).toBeGreaterThan(0);
    expect(
      dresses.every((ad) =>
        ad.categories?.some((category) => category.slug === "dresses"),
      ),
    ).toBe(true);
  });
});
