import { z } from "zod";
import { destinationUrlSchema } from "@/lib/outbound-url";
import { purchaseInfoSchema } from "@/lib/purchase-info";

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
    heightCm: z.preprocess((val) => (val === "" || val === undefined ? null : val), z.coerce.number().min(80).max(260).nullable()),
    weightKg: z.preprocess((val) => (val === "" || val === undefined ? null : val), z.coerce.number().min(20).max(350).nullable()),
    clothingPresentation: z.preprocess(
      (val) => (["menswear", "womenswear", "unisex", "unspecified"].includes(val as string) ? val : "unspecified"),
      z.enum(["menswear", "womenswear", "unisex", "unspecified"]),
    ),
    preferredStyles: z.preprocess((val) => (Array.isArray(val) ? val : []), z.array(z.string().trim().max(40)).max(12)),
    preferredColors: z.preprocess((val) => (Array.isArray(val) ? val : []), z.array(z.string().trim().max(40)).max(12)),
    avoidedColors: z.preprocess((val) => (Array.isArray(val) ? val : []), z.array(z.string().trim().max(40)).max(12)),
    preferredFit: z.preprocess(
      (val) => (["fitted", "relaxed", "unspecified"].includes(val as string) ? val : "unspecified"),
      z.enum(["fitted", "relaxed", "unspecified"]),
    ),
    defaultBudget: z.preprocess((val) => (val === "" || val === undefined ? null : val), z.coerce.number().min(0).max(1_000_000).nullable()),
    saveBodyInformation: z.preprocess((val) => Boolean(val), z.boolean().default(true)),
  })
  .transform((value) =>
    value.saveBodyInformation
      ? value
      : { ...value, heightCm: null, weightKg: null },
  );

export const bodyShapeEnum = z.enum([
  "straight",
  "triangle",
  "inverted_triangle",
  "oval",
  "hourglass",
  "unsure",
  "prefer_not_to_say",
]);

export const skinUndertoneEnum = z.enum([
  "warm",
  "cool",
  "neutral",
  "olive",
  "unsure",
  "prefer_not_to_say",
]);

export const skinDepthEnum = z.enum([
  "very_light",
  "light",
  "medium",
  "tan",
  "deep",
  "very_deep",
  "prefer_not_to_say",
]);

export const customerFitProfileSchema = z.object({
  heightCm: z.coerce.number().min(50).max(250).nullable().optional(),
  weightKg: z.coerce.number().min(20).max(300).nullable().optional(),
  chestCm: z.coerce.number().min(40).max(200).nullable().optional(),
  bustCm: z.coerce.number().min(40).max(200).nullable().optional(),
  waistCm: z.coerce.number().min(30).max(200).nullable().optional(),
  hipsCm: z.coerce.number().min(40).max(200).nullable().optional(),
  shoulderWidthCm: z.coerce.number().min(20).max(100).nullable().optional(),
  inseamCm: z.coerce.number().min(30).max(150).nullable().optional(),
  sleeveLengthCm: z.coerce.number().min(20).max(120).nullable().optional(),
  shoeLengthCm: z.coerce.number().min(10).max(50).nullable().optional(),
  usualTopSize: z.string().trim().max(40).nullable().optional(),
  usualBottomSize: z.string().trim().max(40).nullable().optional(),
  usualShoeSize: z.string().trim().max(40).nullable().optional(),
  selfDescribedBodyShape: bodyShapeEnum.nullable().optional(),
  skinUndertone: skinUndertoneEnum.nullable().optional(),
  skinDepth: skinDepthEnum.nullable().optional(),
  colorContrastPreference: z.string().trim().max(100).nullable().optional(),
  fitNotes: z.string().trim().max(800).nullable().optional(),
  useForAiStyling: z.boolean().default(false),
  useWardrobeForPersonalization: z.boolean().default(false),
  enablePersonalizedAds: z.boolean().default(false),
  personalizedAdsConsentAt: z.string().datetime().nullable().optional(),
  personalizationResetAt: z.string().datetime().nullable().optional(),
});

export const shopSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "ใช้ a-z, 0-9 และขีดกลางเท่านั้น"),
  description: z.string().trim().max(1500),
  websiteUrl: destinationUrlSchema.optional(),
  instagramUrl: z.union([
    z.literal(""),
    z
      .string()
      .trim()
      .url("ลิงก์ Instagram ไม่ถูกต้อง")
      .refine((value) => new URL(value).protocol === "https:", "ต้องใช้ HTTPS"),
  ]).optional(),
  tagIds: z.array(z.string().uuid()).max(20).optional(),
});

