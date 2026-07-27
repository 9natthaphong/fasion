import { notFound } from "next/navigation";
import { AdminActionForm } from "@/components/admin-action-form";
import { StatusBadge } from "@/components/ui";
import { getAdminClient } from "@/lib/supabase/admin";

export default async function AdminShopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data: shop } = await getAdminClient().from("shops").select("*, profiles!shops_owner_id_fkey(display_name)").eq("id", id).maybeSingle();
  if (!shop) notFound();
  return <section className="dashboard-section narrow"><p className="eyebrow">Review shop</p><h1>{shop.name}</h1><div className="badge-row"><StatusBadge>{shop.status}</StatusBadge><StatusBadge>{shop.subscription_status}</StatusBadge></div><dl className="detail-list"><div><dt>Slug</dt><dd>{shop.slug}</dd></div><div><dt>รายละเอียด</dt><dd>{shop.description || "—"}</dd></div><div><dt>Shopee</dt><dd className="break-text">{shop.shopee_url || "—"}</dd></div><div><dt>Subscription สิ้นสุด</dt><dd>{shop.subscription_ends_at ? new Date(shop.subscription_ends_at).toLocaleString("th-TH") : "ไม่กำหนด"}</dd></div></dl><AdminActionForm endpoint={`/api/admin/shops/${id}`} withDate actions={[{ value: "approve", label: "อนุมัติร้าน" }, { value: "activate_subscription", label: "เปิด subscription" }, { value: "expire_subscription", label: "ปิด subscription" }, { value: "reject", label: "ปฏิเสธ", tone: "danger" }, { value: "suspend", label: "Suspend", tone: "danger" }]} /></section>;
}
