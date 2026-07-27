import { notFound } from "next/navigation";
import { AdminActionForm } from "@/components/admin-action-form";
import { StatusBadge } from "@/components/ui";
import { isSupabaseAdminConfigured } from "@/lib/env";
import { getAdminClient } from "@/lib/supabase/admin";
import type { FashionTag } from "@/lib/types";

export default async function AdminAdDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseAdminConfigured()) {
    return (
      <section className="dashboard-section narrow">
        <p className="eyebrow">Review ad</p>
        <h1>รายละเอียดโฆษณา</h1>
        <div className="config-notice" role="status">
          <strong>Configuration missing</strong>
          <p>ต้องตั้งค่า SUPABASE_SECRET_KEY บน server เพื่ออนุมัติหรือตรวจสอบโฆษณา</p>
        </div>
      </section>
    );
  }

  const { id } = await params;
  const { data: ad } = await getAdminClient()
    .from("ads")
    .select("*, shops(name, status, subscription_status), ad_fashion_tags(fashion_tags(*))")
    .eq("id", id)
    .maybeSingle();

  if (!ad) notFound();

  const host = (() => {
    try {
      return new URL(ad.destination_url).hostname;
    } catch {
      return "URL ไม่ถูกต้อง";
    }
  })();

  const fashionTags: FashionTag[] = (ad.ad_fashion_tags || [])
    .map((item: { fashion_tags: unknown }) => item.fashion_tags as FashionTag)
    .filter(Boolean);

  return (
    <section className="dashboard-section narrow space-y-6">
      <p className="eyebrow">Review ad</p>
      <h1>{ad.title}</h1>
      <StatusBadge>{ad.status}</StatusBadge>

      <dl className="detail-list space-y-3">
        <div>
          <dt>ร้าน</dt>
          <dd>{Array.isArray(ad.shops) ? ad.shops[0]?.name : ad.shops?.name}</dd>
        </div>

        <div>
          <dt>รายละเอียด</dt>
          <dd>{ad.description}</dd>
        </div>

        {fashionTags.length > 0 && (
          <div>
            <dt>แท็กแฟชั่นที่ร้านเลือก (Taxonomy)</dt>
            <dd>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {fashionTags.map((tag: FashionTag) => (
                  <span key={tag.id} className="px-2 py-0.5 bg-paper border border-line text-xs font-medium text-charcoal">
                    {tag.tag_type}: {tag.name_th} ({tag.name_en})
                  </span>
                ))}
              </div>
            </dd>
          </div>
        )}

        <div>
          <dt>ปลายทาง</dt>
          <dd className="break-text">
            {ad.destination_url}
            <br />
            <small>Domain: {host}</small>
          </dd>
        </div>

        <div>
          <dt>ช่วงเผยแพร่</dt>
          <dd>
            {ad.starts_at ? new Date(ad.starts_at).toLocaleString("th-TH") : "ทันที"} —{" "}
            {ad.ends_at ? new Date(ad.ends_at).toLocaleString("th-TH") : "ไม่กำหนด"}
          </dd>
        </div>
      </dl>

      <AdminActionForm
        endpoint={`/api/admin/ads/${id}`}
        actions={[
          { value: "approve", label: "อนุมัติโฆษณา" },
          { value: "reject", label: "ปฏิเสธ", tone: "danger" },
          { value: "pause", label: "ซ่อน / Pause", tone: "danger" },
        ]}
      />
    </section>
  );
}
