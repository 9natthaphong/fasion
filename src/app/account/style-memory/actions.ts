"use server";

import { createClient } from "@/lib/supabase/server";
import { requirePageRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { requireActivePro } from "@/lib/entitlements";

export async function saveStyleMemory(formData: FormData) {
  const user = await requirePageRole(["customer"], "/login/customer");
  await requireActivePro(user.id);
  const supabase = await createClient();

  const weekdayStr = formData.get("weekday") as string;
  const weekday = parseInt(weekdayStr, 10);
  const title = formData.get("title") as string;
  const usual_activity = formData.get("usual_activity") as string;
  const time_of_day = formData.get("time_of_day") as string;
  const location_context = formData.get("location_context") as string;
  const formality = formData.get("formality") as string;
  const notes = formData.get("notes") as string;
  const is_active = formData.get("is_active") === "true";
  const use_for_ai = formData.get("use_for_ai") === "true";
  
  const preferred_styles_str = formData.get("preferred_styles") as string;
  const preferred_styles = preferred_styles_str ? preferred_styles_str.split(",").map(s => s.trim()) : [];

  const { data: existing } = await supabase
    .from("weekly_style_memories")
    .select("id")
    .eq("user_id", user.id)
    .eq("weekday", weekday)
    .single();

  if (existing) {
    await supabase.from("weekly_style_memories").update({
      title, usual_activity, time_of_day, location_context, formality, notes, is_active, use_for_ai, preferred_styles
    }).eq("id", existing.id);
  } else {
    await supabase.from("weekly_style_memories").insert({
      user_id: user.id, weekday, title, usual_activity, time_of_day, location_context, formality, notes, is_active, use_for_ai, preferred_styles
    });
  }

  revalidatePath("/account/style-memory");
}

export async function clearStyleMemory(weekday: number) {
  const user = await requirePageRole(["customer"], "/login/customer");
  await requireActivePro(user.id);
  const supabase = await createClient();

  await supabase.from("weekly_style_memories").delete().eq("user_id", user.id).eq("weekday", weekday);
  revalidatePath("/account/style-memory");
}
