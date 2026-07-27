import Link from "next/link";
import { EmptyState, StatusBadge } from "@/components/ui";
import { requirePageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdRowActions } from "@/components/ad-row-actions";

export default async function MerchantAdsPage() {
  const user = await requirePageRole(["merchant"], "/login/merchant");
  const supabase = await createClient();
  const { data: shop } = await supabase.from("shops").select("id").eq("owner_id", user.id).is("deleted_at", null).maybeSingle();
  if (!shop) return <EmptyState title="ยังไม่มีร้าน" body="สร้างร้านก่อนเตรียมโฆษณา" href="/merchant/onboarding" action="สร้างร้าน" />;
  const { data: ads } = await supabase.from("ads").select("id, title, status, updated_at, price_text").eq("shop_id", shop.id).is("deleted_at", null).order("updated_at", { ascending: false });
  return (
    <section className="dashboard-section">
      <div className="dashboard-title-row"><div><p className="eyebrow">Campaigns</p><h1>โฆษณา</h1></div><Link className="button button-solid" href="/merchant/ads/new">สร้างโฆษณา</Link></div>
      {!ads?.length ? <EmptyState title="ยังไม่มีโฆษณา" body="สร้างร่างแรกของร้านได้เลย" href="/merchant/ads/new" action="สร้างโฆษณา" /> : (
        <div className="data-list">{ads.map((ad) => (
          <article key={ad.id} className="data-row">
            <div><h2>{ad.title}</h2><p>{ad.price_text || "ไม่ระบุราคา"} · อัปเดต {new Date(ad.updated_at).toLocaleDateString("th-TH")}</p></div>
            <div className="inline-actions"><StatusBadge tone={ad.status === "active" ? "success" : ad.status === "rejected" ? "danger" : "neutral"}>{ad.status}</StatusBadge><AdRowActions id={ad.id} status={ad.status} /><Link className="button button-ghost" href={`/merchant/ads/${ad.id}/edit`}>แก้ไข</Link></div>
          </article>
        ))}</div>
      )}
    </section>
  );
}
