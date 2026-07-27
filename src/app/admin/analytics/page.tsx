import { StatCard } from "@/components/ui";
import { formatCtr } from "@/lib/domain";
import { getAdminClient } from "@/lib/supabase/admin";

export default async function AdminAnalyticsPage() {
  const admin = getAdminClient();
  const [{ count: impressions }, { count: clicks }, { count: likes }, { count: views }] = await Promise.all([
    admin.from("ad_impressions").select("id", { count: "exact", head: true }),
    admin.from("ad_clicks").select("id", { count: "exact", head: true }),
    admin.from("ad_likes").select("ad_id", { count: "exact", head: true }),
    admin.from("shop_views").select("id", { count: "exact", head: true }),
  ]);
  return <section className="dashboard-section"><p className="eyebrow">System analytics</p><h1>สถิติระบบ</h1><div className="stats-grid"><StatCard label="Impressions" value={String(impressions ?? 0)} /><StatCard label="คลิก" value={String(clicks ?? 0)} /><StatCard label="CTR รวม" value={formatCtr(clicks ?? 0, impressions ?? 0)} /><StatCard label="ถูกใจ" value={String(likes ?? 0)} /><StatCard label="เปิดหน้าร้าน" value={String(views ?? 0)} /></div><p className="muted">คำนวณจาก event tables โดยตรง สามารถ reconcile ได้ ไม่ใช้ counter จาก client เป็น source of truth</p></section>;
}
