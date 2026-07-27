import { z } from "zod";
import { shopeeUrlSchema } from "@/lib/shopee";

const email = z.string().trim().email("อีเมลไม่ถูกต้อง").max(254);
const password = z
  .string()
  .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
  .max(128, "รหัสผ่านยาวเกินไป");

const storageObjectName =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpe?g|png|webp)$/i;

export function isOwnedAdAssetPath(path: string, shopId: string) {
  const prefix = `${shopId}/`;
  return path.startsWith(prefix) && storageObjectName.test(path.slice(prefix.length));
}

export const loginSchema = z.object({ email, password });
export const registerSchema = loginSchema.extend({
  displayName: z.string().trim().min(2, "กรุณาใส่ชื่ออย่างน้อย 2 ตัวอักษร").max(100),
  role: z.enum(["customer", "merchant"]),
  acceptTerms: z.literal(true, { message: "กรุณายอมรับข้อกำหนดการใช้งาน" }),
});

export const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(100),
});

export const preferencesSchema = z
  .object({
    heightCm: z.coerce.number().min(80).max(260).nullable(),
    weightKg: z.coerce.number().min(20).max(350).nullable(),
    clothingPresentation: z.enum(["menswear", "womenswear", "unisex", "unspecified"]),
    preferredStyles: z.array(z.string().trim().max(40)).max(12),
    preferredColors: z.array(z.string().trim().max(40)).max(12),
    avoidedColors: z.array(z.string().trim().max(40)).max(12),
    preferredFit: z.enum(["fitted", "relaxed", "unspecified"]),
    defaultBudget: z.coerce.number().min(0).max(1_000_000).nullable(),
    saveBodyInformation: z.boolean(),
  })
  .transform((value) =>
    value.saveBodyInformation
      ? value
      : { ...value, heightCm: null, weightKg: null },
  );

export const shopSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "ใช้ a-z, 0-9 และขีดกลางเท่านั้น"),
  description: z.string().trim().max(1500),
  shopeeUrl: shopeeUrlSchema.optional().or(z.literal("")),
  instagramUrl: z.union([
    z.literal(""),
    z
      .string()
      .trim()
      .url("ลิงก์ Instagram ไม่ถูกต้อง")
      .refine((value) => new URL(value).protocol === "https:", "ต้องใช้ HTTPS"),
  ]).optional(),
});

export const adSchema = z
  .object({
    shopId: z.string().uuid(),
    title: z.string().trim().min(2).max(140),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    description: z.string().trim().max(3000),
    adType: z.enum([
      "single_product",
      "outfit_set",
      "collection",
      "promotion",
      "shop_feature",
    ]),
    priceText: z.string().trim().max(80).nullable(),
    destinationUrl: shopeeUrlSchema,
    coverImagePath: z.string().trim().max(500).nullable(),
    categoryIds: z.array(z.string().uuid()).min(1).max(5),
    images: z
      .array(
        z.object({
          storagePath: z.string().trim().min(1).max(500),
          altText: z.string().trim().min(1).max(240),
          sortOrder: z.number().int().min(0).max(20),
        }),
      )
      .max(8),
    startsAt: z.string().datetime().nullable(),
    endsAt: z.string().datetime().nullable(),
    intent: z.enum(["draft", "submit"]),
  })
  .refine(
    (data) => !data.startsAt || !data.endsAt || new Date(data.endsAt) > new Date(data.startsAt),
    { path: ["endsAt"], message: "วันสิ้นสุดต้องอยู่หลังวันเริ่ม" },
  )
  .superRefine((data, context) => {
    if (
      data.coverImagePath &&
      !isOwnedAdAssetPath(data.coverImagePath, data.shopId)
    ) {
      context.addIssue({
        code: "custom",
        path: ["coverImagePath"],
        message: "รูปหน้าปกต้องเป็นไฟล์ที่อัปโหลดให้ร้านนี้",
      });
    }
    const seenPaths = new Set<string>();
    const seenOrders = new Set<number>();
    data.images.forEach((image, index) => {
      if (!isOwnedAdAssetPath(image.storagePath, data.shopId)) {
        context.addIssue({
          code: "custom",
          path: ["images", index, "storagePath"],
          message: "รูปโฆษณาต้องเป็นไฟล์ที่อัปโหลดให้ร้านนี้",
        });
      }
      if (seenPaths.has(image.storagePath)) {
        context.addIssue({
          code: "custom",
          path: ["images", index, "storagePath"],
          message: "ไม่สามารถใช้รูปเดิมซ้ำในโฆษณาเดียวกัน",
        });
      }
      if (seenOrders.has(image.sortOrder)) {
        context.addIssue({
          code: "custom",
          path: ["images", index, "sortOrder"],
          message: "ลำดับรูปต้องไม่ซ้ำกัน",
        });
      }
      seenPaths.add(image.storagePath);
      seenOrders.add(image.sortOrder);
    });
  });

