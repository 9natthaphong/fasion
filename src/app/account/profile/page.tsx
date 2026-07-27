import { requirePageRole } from "@/lib/auth";
import { getFitProfile } from "@/lib/fit-profile";
import { createClient } from "@/lib/supabase/server";
import { FitProfileForm } from "@/components/account/fit-profile-form";
import { UserCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requirePageRole(["customer"], "/login/customer");
  const supabase = await createClient();

  const [{ data: profileRow }, { data: prefRow }, fitProfile] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle(),
    supabase.from("customer_preferences").select("*").eq("user_id", user.id).maybeSingle(),
    getFitProfile(user.id),
  ]);

  const displayName = profileRow?.display_name || user.email?.split("@")[0] || "ผู้ใช้งาน";
  const initialPreferences = prefRow
    ? {
        clothingPresentation: prefRow.clothing_presentation || "unspecified",
        preferredStyles: prefRow.preferred_styles || [],
        preferredColors: prefRow.preferred_colors || [],
        avoidedColors: prefRow.avoided_colors || [],
        preferredFit: prefRow.preferred_fit || "unspecified",
        defaultBudget: prefRow.default_budget,
      }
    : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-line pb-6">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-muted uppercase">
          <UserCheck className="w-4 h-4 text-olive" />
          <span>Customer Profile & Style Preferences</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-charcoal mt-1">
          โปรไฟล์และสไตล์การแต่งตัว
        </h1>
        <p className="text-sm text-muted mt-1">
          ตั้งค่าข้อมูลทั่วไป สไตล์โปรด สัดส่วนเฉพาะตัว และการยินยอมเรื่องความเป็นส่วนตัว
        </p>
      </div>

      {/* Guided Fit Profile Form */}
      <FitProfileForm
        initialDisplayName={displayName}
        initialPreferences={initialPreferences}
        initialProfile={fitProfile}
      />
    </div>
  );
}
