import { ProfileForm } from "@/components/profile-form";
import { requirePageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AccountProfilePage() {
  const user = await requirePageRole(["customer"], "/login/customer");
  const supabase = await createClient();
  const [{ data: profile }, { data: preferences }] = await Promise.all([
    supabase.from("profiles").select("display_name").eq("id", user.id).single(),
    supabase.from("customer_preferences").select("*").eq("user_id", user.id).maybeSingle(),
  ]);
  return (
    <>
      <header className="dashboard-heading">
        <p className="eyebrow">Profile</p>
        <h1>โปรไฟล์และความชอบ</h1>
        <p>เลือกได้ว่าจะเก็บข้อมูลร่างกายหรือใช้เฉพาะครั้งนี้</p>
      </header>
      <ProfileForm
        initial={{
          displayName: profile?.display_name ?? "",
          heightCm: preferences?.height_cm ?? null,
          weightKg: preferences?.weight_kg ?? null,
          clothingPresentation: preferences?.clothing_presentation ?? "unspecified",
          preferredFit: preferences?.preferred_fit ?? "unspecified",
          defaultBudget: preferences?.default_budget ?? null,
          preferredStyles: preferences?.preferred_styles ?? [],
          preferredColors: preferences?.preferred_colors ?? [],
          avoidedColors: preferences?.avoided_colors ?? [],
          saveBodyInformation: preferences?.save_body_information ?? false,
        }}
      />
    </>
  );
}

