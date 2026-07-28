import { notFound } from "next/navigation";
import Image from "next/image";
import { AdminActionForm } from "@/components/admin-action-form";
import { StatusBadge } from "@/components/ui";
import { isSupabaseAdminConfigured } from "@/lib/env";
import { getAdminClient } from "@/lib/supabase/admin";
import { resolveShopAssetUrl } from "@/lib/assets";
import { Store, Globe, Calendar, User } from "lucide-react";

export default async function AdminShopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseAdminConfigured()) {
    return (
      <section className="dashboard-section narrow">
        <p className="eyebrow">Review shop</p>
        <h1>รายละเอียดร้านค้า</h1>
        <div className="config-notice" role="status">
          <strong>Configuration missing</strong>
          <p>ต้องตั้งค่า SUPABASE_SECRET_KEY บน server เพื่ออนุมัติหรือตรวจสอบร้านค้า</p>
        </div>
      </section>
    );
  }

  const { id } = await params;
  const { data: shop } = await getAdminClient()
    .from("shops")
    .select("*, profiles!shops_owner_id_fkey(display_name)")
    .eq("id", id)
    .maybeSingle();

  if (!shop) notFound();

  const resolvedLogo = resolveShopAssetUrl(shop.logo_path);
  const resolvedCover = resolveShopAssetUrl(shop.cover_path);
  const rawProfile = Array.isArray(shop.profiles) ? shop.profiles[0] : shop.profiles;
  const ownerName = (rawProfile as { display_name?: string | null } | null)?.display_name;

  return (
    <section className="dashboard-section space-y-6">
      <div>
        <p className="eyebrow">Review shop</p>
        <h1 className="text-3xl font-serif">{shop.name}</h1>
      </div>

      {/* Shop Cover Banner & Logo Header */}
      <div className="border border-line bg-paper overflow-hidden">
        {resolvedCover ? (
          <div className="relative w-full h-48 bg-charcoal">
            <Image
              src={resolvedCover}
              alt={`${shop.name} cover`}
              fill
              sizes="(max-width: 1024px) 100vw, 70vw"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-24 bg-ivory border-b border-line flex items-center justify-center text-xs text-muted">
            ไม่มีรูปภาพปกหลังร้าน (No Shop Cover)
          </div>
        )}

        <div className="p-6 flex flex-wrap items-end justify-between gap-4 -mt-10 sm:-mt-12 relative z-10">
          <div className="flex items-end gap-4">
            <div className="relative w-20 h-20 rounded-full bg-background border-2 border-line shadow-lg overflow-hidden shrink-0 flex items-center justify-center">
              {resolvedLogo ? (
                <Image
                  src={resolvedLogo}
                  alt={shop.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <Store className="w-10 h-10 text-olive" />
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold text-charcoal">{shop.name}</h2>
              <p className="text-xs text-muted font-mono">Slug: {shop.slug}</p>
            </div>
          </div>

          <div className="badge-row flex flex-wrap gap-2">
            <StatusBadge tone={shop.status === "approved" ? "success" : "warning"}>
              สถานะร้าน: {shop.status}
            </StatusBadge>
            <StatusBadge tone={shop.subscription_status === "active" ? "success" : "neutral"}>
              Subscription: {shop.subscription_status}
            </StatusBadge>
          </div>
        </div>
      </div>

      {/* Detail Metadata */}
      <div className="border border-line bg-background p-6 space-y-4">
        <h3 className="text-sm font-semibold text-charcoal border-b border-line pb-2">ข้อมูลรายละเอียดร้าน</h3>
        <dl className="detail-list grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <dt className="flex items-center gap-1.5 text-muted">
              <User className="w-3.5 h-3.5 text-olive" />
              เจ้าของร้าน (Owner)
            </dt>
            <dd className="font-medium text-charcoal pt-1">{ownerName || "—"}</dd>
          </div>

          <div>
            <dt className="flex items-center gap-1.5 text-muted">
              <Globe className="w-3.5 h-3.5 text-olive" />
              Shopee Store URL
            </dt>
            <dd className="break-all pt-1 font-mono text-[11px]">
              {shop.shopee_url ? (
                <a href={shop.shopee_url} target="_blank" rel="noreferrer" className="text-olive hover:underline">
                  {shop.shopee_url}
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>

          <div>
            <dt className="flex items-center gap-1.5 text-muted">
              <Calendar className="w-3.5 h-3.5 text-olive" />
              Subscription หมดอายุ
            </dt>
            <dd className="font-mono pt-1">
              {shop.subscription_ends_at ? new Date(shop.subscription_ends_at).toLocaleString("th-TH") : "ไม่กำหนด"}
            </dd>
          </div>

          <div className="md:col-span-2">
            <dt className="text-muted">รายละเอียดร้าน</dt>
            <dd className="pt-1 text-charcoal whitespace-pre-line">{shop.description || "—"}</dd>
          </div>
        </dl>
      </div>

      {/* Moderation Action Form */}
      <div className="border border-line bg-paper p-6 space-y-3">
        <h3 className="text-sm font-semibold text-charcoal">ดำเนินการการตรวจสอบร้านค้า</h3>
        <AdminActionForm
          endpoint={`/api/admin/shops/${id}`}
          withDate
          actions={[
            { value: "approve", label: "อนุมัติร้านค้า (Approve)" },
            { value: "activate_subscription", label: "เปิดใช้งาน Subscription" },
            { value: "expire_subscription", label: "ปิดใช้งาน Subscription" },
            { value: "reject", label: "ปฏิเสธ (Reject)", tone: "danger" },
            { value: "suspend", label: "ระงับการใช้งาน (Suspend)", tone: "danger" },
          ]}
        />
      </div>
    </section>
  );
}
