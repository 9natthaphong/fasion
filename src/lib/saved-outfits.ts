import { createClient } from "@/lib/supabase/server";
import { savedOutfitSchema, wearLogSchema, outfitFeedbackSchema } from "@/lib/validation";
import type { SavedOutfit, WearLog, OutfitFeedback, AIHistoryItem } from "@/lib/types";

export async function getAIHistory(userId: string): Promise<AIHistoryItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("outfit_requests")
    .select(`
      id,
      created_at,
      input_data,
      outfit_results(
        id,
        result_data
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error || !data) return [];

  return data.map((item: { id: string; created_at: string; input_data: Record<string, unknown>; outfit_results: unknown }) => {
    const resRow = Array.isArray(item.outfit_results)
      ? (item.outfit_results[0] as { id: string; result_data: { summary?: string; outfits?: Array<{ direction: string; name: string; style: string; reason: string }> } } | null)
      : (item.outfit_results as { id: string; result_data: { summary?: string; outfits?: Array<{ direction: string; name: string; style: string; reason: string }> } } | null);
    return {
      id: item.id,
      created_at: item.created_at,
      input_data: item.input_data || {},
      result: resRow
        ? {
            id: resRow.id,
            summary: resRow.result_data?.summary || "",
            outfits: resRow.result_data?.outfits || [],
          }
        : null,
    };
  });
}

export async function getSavedOutfits(userId: string): Promise<SavedOutfit[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_outfits")
    .select(`
      *,
      items:saved_outfit_items(
        *,
        wardrobeItem:wardrobe_items(*)
      )
    `)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as unknown as SavedOutfit[];
}

export async function saveOutfit(userId: string, input: unknown): Promise<SavedOutfit> {
  const parsed = savedOutfitSchema.parse(input);
  const supabase = await createClient();

  const { data: outfitData, error: outfitErr } = await supabase
    .from("saved_outfits")
    .insert({
      user_id: userId,
      outfit_result_id: parsed.outfitResultId ?? null,
      name: parsed.name,
      direction: parsed.direction,
      notes: parsed.notes ?? null,
      is_favorite: parsed.isFavorite,
    })
    .select()
    .single();

  if (outfitErr || !outfitData) {
    throw new Error(`Failed to save outfit: ${outfitErr?.message}`);
  }

  if (parsed.items.length > 0) {
    const itemRows = parsed.items.map((item, idx) => ({
      saved_outfit_id: outfitData.id,
      wardrobe_item_id: item.wardrobeItemId ?? null,
      item_role: item.itemRole,
      item_description: item.itemDescription ?? null,
      styling_instruction: item.stylingInstruction ?? null,
      sort_order: item.sortOrder ?? idx,
    }));
    await supabase.from("saved_outfit_items").insert(itemRows);
  }

  return outfitData as SavedOutfit;
}

export async function deleteSavedOutfit(id: string, userId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("saved_outfits")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(`Failed to delete saved outfit: ${error.message}`);
}

export async function recordWearLog(userId: string, input: unknown): Promise<WearLog> {
  const parsed = wearLogSchema.parse(input);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("wear_logs")
    .insert({
      user_id: userId,
      saved_outfit_id: parsed.savedOutfitId ?? null,
      outfit_result_id: parsed.outfitResultId ?? null,
      worn_on: parsed.wornOn,
      occasion: parsed.occasion ?? null,
      weather_note: parsed.weatherNote ?? null,
      comfort_rating: parsed.comfortRating ?? null,
      confidence_rating: parsed.confidenceRating ?? null,
      notes: parsed.notes ?? null,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to record wear log: ${error?.message || "Unknown error"}`);
  }

  // Update last_worn_at on linked wardrobe items
  if (parsed.savedOutfitId) {
    const { data: items } = await supabase
      .from("saved_outfit_items")
      .select("wardrobe_item_id")
      .eq("saved_outfit_id", parsed.savedOutfitId)
      .not("wardrobe_item_id", "is", null);

    if (items && items.length > 0) {
      const wardrobeIds = items.map((i) => i.wardrobe_item_id);
      await supabase
        .from("wardrobe_items")
        .update({ last_worn_at: new Date().toISOString() })
        .in("id", wardrobeIds);
    }
  }

  return data as WearLog;
}

export async function getWearLogs(userId: string): Promise<WearLog[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wear_logs")
    .select("*")
    .eq("user_id", userId)
    .order("worn_on", { ascending: false });

  if (error || !data) return [];
  return data as WearLog[];
}

export async function saveOutfitFeedback(userId: string, input: unknown): Promise<OutfitFeedback> {
  const parsed = outfitFeedbackSchema.parse(input);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("outfit_feedback")
    .upsert({
      user_id: userId,
      outfit_result_id: parsed.outfitResultId,
      outfit_index: parsed.outfitIndex,
      rating: parsed.rating,
      feedback_tags: parsed.feedbackTags,
      comment: parsed.comment ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id, outfit_result_id, outfit_index" })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to save outfit feedback: ${error?.message || "Unknown error"}`);
  }

  return data as OutfitFeedback;
}

export async function getAggregatedFeedbackSummary(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("outfit_feedback")
    .select("rating, feedback_tags")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (!data || data.length === 0) return null;

  const likedTags: string[] = [];
  const dislikedTags: string[] = [];

  for (const f of data) {
    if (f.rating === "liked") likedTags.push(...f.feedback_tags);
    if (f.rating === "disliked") dislikedTags.push(...f.feedback_tags);
  }

  if (likedTags.length === 0 && dislikedTags.length === 0) return null;

  return `ข้อเสนอแนะในอดีต: ชอบสไตล์ที่ (${Array.from(new Set(likedTags)).slice(0, 3).join(", ") || "ใส่ง่าย"}), ควรหลีกเลี่ยง (${Array.from(new Set(dislikedTags)).slice(0, 3).join(", ") || "ไม่มี"})`;
}
