export type UserRole = "customer" | "merchant" | "admin";

export type AdType =
  | "single_product"
  | "outfit_set"
  | "collection"
  | "promotion"
  | "shop_feature";

export type AdStatus =
  | "draft"
  | "pending_review"
  | "active"
  | "rejected"
  | "paused"
  | "expired";

export interface Category {
  id: string;
  name_th: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
}

export interface Shop {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo_path: string | null;
  cover_path: string | null;
  shopee_url: string | null;
  instagram_url: string | null;
  status: "pending" | "approved" | "suspended" | "rejected";
  subscription_status: "inactive" | "active" | "expired";
  subscription_ends_at: string | null;
  is_demo?: boolean;
}

export interface Ad {
  id: string;
  shop_id: string;
  title: string;
  slug: string;
  description: string;
  ad_type: AdType;
  price_text: string | null;
  destination_url: string;
  cover_image_path: string | null;
  status: AdStatus;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  shop?: Shop;
  categories?: Category[];
  impressions?: number;
  likes?: number;
  clicks?: number;
  is_demo?: boolean;
}

export interface OutfitSuggestion {
  name: string;
  direction: "safe" | "elevated" | "comfortable";
  style: string;
  top: string;
  bottom: string;
  outerwear: string | null;
  shoes: string;
  accessories: string[];
  colorPalette: string[];
  reason: string;
  comfortNote: string;
  sizeNote: string;
  estimatedBudgetText: string;
}

export interface OutfitResponse {
  summary: string;
  outfits: OutfitSuggestion[];
  generalTips: string[];
  isDemo?: boolean;
}

export type WardrobeItemType =
  | "top"
  | "bottom"
  | "skirt"
  | "dress"
  | "outerwear"
  | "shoes"
  | "bag"
  | "accessory";

export type WardrobeAnalysisStatus =
  | "pending"
  | "analyzing"
  | "completed"
  | "failed"
  | "manual";

export type WardrobeAvailabilityStatus = "available" | "laundry" | "archived";

export type WardrobePreferredFit =
  | "fitted"
  | "regular"
  | "relaxed"
  | "oversized"
  | "unknown";

export type WardrobeFormality =
  | "casual"
  | "smart_casual"
  | "business"
  | "formal"
  | "sport"
  | "unknown";

export interface WardrobeItem {
  id: string;
  user_id: string;
  image_path: string;
  item_type: WardrobeItemType;
  subcategory: string | null;
  name: string | null;
  primary_colors: string[];
  styles: string[];
  material: string | null;
  preferred_fit: WardrobePreferredFit | null;
  formality: WardrobeFormality | null;
  weather_suitability: string[];
  ai_description: string | null;
  ai_tags: Record<string, unknown>;
  analysis_status: WardrobeAnalysisStatus;
  availability_status: WardrobeAvailabilityStatus;
  is_favorite: boolean;
  last_worn_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  signed_image_url?: string | null;
}

export interface WardrobeAnalysisOutput {
  itemType: WardrobeItemType;
  subcategory: string | null;
  suggestedName: string;
  primaryColors: string[];
  styles: string[];
  material: string | null;
  preferredFit: WardrobePreferredFit;
  formality: WardrobeFormality;
  weatherSuitability: string[];
  description: string;
  confidence: number;
}

export interface WardrobeOutfitItemRef {
  wardrobeItemId: string;
  role: WardrobeItemType | string;
  stylingInstruction: string;
  itemDetails?: WardrobeItem | null;
}

export interface WardrobeMissingItem {
  role: string;
  description: string;
  optional: boolean;
}

export interface WardrobeOutfitSuggestion {
  name: string;
  direction: "safe" | "elevated" | "comfortable";
  style: string;
  items: WardrobeOutfitItemRef[];
  missingItems: WardrobeMissingItem[];
  reason: string;
  comfortNote: string;
  sizeNote: string;
  estimatedBudgetText: string;
}

export interface WardrobeOutfitResponse {
  summary: string;
  outfits: WardrobeOutfitSuggestion[];
  generalTips: string[];
}

