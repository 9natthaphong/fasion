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
