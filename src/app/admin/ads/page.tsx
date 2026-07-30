import Link from "next/link";
import { StatusBadge } from "@/components/ui";
import { isSupabaseAdminConfigured } from "@/lib/env";
import { getAdminClient } from "@/lib/supabase/admin";
import { resolveAdCoverUrl } from "@/lib/assets";
import { AdminAssetImage } from "@/components/admin/admin-asset-image";
import { ImageIcon } from "lucide-react";

export default async function AdminAdsPage() {
  if (!isSupabaseAdminConfigured()) {
    return (
      <section className="dashboard-section">
        <p className="eyebrow">Moderation</p>
        <h1>โฆษณา</h1>
        <div className="config-notice" role="status">
          <strong>Configuration missing</strong>
          <p>ต้องตั้งค่า SUPABASE_SECRET_KEY บน server เพื่อดูรายการโฆษณาที่รออนุมัติ</p>
        </div>
      </section>
    );
  }

  const { data: ads } = await getAdminClient()
    .from("ads")
    .select("id, title, status, created_at, cover_image_path, shops(name)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <section className="dashboard-section space-y-6">
      <div>
        <p className="eyebrow">Moderation</p>
        <h1 className="text-3xl font-serif">รายการโฆษณา</h1>
      </div>

      <div className="data-list space-y-3">
        {ads?.map((ad) => {
          const shopData = Array.isArray(ad.shops) ? ad.shops[0] : ad.shops;
          const shopName = (shopData as { name?: string } | null)?.name;
          const resolvedCover = resolveAdCoverUrl(ad.cover_image_path);

          return (
            <article className="data-row flex flex-wrap items-center justify-between gap-4 p-4 border border-line bg-paper" key={ad.id}>
              <div className="flex items-center gap-4 min-w-0">
                {/* Cover Thumbnail */}
                <div className="relative w-14 h-14 bg-charcoal border border-line shrink-0 overflow-hidden flex items-center justify-center">
                  {resolvedCover ? (
                    <AdminAssetImage
                      src={resolvedCover}
                      alt={ad.title}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-muted" />
                  )}
                </div>

                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-charcoal truncate">{ad.title}</h2>
                  <p className="text-xs text-muted">
                    {shopName ?? "ไม่พบร้าน"} · สร้างเมื่อ {new Date(ad.created_at).toLocaleDateString("th-TH")}
                  </p>
                </div>
              </div>

              <div className="inline-actions flex items-center gap-3">
                <StatusBadge tone={ad.status === "active" ? "success" : ad.status === "rejected" ? "danger" : "warning"}>
                  {ad.status}
                </StatusBadge>
                <Link className="button button-ghost text-xs py-2 px-3 min-h-[44px] flex items-center" href={`/admin/ads/${ad.id}`}>
                  ตรวจสอบ
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
