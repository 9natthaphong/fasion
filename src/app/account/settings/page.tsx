import { requirePageRole } from "@/lib/auth";
import { getFitProfile } from "@/lib/fit-profile";
import { PrivacySettingsForm } from "@/components/account/privacy-settings-form";
import { AccountDeletionForm } from "@/components/account-deletion-form";
import { AppearanceSettingsForm } from "@/components/account/appearance-settings-form";
import { Settings, AlertTriangle } from "lucide-react";
import { getCustomerEntitlements } from "@/lib/entitlements";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const user = await requirePageRole(["customer"], "/login/customer");
  const fitProfile = await getFitProfile(user.id);
  const entitlements = await getCustomerEntitlements(user.id);
  
  const supabase = await createClient();
  const { data: prefs } = await supabase
    .from("customer_preferences")
    .select("appearance_theme, appearance_accent")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="space-y-12 max-w-3xl">
      {/* Header */}
      <div className="border-b border-line pb-6">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-muted uppercase">
          <Settings className="w-4 h-4 text-olive" />
          <span>Account Settings & Privacy</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-charcoal mt-1">
          การตั้งค่าบัญชีและความเป็นส่วนตัว
        </h1>
        <p className="text-sm text-muted mt-1">
          จัดการสิทธิ์การปรับแต่งโฆษณา ความเป็นส่วนตัว และคำขอลบบัญชีผู้ใช้งาน
        </p>
      </div>

      {/* Privacy & Personalization Settings */}
      <PrivacySettingsForm initialProfile={fitProfile} />

      {/* Appearance Settings */}
      <AppearanceSettingsForm 
        isPro={entitlements.isProActive} 
        currentSettings={{ theme: prefs?.appearance_theme, accent: prefs?.appearance_accent }} 
      />

      {/* Danger Zone: Account Deletion */}
      <div className="border border-danger/30 bg-paper p-6 sm:p-8 space-y-6">
        <div className="space-y-1 border-b border-line pb-4">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-danger font-semibold uppercase">
            <AlertTriangle className="w-4 h-4" />
            <span>Danger Zone / การลบบัญชี</span>
          </div>
          <h2 className="font-serif text-2xl font-normal text-charcoal">ส่งคำขอลบบัญชีผู้ใช้งาน</h2>
          <p className="text-xs text-muted leading-relaxed">
            เมื่อส่งคำขอลบบัญชี ระบบจะลงชื่อออกทันที และข้อมูลส่วนตัวรวมถึงตู้เสื้อผ้า ประวัติการแต่งตัว
            สัดส่วน และชุดที่บันทึกไว้จะถูกลบออกจากระบบอย่างถาวร (ข้อมูลสถิติเชิงรวมของร้านค้าจะถูกทำลายการเชื่อมโยงกับตัวตนของคุณ)
          </p>
        </div>

        <AccountDeletionForm />
      </div>
    </div>
  );
}
