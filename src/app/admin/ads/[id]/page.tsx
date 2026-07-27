import { notFound } from "next/navigation";
import { AdminActionForm } from "@/components/admin-action-form";
import { StatusBadge } from "@/components/ui";
import { getAdminClient } from "@/lib/supabase/admin";

export default async function AdminAdDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: ad } = await getAdminClient().from("ads").select("*, shops(name, status, subscription_status)").eq("id", id).maybeSingle();
  if (!ad) notFound();
  const host = (() => { try { return new URL(ad.destination_url).hostname; } catch { return "URL ไม่ถูกต้อง"; } })();
  return <section className="dashboard-section narrow"><p className="eyebrow">Review ad</p><h1>{ad.title}</h1><StatusBadge>{ad.status}</StatusBadge><dl className="detail-list"><div><dt>ร้าน</dt><dd>{Array.isArray(ad.shops) ? ad.shops[0]?.name : ad.shops?.name}</dd></div><div><dt>รายละเอียด</dt><dd>{ad.description}</dd></div><div><dt>ปลายทาง</dt><dd className="break-text">{ad.destination_url}<br /><small>Domain: {host}</small></dd></div><div><dt>ช่วงเผยแพร่</dt><dd>{ad.starts_at ? new Date(ad.starts_at).toLocaleString("th-TH") : "ทันที"} — {ad.ends_at ? new Date(ad.ends_at).toLocaleString("th-TH") : "ไม่กำหนด"}</dd></div></dl><AdminActionForm endpoint={`/api/admin/ads/${id}`} actions={[{ value: "approve", label: "อนุมัติโฆษณา" }, { value: "reject", label: "ปฏิเสธ", tone: "danger" }, { value: "pause", label: "ซ่อน / Pause", tone: "danger" }]} /></section>;
}
