import { requirePageRole } from "@/lib/auth";
import { getFitProfile } from "@/lib/fit-profile";
import { FitProfileForm } from "@/components/account/fit-profile-form";
import { UserCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requirePageRole(["customer"], "/login/customer");
  const fitProfile = await getFitProfile(user.id);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-line pb-6">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-muted uppercase">
          <UserCheck className="w-4 h-4 text-olive" />
          <span>Customer Style & Fit Profile</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-charcoal mt-1">
          โปรไฟล์สัดส่วนและความชอบ
        </h1>
        <p className="text-sm text-muted mt-1">
          กรอกข้อมูลสัดส่วนแบบสมบูรณ์และตั้งค่าการยินยอมเรื่องความเป็นส่วนตัว
        </p>
      </div>

      {/* Guided Fit Profile Form */}
      <FitProfileForm initialProfile={fitProfile} />
    </div>
  );
}
