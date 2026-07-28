import type {
  WardrobeItem,
  WardrobeItemType,
  WardrobeAvailabilityStatus,
  WardrobeFormality,
} from "@/lib/types";

export interface TaxonomyCategory {
  key: WardrobeItemType;
  labelTh: string;
  labelEn: string;
  aliases: string[];
  isOnePiece?: boolean;
}

export const CANONICAL_WARDROBE_TYPES: TaxonomyCategory[] = [
  { key: "top", labelTh: "เสื้อ", labelEn: "Tops", aliases: ["tops", "shirt", "t-shirt", "blouse", "sweater", "เสื้อ"] },
  { key: "bottom", labelTh: "กางเกง", labelEn: "Bottoms", aliases: ["bottoms", "pants", "trousers", "shorts", "jeans", "กางเกง"] },
  { key: "skirt", labelTh: "กระโปรง", labelEn: "Skirts", aliases: ["skirts", "กระโปรง"] },
  { key: "dress", labelTh: "ชุดเดรส", labelEn: "Dresses", aliases: ["dresses", "one-piece", "jumpsuit", "ชุดเดรส", "เดรส"], isOnePiece: true },
  { key: "outerwear", labelTh: "เสื้อคลุม/แจ็กเก็ต", labelEn: "Outerwear", aliases: ["outerwears", "jacket", "coat", "blazer", "cardigan", "เสื้อคลุม", "แจ็กเก็ต"] },
  { key: "shoes", labelTh: "รองเท้า", labelEn: "Shoes", aliases: ["shoe", "footwear", "sneakers", "boots", "heels", "รองเท้า"] },
  { key: "bag", labelTh: "กระเป๋า", labelEn: "Bags", aliases: ["bags", "handbag", "backpack", "tote", "กระเป๋า"] },
  { key: "accessory", labelTh: "เครื่องประดับ", labelEn: "Accessories", aliases: ["accessories", "jewelry", "hat", "belt", "sunglasses", "เครื่องประดับ"] },
];

export const CANONICAL_AVAILABILITY_STATUSES: { key: WardrobeAvailabilityStatus; labelTh: string }[] = [
  { key: "available", labelTh: "พร้อมใส่" },
  { key: "laundry", labelTh: "อยู่ในตะกร้าซัก" },
  { key: "archived", labelTh: "เก็บไว้ก่อน" },
];

export const CANONICAL_FORMALITIES: { key: WardrobeFormality; labelTh: string }[] = [
  { key: "casual", labelTh: "สบายๆ / ชิลๆ" },
  { key: "smart_casual", labelTh: "สมาร์ตแคชชวล" },
  { key: "business", labelTh: "ทํางาน / ทางการ" },
  { key: "formal", labelTh: "งานพิธี / ออกงาน" },
  { key: "sport", labelTh: "ออกกำลังกาย / แอคทีฟ" },
  { key: "unknown", labelTh: "ทั่วไป" },
];

export function normalizeItemType(input: string | null | undefined): WardrobeItemType {
  if (!input) return "top";
  const cleaned = input.trim().toLowerCase();
  
  for (const cat of CANONICAL_WARDROBE_TYPES) {
    if (cat.key === cleaned || cat.aliases.includes(cleaned)) {
      return cat.key;
    }
  }
  return "top";
}

export function getItemTypeLabel(type: WardrobeItemType): string {
  const found = CANONICAL_WARDROBE_TYPES.find((c) => c.key === type);
  return found ? found.labelTh : "เสื้อผ้า";
}

export function filterWardrobeItems(
  items: WardrobeItem[],
  options?: {
    type?: string | null;
    status?: string | null;
    favoriteOnly?: boolean;
    availableOnlyForStylist?: boolean;
  }
): WardrobeItem[] {
  return items.filter((item) => {
    // 1. Exclude deleted items
    if (item.deleted_at) return false;

    // 2. Stylist availability filter (must be available)
    if (options?.availableOnlyForStylist && item.availability_status !== "available") {
      return false;
    }

    // 3. Status filter
    if (options?.status && options.status !== "all") {
      if (item.availability_status !== options.status) return false;
    }

    // 4. Item type filter (supports alias normalization)
    if (options?.type && options.type !== "all") {
      const normalizedQuery = normalizeItemType(options.type);
      const normalizedItem = normalizeItemType(item.item_type);
      if (normalizedItem !== normalizedQuery) return false;
    }

    // 5. Favorite filter
    if (options?.favoriteOnly && !item.is_favorite) {
      return false;
    }

    return true;
  });
}

/**
 * Checks if a set of wardrobe items can satisfy outfit requirements.
 * Dress items count as one-piece outfits (replacing both top & bottom).
 */
export function validateOutfitComposition(items: WardrobeItem[]): {
  hasTop: boolean;
  hasBottom: boolean;
  hasDress: boolean;
  canMakeOutfit: boolean;
  availableItems: WardrobeItem[];
} {
  const available = filterWardrobeItems(items, { availableOnlyForStylist: true });
  const hasTop = available.some((i) => normalizeItemType(i.item_type) === "top");
  const hasBottom = available.some(
    (i) => normalizeItemType(i.item_type) === "bottom" || normalizeItemType(i.item_type) === "skirt"
  );
  const hasDress = available.some((i) => normalizeItemType(i.item_type) === "dress");

  const canMakeOutfit = (hasTop && hasBottom) || hasDress;

  return {
    hasTop,
    hasBottom,
    hasDress,
    canMakeOutfit,
    availableItems: available,
  };
}
