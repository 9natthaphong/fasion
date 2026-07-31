import { NextResponse } from "next/server";
import { requireCustomerExperienceApi } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { preferencesSchema, profileSchema } from "@/lib/validation";
import { requireSameOrigin } from "@/lib/request-security";
import { getAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request) {
  if (!(await requireSameOrigin(request))) return NextResponse.json({ error: "Origin ไม่ถูกต้อง" }, { status: 403 });
  const auth = await requireCustomerExperienceApi();
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await request.json().catch(() => null);
  const profile = profileSchema.safeParse(body);
  const preferences = preferencesSchema.safeParse(body);
  if (!profile.success || !preferences.success) {
    return NextResponse.json(
      { error: profile.error?.issues[0]?.message ?? preferences.error?.issues[0]?.message },
      { status: 400 },
    );
  }
  const supabase = auth.user.role === "admin" ? getAdminClient() : await createClient();
  const profileResult = await supabase
    .from("profiles")
    .update({ display_name: profile.data.displayName })
    .eq("id", auth.user.id);
  if (profileResult.error) {
    return NextResponse.json({ error: "บันทึกโปรไฟล์ไม่สำเร็จ" }, { status: 400 });
  }
  const value = preferences.data;
  const preferenceResult = await supabase.from("customer_preferences").upsert({
    user_id: auth.user.id,
    height_cm: value.heightCm,
    weight_kg: value.weightKg,
    clothing_presentation: value.clothingPresentation,
    preferred_styles: value.preferredStyles,
    preferred_colors: value.preferredColors,
    avoided_colors: value.avoidedColors,
    preferred_fit: value.preferredFit,
    default_budget: value.defaultBudget,
    save_body_information: value.saveBodyInformation,
  });
  if (preferenceResult.error) {
    return NextResponse.json({ error: "บันทึกความชอบไม่สำเร็จ" }, { status: 400 });
  }
  return NextResponse.json({ message: "บันทึกโปรไฟล์แล้ว" });
}