export const impressionSchema = z.object({
  adId: z.string().uuid(),
  pageContext: z.string().trim().min(1).max(100),
});

export const shopViewSchema = z.object({ shopId: z.string().uuid() });

export const adminShopActionSchema = z.object({
  action: z.enum(["approve", "reject", "suspend", "activate_subscription", "expire_subscription"]),
  subscriptionEndsAt: z.string().datetime().nullable().optional(),
  reason: z.string().trim().max(500).optional(),
});

export const adminAdActionSchema = z.object({
  action: z.enum(["approve", "reject", "pause"]),
  reason: z.string().trim().max(500).optional(),
});

export const outfitInputSchema = z.object({
  heightCm: z.coerce.number().min(80).max(260).nullable(),
  weightKg: z.coerce.number().min(20).max(350).nullable(),
  clothingPresentation: z.enum(["menswear", "womenswear", "unisex", "unspecified"]),
  activity: z.string().trim().min(2).max(100),
  formality: z.enum(["casual", "smart_casual", "formal"]),
  weather: z.string().trim().min(2).max(160),
  timeOfDay: z.enum(["morning", "afternoon", "evening", "all_day"]),
  preferredStyles: z.array(z.string().trim().max(40)).max(12),
  preferredColors: z.array(z.string().trim().max(40)).max(12),
  avoidedColors: z.array(z.string().trim().max(40)).max(12),
  preferredFit: z.enum(["fitted", "relaxed", "unspecified"]),
  budget: z.coerce.number().min(0).max(1_000_000).nullable(),
  anchorItem: z.string().trim().max(300),
  notes: z.string().trim().max(800),
  saveForNextTime: z.boolean(),
});

const outfitSuggestionSchema = z.object({
  name: z.string().min(1).max(100),
  direction: z.enum(["safe", "elevated", "comfortable"]),
  style: z.string().min(1).max(100),
  top: z.string().min(1).max(500),
  bottom: z.string().min(1).max(500),
  outerwear: z.string().max(500).nullable(),
  shoes: z.string().min(1).max(500),
  accessories: z.array(z.string().max(160)).max(8),
  colorPalette: z.array(z.string().max(80)).min(1).max(8),
  reason: z.string().min(1).max(800),
  comfortNote: z.string().min(1).max(500),
  sizeNote: z.string().min(1).max(500),
  estimatedBudgetText: z.string().min(1).max(160),
});

export const outfitResponseSchema = z
  .object({
    summary: z.string().min(1).max(1000),
    outfits: z.array(outfitSuggestionSchema).length(3),
    generalTips: z.array(z.string().max(400)).min(1).max(8),
  })
  .superRefine((value, context) => {
    const directions = value.outfits.map((outfit) => outfit.direction);
    for (const expected of ["safe", "elevated", "comfortable"] as const) {
      if (!directions.includes(expected)) {
        context.addIssue({
          code: "custom",
          path: ["outfits"],
          message: `ผลลัพธ์ต้องมี direction ${expected}`,
        });
      }
    }
  });

export function isOwnedWardrobeAssetPath(path: string, userId: string): boolean {
  const prefix = `${userId}/`;
  if (!path.startsWith(prefix)) return false;
  const rest = path.slice(prefix.length);
  const parts = rest.split("/");
  if (parts.length !== 2) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const filenameRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpe?g|png|webp)$/i;
  return uuidRegex.test(parts[0]) && filenameRegex.test(parts[1]);
}

