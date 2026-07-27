import Link from "next/link";
import { EmptyState, StatCard, StatusBadge } from "@/components/ui";
import { requirePageRole } from "@/lib/auth";
import { formatCtr } from "@/lib/domain";
import { createClient } from "@/lib/supabase/server";

export default async function MerchantDashboardPage() {
  const user = await requirePageRole(["merchant"], "/login/merchant");
  const supabase = await createClient();
  const { data: shop } = await supabase.from("shops").select("*").eq("owner_id", user.id).is("deleted_at", null).maybeSingle();
  if (!shop) return <EmptyState title="ยังไม่มีโปรไฟล์ร้าน" body="สร้างร้านก่อนเพื่อเริ่มเตรียมโฆษณา" href="/merchant/onboarding" action="สร้างร้าน" />;
  const [{ data: ads }, { count: impressions }, { count: clicks }, { count: likes }] = await Promise.all([
    supabase.from("ads").select("id, status").eq("shop_id", shop.id).is("deleted_at", null),
    supabase.from("ad_impressions").select("id, ads!inner(shop_id)", { count: "exact", head: true }).eq("ads.shop_id", shop.id),
    supabase.from("ad_clicks").select("id, ads!inner(shop_id)", { count: "exact", head: true }).eq("ads.shop_id", shop.id),
    supabase.from("ad_likes").select("ad_id, ads!inner(shop_id)", { count: "exact", head: true }).eq("ads.shop_id", shop.id),
  ]);
  const active = ads?.filter((ad) => ad.status === "active").length ?? 0;
  return (
    <section className="dashboard-section">
      <div className="dashboard-title-row">
        <div><p className="eyebrow">Merchant dashboard</p><h1>{shop.name}</h1></div>
        <Link className="button button-solid" href="/merchant/ads/new">สร้างโฆษณา</Link>
      </div>
      <div className="badge-row">
        <StatusBadge tone={shop.status === "approved" ? "success" : "warning"}>ร้าน: {shop.status}</StatusBadge>
        <StatusBadge tone={shop.subscription_status === "active" ? "success" : "neutral"}>Subscription: {shop.subscription_status}</StatusBadge>
      </div>
      <div className="stats-grid">
        <StatCard label="โฆษณา active" value={String(active)} />
        <StatCard label="Impressions" value={(impressions ?? 0).toLocaleString("th-TH")} />
        <StatCard label="ถูกใจ" value={(likes ?? 0).toLocaleString("th-TH")} />
        <StatCard label="คลิก Shopee" value={(clicks ?? 0).toLocaleString("th-TH")} hint={`CTR ${formatCtr(clicks ?? 0, impressions ?? 0)}`} />
      </div>
      <div className="editorial-note">
        <h2>สถานะการเผยแพร่</h2>
        <p>{shop.status === "approved" && shop.subscription_status === "active" ? "ร้านพร้อมส่งโฆษณาให้ทีมตรวจแล้ว" : "คุณสร้างร่างได้ แต่ต้องรออนุมัติร้านและเปิด subscription ก่อนส่งตรวจ"}</p>
      </div>
    </section>
  );
}
