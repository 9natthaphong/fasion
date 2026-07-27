import { requirePageRole } from "@/lib/auth";
import { getFitProfile } from "@/lib/fit-profile";
import { PrivacySettingsForm } from "@/components/account/privacy-settings-form";
import { Settings } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const user = await requirePageRole(["customer"], "/login/customer");
  const fitProfile = await getFitProfile(user.id);

  return (
    <div className="space-y-8 max-w-3xl">
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
          จัดการสิทธิ์การปรับแต่งโฆษณา ความเป็นส่วนตัว และสิทธิ์การใช้ข้อมูลตู้เสื้อผ้า
        </p>
      </div>

      <PrivacySettingsForm initialProfile={fitProfile} />
    </div>
  );
}
