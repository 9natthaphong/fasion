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
  fashion_tags?: FashionTag[];
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
  fashion_tags?: FashionTag[];
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
  sponsoredAds?: PersonalizedAd[];
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
  sponsoredAds?: PersonalizedAd[];
}

export type BodyShapeOption =
  | "straight"
  | "triangle"
  | "inverted_triangle"
  | "oval"
  | "hourglass"
  | "unsure"
  | "prefer_not_to_say";

export type SkinUndertoneOption =
  | "warm"
  | "cool"
  | "neutral"
  | "olive"
  | "unsure"
  | "prefer_not_to_say";

export type SkinDepthOption =
  | "very_light"
  | "light"
  | "medium"
  | "tan"
  | "deep"
  | "very_deep"
  | "prefer_not_to_say";

export interface CustomerFitProfile {
  user_id: string;
  height_cm: number | null;
  weight_kg: number | null;
  chest_cm: number | null;
  bust_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  shoulder_width_cm: number | null;
  inseam_cm: number | null;
  sleeve_length_cm: number | null;
  shoe_length_cm: number | null;
  usual_top_size: string | null;
  usual_bottom_size: string | null;
  usual_shoe_size: string | null;
  self_described_body_shape: BodyShapeOption | null;
  skin_undertone: SkinUndertoneOption | null;
  skin_depth: SkinDepthOption | null;
  color_contrast_preference: string | null;
  fit_notes: string | null;
  use_for_ai_styling: boolean;
  use_wardrobe_for_personalization: boolean;
  enable_personalized_ads: boolean;
  created_at: string;
  updated_at: string;
}

export type FashionTagType =
  | "style"
  | "color"
  | "occasion"
  | "formality"
  | "fit"
  | "weather"
  | "season"
  | "item_type"
  | "audience";

export interface FashionTag {
  id: string;
  tag_type: FashionTagType;
  name_th: string;
  name_en: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface PersonalizedAd extends Ad {
  relevanceScore: number;
  explanations: string[];
}

export interface SavedOutfit {
  id: string;
  user_id: string;
  outfit_result_id: string | null;
  name: string;
  direction: "safe" | "elevated" | "comfortable" | "custom";
  notes: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  items?: SavedOutfitItem[];
}

export interface SavedOutfitItem {
  id: string;
  saved_outfit_id: string;
  wardrobe_item_id: string | null;
  item_role: string;
  item_description: string | null;
  styling_instruction: string | null;
  sort_order: number;
  wardrobeItem?: WardrobeItem | null;
}

export interface WearLog {
  id: string;
  user_id: string;
  saved_outfit_id: string | null;
  outfit_result_id: string | null;
  worn_on: string;
  occasion: string | null;
  weather_note: string | null;
  comfort_rating: number | null;
  confidence_rating: number | null;
  notes: string | null;
  created_at: string;
}

export interface OutfitFeedback {
  id: string;
  user_id: string;
  outfit_result_id: string;
  outfit_index: number;
  rating: "liked" | "neutral" | "disliked";
  feedback_tags: string[];
  comment: string | null;
  created_at: string;
  updated_at: string;
}
