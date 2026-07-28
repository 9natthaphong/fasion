import { isSupabaseConfigured, isSupabaseAdminConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import type { WardrobeItem, WardrobeItemType, WardrobeAvailabilityStatus } from "@/lib/types";

export function wardrobeAssetUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("/")) return path;
  return `/api/assets?bucket=wardrobe-assets&path=${encodeURIComponent(path)}`;
}

export async function getWardrobeItems(
  userId: string,
  options?: {
    type?: WardrobeItemType | "all";
    status?: WardrobeAvailabilityStatus | "all";
    favoriteOnly?: boolean;
  },
): Promise<WardrobeItem[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  let query = supabase
    .from("wardrobe_items")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (options?.type && options.type !== "all") {
    query = query.eq("item_type", options.type);
  }
  if (options?.status && options.status !== "all") {
    query = query.eq("availability_status", options.status);
  }
  if (options?.favoriteOnly) {
    query = query.eq("is_favorite", true);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  return data.map((row) => ({
    ...(row as unknown as WardrobeItem),
    signed_image_url: wardrobeAssetUrl(row.image_path),
  }));
}

export async function getWardrobeItem(
  id: string,
  userId: string,
): Promise<WardrobeItem | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("wardrobe_items")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) return null;

  return {
    ...(data as unknown as WardrobeItem),
    signed_image_url: wardrobeAssetUrl(data.image_path),
  };
}

export async function createWardrobeItem(
  userId: string,
  itemData: Partial<WardrobeItem> & { image_path: string; item_type: WardrobeItemType },
): Promise<WardrobeItem | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();

  const payload = {
    user_id: userId,
    image_path: itemData.image_path,
    item_type: itemData.item_type,
    subcategory: itemData.subcategory ?? null,
    name: itemData.name ?? "เสื้อผ้าของฉัน",
    primary_colors: itemData.primary_colors ?? [],
    styles: itemData.styles ?? [],
    material: itemData.material ?? null,
    preferred_fit: itemData.preferred_fit ?? "regular",
    formality: itemData.formality ?? "casual",
    weather_suitability: itemData.weather_suitability ?? ["warm", "indoor"],
    ai_description: itemData.ai_description ?? null,
    ai_tags: itemData.ai_tags ?? {},
    analysis_status: itemData.analysis_status ?? "completed",
    availability_status: itemData.availability_status ?? "available",
    is_favorite: itemData.is_favorite ?? false,
  };

  const { data, error } = await supabase
    .from("wardrobe_items")
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) return null;

  return {
    ...(data as unknown as WardrobeItem),
    signed_image_url: wardrobeAssetUrl(data.image_path),
  };
}

export async function updateWardrobeItem(
  id: string,
  userId: string,
  updates: Partial<WardrobeItem>,
): Promise<WardrobeItem | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("wardrobe_items")
    .update({
      subcategory: updates.subcategory,
      name: updates.name,
      item_type: updates.item_type,
      primary_colors: updates.primary_colors,
      styles: updates.styles,
      material: updates.material,
      preferred_fit: updates.preferred_fit,
      formality: updates.formality,
      weather_suitability: updates.weather_suitability,
      ai_description: updates.ai_description,
      ai_tags: updates.ai_tags,
      analysis_status: updates.analysis_status,
      availability_status: updates.availability_status,
      is_favorite: updates.is_favorite,
      last_worn_at: updates.last_worn_at,
    })
    .eq("id", id)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .select("*")
    .single();

  if (error || !data) return null;

  return {
    ...(data as unknown as WardrobeItem),
    signed_image_url: wardrobeAssetUrl(data.image_path),
  };
}

export async function deleteWardrobeItem(
  id: string,
  userId: string,
  permanent = false,
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = await createClient();

  if (!permanent) {
    const { error } = await supabase
      .from("wardrobe_items")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);
    return !error;
  }

  const { data: item } = await supabase
    .from("wardrobe_items")
    .select("image_path")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  const { error } = await supabase
    .from("wardrobe_items")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) return false;

  if (item?.image_path && isSupabaseAdminConfigured()) {
    const admin = getAdminClient();
    await admin.storage.from("wardrobe-assets").remove([item.image_path]);
  }

  return true;
}