export const adSchema = z
  .object({
    shopId: z.string().uuid(),
    title: z.string().trim().min(2).max(140),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .optional(),
    description: z.string().trim().max(3000),
    adType: z.enum([
      "single_product",
      "outfit_set",
      "collection",
      "promotion",
      "shop_feature",
    ]),
    priceText: z.string().trim().max(80).nullable(),
    // purchase_info: free-text optional field for purchase channel / contact info.
    // Replaces the old destinationUrl-only merchant experience.
    // Accepts Thai/English plain text, Line IDs, Instagram handles, URLs, or blank.
    purchaseInfo: purchaseInfoSchema,
    coverImagePath: z.string().trim().max(500).nullable(),
    categoryIds: z.array(z.string().uuid()).min(1).max(5),
    tagIds: z.array(z.string().uuid()).max(20).optional(),
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
  heightCm: z.coerce.number().min(80).max(260).nullable().optional().default(null),
  weightKg: z.coerce.number().min(20).max(350).nullable().optional().default(null),
  clothingPresentation: z.enum(["menswear", "womenswear", "unisex", "unspecified"]).default("unspecified"),
  activity: z.string().trim().min(2, "กรุณาระบุกิจกรรมอย่างน้อย 2 ตัวอักษร").max(100),
  formality: z.enum(["casual", "smart_casual", "formal"]).default("casual"),
  weather: z.string().trim().min(2, "กรุณาระบุสภาพอากาศ").max(160),
  timeOfDay: z.enum(["morning", "afternoon", "evening", "all_day"]).default("all_day"),
  preferredStyles: z.preprocess((val) => (Array.isArray(val) ? val : []), z.array(z.string().trim().max(40)).max(12)).default([]),
  preferredColors: z.preprocess((val) => (Array.isArray(val) ? val : []), z.array(z.string().trim().max(40)).max(12)).default([]),
  avoidedColors: z.preprocess((val) => (Array.isArray(val) ? val : []), z.array(z.string().trim().max(40)).max(12)).default([]),
  preferredFit: z.enum(["fitted", "relaxed", "unspecified"]).default("unspecified"),
  budget: z.coerce.number().min(0).max(1_000_000).nullable().optional().default(null),
  anchorItem: z.preprocess((val) => (val === null || val === undefined ? "" : String(val).trim()), z.string().max(300)).default(""),
  notes: z.preprocess((val) => (val === null || val === undefined ? "" : String(val).trim()), z.string().max(800)).default(""),
  saveForNextTime: z.boolean().default(false),
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
  if (!path || typeof path !== "string") return false;
  const prefix = `${userId}/`;
  if (!path.startsWith(prefix)) return false;
  const rest = path.slice(prefix.length);
  if (rest.includes("..") || rest.includes("\\") || /[\0\r\n\t<>"']/.test(rest)) return false;
  if (!/\.(?:jpe?g|png|webp)$/i.test(rest)) return false;
  const parts = rest.split("/");
  if (parts.length < 1 || parts.length > 3) return false;
  const segmentRegex = /^[a-zA-Z0-9_.-]+$/;
  return parts.every((p) => p.length > 0 && segmentRegex.test(p));
}

import { normalizeItemType } from "@/lib/clothing-taxonomy";

export const wardrobeItemTypeEnum = z.preprocess(
  (val) => (typeof val === "string" ? normalizeItemType(val) ?? val : val),
  z.enum([
    "top",
    "bottom",
    "skirt",
    "dress",
    "outerwear",
    "shoes",
    "bag",
    "accessory",
  ])
);

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

export const savedOutfitSchema = z.object({
  outfitResultId: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(1, "กรุณากรอกชื่อชุด").max(100),
  direction: z.enum(["safe", "elevated", "comfortable", "custom"]),
  notes: z.string().trim().max(800).nullable().optional(),
  isFavorite: z.boolean().default(false),
  items: z
    .array(
      z.object({
        wardrobeItemId: z.string().uuid().nullable().optional(),
        itemRole: z.string().trim().min(1).max(100),
        itemDescription: z.string().trim().max(500).nullable().optional(),
        stylingInstruction: z.string().trim().max(500).nullable().optional(),
        sortOrder: z.number().int().min(0).default(0),
      }),
    )
    .max(10)
    .default([]),
});

export const wearLogSchema = z.object({
  savedOutfitId: z.string().uuid().nullable().optional(),
  outfitResultId: z.string().uuid().nullable().optional(),
  wornOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "รูปแบบวันที่ไม่ถูกต้อง"),
  occasion: z.string().trim().max(100).nullable().optional(),
  weatherNote: z.string().trim().max(200).nullable().optional(),
  comfortRating: z.number().int().min(1).max(5).nullable().optional(),
  confidenceRating: z.number().int().min(1).max(5).nullable().optional(),
  notes: z.string().trim().max(800).nullable().optional(),
});

export const outfitFeedbackSchema = z.object({
  outfitResultId: z.string().uuid(),
  outfitIndex: z.number().int().min(0).max(2),
  rating: z.enum(["liked", "neutral", "disliked"]),
  feedbackTags: z.array(z.string().trim().max(60)).max(10).default([]),
  comment: z.string().trim().max(800).nullable().optional(),
});
