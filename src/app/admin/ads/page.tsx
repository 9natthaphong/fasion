import Link from "next/link";
import { StatusBadge } from "@/components/ui";
import { getAdminClient } from "@/lib/supabase/admin";

export default async function AdminAdsPage() {
  const { data: ads } = await getAdminClient().from("ads").select("id, title, status, created_at, shops(name)").is("deleted_at", null).order("created_at", { ascending: false });
  return <section className="dashboard-section"><p className="eyebrow">Moderation</p><h1>โฆษณา</h1><div className="data-list">{ads?.map((ad) => <article className="data-row" key={ad.id}><div><h2>{ad.title}</h2><p>{(ad.shops as { name?: string } | null)?.name ?? "ไม่พบร้าน"} · {new Date(ad.created_at).toLocaleDateString("th-TH")}</p></div><div className="inline-actions"><StatusBadge tone={ad.status === "active" ? "success" : ad.status === "rejected" ? "danger" : "warning"}>{ad.status}</StatusBadge><Link className="button button-ghost" href={`/admin/ads/${ad.id}`}>ตรวจสอบ</Link></div></article>)}</div></section>;
}
