import { describe, it, expect } from "vitest";
import {
  normalizeItemType,
  getItemTypeLabel,
  filterWardrobeItems,
  validateOutfitComposition,
} from "@/lib/clothing-taxonomy";
import type { WardrobeItem } from "@/lib/types";

describe("Clothing Taxonomy & Filtering", () => {
  it("normalizes item types and legacy/singular/plural aliases correctly", () => {
    expect(normalizeItemType("top")).toBe("top");
    expect(normalizeItemType("tops")).toBe("top");
    expect(normalizeItemType("SHIRT")).toBe("top");
    expect(normalizeItemType("bottoms")).toBe("bottom");
    expect(normalizeItemType("pants")).toBe("bottom");
    expect(normalizeItemType("dresses")).toBe("dress");
    expect(normalizeItemType("outerwears")).toBe("outerwear");
    expect(normalizeItemType("shoes")).toBe("shoes");
    expect(normalizeItemType("shoe")).toBe("shoes");
    expect(normalizeItemType("unknown_random")).toBe("top");
  });

  it("returns human-readable Thai labels", () => {
    expect(getItemTypeLabel("top")).toBe("เสื้อ");
    expect(getItemTypeLabel("dress")).toBe("ชุดเดรส");
    expect(getItemTypeLabel("shoes")).toBe("รองเท้า");
  });

  const mockItems: WardrobeItem[] = [
    {
      id: "1",
      user_id: "u1",
      image_path: "p1",
      item_type: "top",
      subcategory: "t-shirt",
      name: "White Tee",
      primary_colors: ["ขาว"],
      styles: ["minimal"],
      material: "cotton",
      preferred_fit: "regular",
      formality: "casual",
      weather_suitability: ["warm"],
      ai_description: null,
      ai_tags: {},
      analysis_status: "completed",
      availability_status: "available",
      is_favorite: true,
      last_worn_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    },
    {
      id: "2",
      user_id: "u1",
      image_path: "p2",
      item_type: "bottom",
      subcategory: "jeans",
      name: "Blue Jeans",
      primary_colors: ["น้ำเงิน"],
      styles: ["casual"],
      material: "denim",
      preferred_fit: "regular",
      formality: "casual",
      weather_suitability: ["warm"],
      ai_description: null,
      ai_tags: {},
      analysis_status: "completed",
      availability_status: "laundry",
      is_favorite: false,
      last_worn_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    },
    {
      id: "3",
      user_id: "u1",
      image_path: "p3",
      item_type: "dress",
      subcategory: "linen dress",
      name: "Linen Dress",
      primary_colors: ["เบจ"],
      styles: ["minimal"],
      material: "linen",
      preferred_fit: "relaxed",
      formality: "smart_casual",
      weather_suitability: ["hot"],
      ai_description: null,
      ai_tags: {},
      analysis_status: "completed",
      availability_status: "available",
      is_favorite: false,
      last_worn_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    },
    {
      id: "4",
      user_id: "u1",
      image_path: "p4",
      item_type: "top",
      subcategory: "jacket",
      name: "Archived Blazer",
      primary_colors: ["ดำ"],
      styles: ["formal"],
      material: "wool",
      preferred_fit: "fitted",
      formality: "formal",
      weather_suitability: ["cool"],
      ai_description: null,
      ai_tags: {},
      analysis_status: "completed",
      availability_status: "archived",
      is_favorite: false,
      last_worn_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    },
  ];

  it("filters items by type and status safely", () => {
    const topsOnly = filterWardrobeItems(mockItems, { type: "top" });
    expect(topsOnly.length).toBe(2);

    const availableOnly = filterWardrobeItems(mockItems, { status: "available" });
    expect(availableOnly.length).toBe(2);

    const laundryOnly = filterWardrobeItems(mockItems, { status: "laundry" });
    expect(laundryOnly.length).toBe(1);

    const favoritesOnly = filterWardrobeItems(mockItems, { favoriteOnly: true });
    expect(favoritesOnly.length).toBe(1);
    expect(favoritesOnly[0].id).toBe("1");
  });

  it("excludes laundry and archived items for AI Stylist selection", () => {
    const stylistItems = filterWardrobeItems(mockItems, { availableOnlyForStylist: true });
    expect(stylistItems.every((i) => i.availability_status === "available")).toBe(true);
    expect(stylistItems.map((i) => i.id)).toEqual(["1", "3"]);
  });

  it("handles dress outfit logic correctly (dress satisfies top & bottom requirement)", () => {
    const result = validateOutfitComposition(mockItems);
    expect(result.hasTop).toBe(true);
    expect(result.hasDress).toBe(true);
    expect(result.canMakeOutfit).toBe(true); // Can make outfit because dress is available
  });
});