export const wardrobeItemTypeEnum = z.enum([
  "top",
  "bottom",
  "skirt",
  "dress",
  "outerwear",
  "shoes",
  "bag",
  "accessory",
]);

export const wardrobePreferredFitEnum = z.enum([
  "fitted",
  "regular",
  "relaxed",
  "oversized",
  "unknown",
]);

export const wardrobeFormalityEnum = z.enum([
  "casual",
  "smart_casual",
  "business",
  "formal",
  "sport",
  "unknown",
]);

export const wardrobeAvailabilityStatusEnum = z.enum([
  "available",
  "laundry",
  "archived",
]);

export const wardrobeItemSchema = z.object({
  imagePath: z.string().trim().min(1).max(500),
  itemType: wardrobeItemTypeEnum,
  subcategory: z.string().trim().max(100).nullable().optional(),
  name: z.string().trim().min(1, "กรุณากรอกชื่อเสื้อผ้า").max(120),
  primaryColors: z.array(z.string().trim().max(40)).min(1, "เลือกสีอย่างน้อย 1 สี").max(8),
  styles: z.array(z.string().trim().max(40)).max(8),
  material: z.string().trim().max(100).nullable().optional(),
  preferredFit: wardrobePreferredFitEnum.nullable().optional(),
  formality: wardrobeFormalityEnum.nullable().optional(),
  weatherSuitability: z.array(z.string().trim().max(40)).max(8),
  aiDescription: z.string().trim().max(1000).nullable().optional(),
  availabilityStatus: wardrobeAvailabilityStatusEnum.default("available"),
  isFavorite: z.boolean().default(false),
});

export const wardrobeAnalysisOutputSchema = z.object({
  itemType: wardrobeItemTypeEnum,
  subcategory: z.string().trim().max(100).nullable(),
  suggestedName: z.string().trim().min(1).max(120),
  primaryColors: z.array(z.string().trim().max(40)).min(1).max(8),
  styles: z.array(z.string().trim().max(40)).max(8),
  material: z.string().trim().max(100).nullable(),
  preferredFit: wardrobePreferredFitEnum,
  formality: wardrobeFormalityEnum,
  weatherSuitability: z.array(z.string().trim().max(40)).max(8),
  description: z.string().trim().max(1000),
  confidence: z.number().min(0).max(1),
});

export const wardrobeOutfitItemRefSchema = z.object({
  wardrobeItemId: z.string().uuid(),
  role: z.string().min(1).max(100),
  stylingInstruction: z.string().min(1).max(500),
});

export const wardrobeMissingItemSchema = z.object({
  role: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  optional: z.boolean(),
});

export const wardrobeOutfitSuggestionSchema = z.object({
  name: z.string().min(1).max(100),
  direction: z.enum(["safe", "elevated", "comfortable"]),
  style: z.string().min(1).max(100),
  items: z.array(wardrobeOutfitItemRefSchema).min(1).max(10),
  missingItems: z.array(wardrobeMissingItemSchema).max(8),
  reason: z.string().min(1).max(800),
  comfortNote: z.string().min(1).max(500),
  sizeNote: z.string().min(1).max(500),
  estimatedBudgetText: z.string().min(1).max(160),
});

export const wardrobeOutfitResponseSchema = z
  .object({
    summary: z.string().min(1).max(1000),
    outfits: z.array(wardrobeOutfitSuggestionSchema).length(3),
    generalTips: z.array(z.string().max(400)).min(1).max(8),
  })
  .superRefine((value, context) => {
    const directions = value.outfits.map((outfit) => outfit.direction);
    for (const expected of ["safe", "elevated", "comfortable"] as const) {
      if (!directions.includes(expected)) {
        context.addIssue({
          code: "custom",
          path: ["outfits"],
          message: `ผลลัพธ์ต้องมี direction ${expected}`,
        });
      }
    }
  });

export const wardrobeOutfitInputSchema = outfitInputSchema.extend({
  mode: z.enum(["general", "wardrobe"]).default("general"),
  excludedItemIds: z.array(z.string().uuid()).max(50).default([]),
});

