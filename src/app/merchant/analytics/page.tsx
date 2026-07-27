import { EmptyState, StatCard } from "@/components/ui";
import { requirePageRole } from "@/lib/auth";
import { formatCtr } from "@/lib/domain";
import { createClient } from "@/lib/supabase/server";

export default async function MerchantAnalyticsPage() {
  const user = await requirePageRole(["merchant"], "/login/merchant");
  const supabase = await createClient();
  const { data: shop } = await supabase.from("shops").select("id").eq("owner_id", user.id).is("deleted_at", null).maybeSingle();
  if (!shop) return <EmptyState title="ยังไม่มีข้อมูลสถิติ" body="สร้างร้านและโฆษณาก่อน" href="/merchant/onboarding" action="สร้างร้าน" />;
  const since = thirtyDaysAgo();
  const [{ data: impressions }, { data: clicks }, { data: likes }, { data: ads }] = await Promise.all([
    supabase.from("ad_impressions").select("ad_id, created_at, ads!inner(shop_id)").eq("ads.shop_id", shop.id).gte("created_at", since),
    supabase.from("ad_clicks").select("ad_id, created_at, ads!inner(shop_id)").eq("ads.shop_id", shop.id).gte("created_at", since),
    supabase.from("ad_likes").select("ad_id, ads!inner(shop_id)").eq("ads.shop_id", shop.id),
    supabase.from("ads").select("id, title").eq("shop_id", shop.id),
  ]);
  const rank = (ads ?? []).map((ad) => ({
    ...ad,
    impressions: impressions?.filter((event) => event.ad_id === ad.id).length ?? 0,
    clicks: clicks?.filter((event) => event.ad_id === ad.id).length ?? 0,
    likes: likes?.filter((event) => event.ad_id === ad.id).length ?? 0,
  })).sort((a, b) => b.clicks - a.clicks);
  return (
    <section className="dashboard-section">
      <p className="eyebrow">Last 30 days · Asia/Bangkok</p><h1>สถิติร้าน</h1>
      <div className="stats-grid"><StatCard label="Impressions" value={String(impressions?.length ?? 0)} /><StatCard label="ถูกใจทั้งหมด" value={String(likes?.length ?? 0)} /><StatCard label="คลิก" value={String(clicks?.length ?? 0)} /><StatCard label="CTR" value={formatCtr(clicks?.length ?? 0, impressions?.length ?? 0)} /></div>
      <div className="chart-bars" aria-label="อันดับโฆษณาตามจำนวนคลิก">{rank.slice(0, 8).map((ad) => <div key={ad.id}><span>{ad.title}</span><div style={{ width: `${Math.max(5, Math.min(100, ad.clicks * 10))}%` }} /><strong>{ad.clicks} คลิก · CTR {formatCtr(ad.clicks, ad.impressions)}</strong></div>)}</div>
    </section>
  );
}

function thirtyDaysAgo() {
  return new Date(Date.now() - 30 * 86_400_000).toISOString();
}
