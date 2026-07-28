import { createClient } from "@/lib/supabase/server";
import type { FashionTag, FashionTagType } from "@/lib/types";

export async function getActiveFashionTags(): Promise<FashionTag[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fashion_tags")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name_th", { ascending: true });

  if (error) {
    console.error("Error fetching fashion tags:", error);
    return [];
  }
  return data as FashionTag[];
}

export async function getFashionTagsGrouped(): Promise<Record<FashionTagType, FashionTag[]>> {
  const tags = await getActiveFashionTags();
  const grouped: Record<string, FashionTag[]> = {
    style: [],
    color: [],
    occasion: [],
    formality: [],
    fit: [],
    weather: [],
    season: [],
    item_type: [],
    audience: [],
  };

  for (const tag of tags) {
    if (grouped[tag.tag_type]) {
      grouped[tag.tag_type].push(tag);
    }
  }

  return grouped as Record<FashionTagType, FashionTag[]>;
}

export async function getShopFashionTags(shopId: string): Promise<FashionTag[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shop_fashion_tags")
    .select("fashion_tags(*)")
    .eq("shop_id", shopId);

  if (error || !data) return [];
  return data.map((item) => item.fashion_tags as unknown as FashionTag).filter(Boolean);
}

export async function setShopFashionTags(shopId: string, tagIds: string[]): Promise<void> {
  const supabase = await createClient();
  // Delete existing
  await supabase.from("shop_fashion_tags").delete().eq("shop_id", shopId);

  if (tagIds.length > 0) {
    const rows = tagIds.map((tagId) => ({ shop_id: shopId, tag_id: tagId }));
    const { error } = await supabase.from("shop_fashion_tags").insert(rows);
    if (error) throw new Error(`Failed to assign shop tags: ${error.message}`);
  }
}

export async function getAdFashionTags(adId: string): Promise<FashionTag[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ad_fashion_tags")
    .select("fashion_tags(*)")
    .eq("ad_id", adId);

  if (error || !data) return [];
  return data.map((item) => item.fashion_tags as unknown as FashionTag).filter(Boolean);
}

export async function setAdFashionTags(adId: string, tagIds: string[]): Promise<void> {
  const supabase = await createClient();
  // Delete existing
  await supabase.from("ad_fashion_tags").delete().eq("ad_id", adId);

  if (tagIds.length > 0) {
    const rows = tagIds.map((tagId) => ({ ad_id: adId, tag_id: tagId }));
    const { error } = await supabase.from("ad_fashion_tags").insert(rows);
    if (error) throw new Error(`Failed to assign ad tags: ${error.message}`);
  }
}
