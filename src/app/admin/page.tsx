import Link from "next/link";
import { StatCard } from "@/components/ui";
import { isSupabaseAdminConfigured } from "@/lib/env";
import { getAdminClient } from "@/lib/supabase/admin";

export default async function AdminPage() {
  if (!isSupabaseAdminConfigured()) {
    return (
      <section className="dashboard-section">
        <p className="eyebrow">Moderation console</p>
        <h1>ศูนย์ควบคุม</h1>
        <div className="config-notice" role="status">
          <strong>Configuration missing</strong>
          <p>ต้องตั้งค่า SUPABASE_SECRET_KEY และ ADMIN_EMAILS บน server ก่อนจึงจะเข้าถึงฟังก์ชันแอดมินได้</p>
        </div>
      </section>
    );
  }
  const admin = getAdminClient();
  const [{ count: users }, { count: pendingShops }, { count: pendingAds }, { count: activeAds }] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }).is("deleted_at", null),
    admin.from("shops").select("id", { count: "exact", head: true }).eq("status", "pending").is("deleted_at", null),
    admin.from("ads").select("id", { count: "exact", head: true }).eq("status", "pending_review").is("deleted_at", null),
    admin.from("ads").select("id", { count: "exact", head: true }).eq("status", "active").is("deleted_at", null),
  ]);
  return (
    <section className="dashboard-section">
      <p className="eyebrow">Moderation console</p><h1>ศูนย์ควบคุม</h1>
      <div className="stats-grid"><StatCard label="ผู้ใช้" value={String(users ?? 0)} /><StatCard label="ร้านรอตรวจ" value={String(pendingShops ?? 0)} /><StatCard label="โฆษณารอตรวจ" value={String(pendingAds ?? 0)} /><StatCard label="โฆษณา active" value={String(activeAds ?? 0)} /></div>
      <div className="admin-queue"><Link href="/admin/shops">ตรวจร้านที่รออนุมัติ <span>→</span></Link><Link href="/admin/ads">ตรวจโฆษณาที่รออนุมัติ <span>→</span></Link></div>
    </section>
  );
}
