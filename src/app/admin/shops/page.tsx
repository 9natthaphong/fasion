import Link from "next/link";
import { StatusBadge } from "@/components/ui";
import { isSupabaseAdminConfigured } from "@/lib/env";
import { getAdminClient } from "@/lib/supabase/admin";

export default async function AdminShopsPage() {
  if (!isSupabaseAdminConfigured()) {
    return <section className="dashboard-section"><p className="eyebrow">Moderation</p><h1>ร้านค้า</h1><div className="config-notice" role="status"><strong>Configuration missing</strong><p>ต้องตั้งค่า SUPABASE_SECRET_KEY บน server เพื่อดูรายการร้านค้า</p></div></section>;
  }
  const { data: shops } = await getAdminClient().from("shops").select("id, name, slug, status, subscription_status, created_at").is("deleted_at", null).order("created_at", { ascending: false });
  return <section className="dashboard-section"><p className="eyebrow">Moderation</p><h1>ร้านค้า</h1><div className="data-list">{shops?.map((shop) => <article className="data-row" key={shop.id}><div><h2>{shop.name}</h2><p>{shop.slug} · สมัคร {new Date(shop.created_at).toLocaleDateString("th-TH")}</p></div><div className="inline-actions"><StatusBadge tone={shop.status === "approved" ? "success" : shop.status === "rejected" ? "danger" : "warning"}>{shop.status}</StatusBadge><StatusBadge>{shop.subscription_status}</StatusBadge><Link className="button button-ghost" href={`/admin/shops/${shop.id}`}>ตรวจสอบ</Link></div></article>)}</div></section>;
}
