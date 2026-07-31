"use server";

import { createClient } from "@/lib/supabase/server";
import { requirePageRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function saveAppearanceSettings(formData: FormData) {
  const user = await requirePageRole(["customer"], "/login/customer");
  const theme = formData.get("theme") as string;
  const accent = formData.get("accent") as string;

  const supabase = await createClient();
  
  await supabase
    .from("customer_preferences")
    .update({
      appearance_theme: theme,
      appearance_accent: accent
    })
    .eq("user_id", user.id);

  const cookieStore = await cookies();
  cookieStore.set("appearance_theme", theme, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  cookieStore.set("appearance_accent", accent, { path: "/", maxAge: 60 * 60 * 24 * 365 });

  revalidatePath("/");
  revalidatePath("/account/settings");
}
