import { describe, expect, it } from "vitest";
import { customerFitProfileSchema } from "@/lib/validation";

describe("customer fit profile validation", () => {
  it("accepts valid measurement ranges and optional fields", () => {
    const validProfile = {
      heightCm: 175,
      weightKg: 68,
      chestCm: 95,
      waistCm: 78,
      hipsCm: 98,
      usualTopSize: "M",
      usualBottomSize: "31",
      selfDescribedBodyShape: "straight",
      skinUndertone: "warm",
      skinDepth: "medium",
      useForAiStyling: true,
      useWardrobeForPersonalization: false,
      enablePersonalizedAds: true,
    };
    const res = customerFitProfileSchema.safeParse(validProfile);
    expect(res.success).toBe(true);
  });

  it("rejects out-of-range height and weight measurements", () => {
    const invalidHeight = { heightCm: 10 };
    expect(customerFitProfileSchema.safeParse(invalidHeight).success).toBe(false);

    const invalidWeight = { weightKg: 500 };
    expect(customerFitProfileSchema.safeParse(invalidWeight).success).toBe(false);
  });

  it("defaults privacy consent toggles safely", () => {
    const parsed = customerFitProfileSchema.parse({});
    expect(parsed.useForAiStyling).toBe(false);
    expect(parsed.useWardrobeForPersonalization).toBe(false);
    expect(parsed.enablePersonalizedAds).toBe(true);
  });
});
