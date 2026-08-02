import Link from "next/link";
import Image from "next/image";
import { StatusBadge } from "@/components/ui";
import { isSupabaseAdminConfigured } from "@/lib/env";
import { getAdminClient } from "@/lib/supabase/admin";
import { resolveShopAssetUrl } from "@/lib/assets";
import { Store } from "lucide-react";

export default async function AdminShopsPage() {
  if (!isSupabaseAdminConfigured()) {
    return (
      <section className="dashboard-section">
        <p className="eyebrow">Moderation</p>
        <h1>ร้านค้า</h1>
        <div className="config-notice" role="status">
          <strong>Configuration missing</strong>
          <p>ต้องตั้งค่า SUPABASE_SECRET_KEY บน server เพื่อดูรายการร้านค้า</p>
        </div>
      </section>
    );
  }

  const { data: shops } = await getAdminClient()
    .from("shops")
    .select("id, name, slug, logo_path, status, subscription_status, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <section className="dashboard-section space-y-6">
      <div>
        <p className="eyebrow">Moderation</p>
        <h1 className="text-3xl font-serif">รายการร้านค้า</h1>
      </div>

      <div className="data-list space-y-3">
        {shops?.map((shop) => {
          const resolvedLogo = resolveShopAssetUrl(shop.logo_path);

          return (
            <article className="data-row flex flex-wrap items-center justify-between gap-4 p-4 border border-line bg-paper" key={shop.id}>
              <div className="flex items-center gap-4 min-w-0 w-full">
                {/* Shop Logo Thumbnail */}
                <div className="relative w-12 h-12 rounded-full bg-ivory border border-line shrink-0 overflow-hidden flex items-center justify-center">
                  {resolvedLogo ? (
                    <Image
                      src={resolvedLogo}
                      alt={shop.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <Store className="w-6 h-6 text-olive" />
                  )}
                </div>

                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-charcoal truncate">{shop.name}</h2>
                  <p className="text-xs text-muted">
                    {shop.slug} · สมัครเมื่อ {new Date(shop.created_at).toLocaleDateString("th-TH")}
                  </p>
                </div>
              </div>

              <div className="inline-actions flex flex-wrap items-center gap-2">
                <StatusBadge tone={shop.status === "approved" ? "success" : shop.status === "rejected" ? "danger" : "warning"}>
                  {shop.status}
                </StatusBadge>
                <StatusBadge tone={shop.subscription_status === "active" ? "success" : "neutral"}>
                  {shop.subscription_status}
                </StatusBadge>
                <Link className="button button-ghost text-xs py-2 px-3 min-h-[44px] flex items-center" href={`/admin/shops/${shop.id}`}>
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
