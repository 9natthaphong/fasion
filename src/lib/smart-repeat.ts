import { createClient } from "./supabase/server";

export async function getRecentWears(userId: string) {
  const supabase = await createClient();
  const { data: wearLogs } = await supabase
    .from("wear_logs")
    .select("worn_on, saved_outfit_id, outfit_result_id")
    .eq("user_id", userId)
    .order("worn_on", { ascending: false })
    .limit(30);

  if (!wearLogs || wearLogs.length === 0) return { recentlyWornItemIds: [] };

  const recentlyWornOutfitIds = wearLogs
    .map(log => log.saved_outfit_id)
    .filter(Boolean) as string[];

  let recentlyWornItemIds: string[] = [];
  if (recentlyWornOutfitIds.length > 0) {
    const { data: outfitItems } = await supabase
      .from("saved_outfit_items")
      .select("wardrobe_item_id")
      .in("saved_outfit_id", recentlyWornOutfitIds);
      
    if (outfitItems) {
      recentlyWornItemIds = outfitItems.map(oi => oi.wardrobe_item_id).filter(Boolean) as string[];
    }
  }

  return {
    recentlyWornItemIds
  };
}

export function buildRepeatAvoidancePromptContext(recentlyWornItemIds: string[], preference: string = 'balanced') {
  if (preference === 'none' || recentlyWornItemIds.length === 0) {
    return "";
  }

  const uniqueIds = Array.from(new Set(recentlyWornItemIds));
  
  let logic = `\n[Smart Repeat Avoidance]\n`;
  logic += `The user has recently worn these wardrobe item IDs in the last 14 days: ${uniqueIds.join(", ")}.\n`;
  
  if (preference === 'balanced') {
    logic += `Please prefer variety. Do not ban repetition entirely, but try not to suggest the exact same key pieces worn in the last 7 days unless the wardrobe is very small.\n`;
    logic += `If an item repeats, explain gently why it's being reused.\n`;
  } else if (preference === 'favorites_okay') {
    logic += `It's okay to repeat favorite staples frequently, but still try to vary the accompanying pieces. If an item repeats, explain gently why it's being reused.\n`;
  }
  
  return logic;
}
