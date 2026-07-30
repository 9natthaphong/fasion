import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AdminActionForm } from "@/components/admin-action-form";
import { StatusBadge } from "@/components/ui";
import { isSupabaseAdminConfigured } from "@/lib/env";
import { getAdminClient } from "@/lib/supabase/admin";
import { resolveAdCoverUrl, resolveAdImageUrl, resolveShopAssetUrl } from "@/lib/assets";
import { ImagePreviewModal } from "@/components/admin/image-preview-modal";
import type { FashionTag } from "@/lib/types";
import { ImageIcon, ExternalLink, Store, Tag } from "lucide-react";

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
  const adminClient = getAdminClient();

  // Fetch ad with shop details, ad_images ordered by sort_order, and fashion tags
  const { data: ad } = await adminClient
    .from("ads")
    .select(`
      *,
      shops(id, name, slug, logo_path, status, subscription_status),
      ad_images(id, storage_path, alt_text, sort_order),
      ad_fashion_tags(fashion_tags(*))
    `)
    .eq("id", id)
    .maybeSingle();

  if (!ad) notFound();

  const rawShop = Array.isArray(ad.shops) ? ad.shops[0] : ad.shops;
  const shopData = rawShop as {
    id: string;
    name: string;
    slug: string;
    logo_path?: string | null;
    status: string;
    subscription_status: string;
  } | null;

  // Resolve cover image and gallery images safely
  const resolvedCoverUrl = resolveAdCoverUrl(ad.cover_image_path);
  const resolvedShopLogoUrl = resolveShopAssetUrl(shopData?.logo_path);

  interface AdImageItem {
    id: string;
    storage_path: string;
    alt_text?: string | null;
    sort_order: number;
  }

  const rawImages: AdImageItem[] = ad.ad_images || [];
  const sortedImages = [...rawImages].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const resolvedGallery = sortedImages
    .map((img) => ({
      ...img,
      resolvedUrl: resolveAdImageUrl(img.storage_path),
    }))
    .filter((img): img is typeof img & { resolvedUrl: string } => Boolean(img.resolvedUrl));

  const totalImageCount = (resolvedCoverUrl ? 1 : 0) + resolvedGallery.length;

  const host = (() => {
    if (!ad.destination_url) return null;
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
    <section className="dashboard-section space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
        <div>
          <p className="eyebrow">ตรวจสอบโดยผู้ดูแล</p>
          <h1 className="text-2xl sm:text-3xl font-serif">{ad.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge tone={ad.status === "active" ? "success" : ad.status === "rejected" ? "danger" : "warning"}>
            {ad.status}
          </StatusBadge>
          <span className="text-xs font-mono text-muted bg-paper px-2 py-1 border border-line">
            {totalImageCount} รูปภาพ
          </span>
        </div>
      </div>

      {/* Editorial Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Imagery Canvas */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Cover Image */}
          <div className="border border-line bg-paper p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-olive font-semibold uppercase flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                รูปหน้าปกหลัก (Cover Image)
              </span>
              {resolvedCoverUrl && (
                <span className="text-[11px] font-mono text-muted">Primary Banner</span>
              )}
            </div>

            {resolvedCoverUrl ? (
              <div className="space-y-2">
                <div className="relative aspect-[4/3] sm:aspect-[16/10] bg-charcoal overflow-hidden border border-line flex items-center justify-center">
                  <Image
                    src={resolvedCoverUrl}
                    alt={ad.image_alt || ad.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    priority
                    className="object-contain"
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted pt-1">
                  <span className="italic">{ad.image_alt || ad.title}</span>
                  <ImagePreviewModal src={resolvedCoverUrl} alt={ad.title} label="Cover Image" />
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-ivory border border-dashed border-line space-y-2">
                <ImageIcon className="w-8 h-8 text-muted mx-auto" />
                <p className="text-xs text-muted">โฆษณานี้ไม่มีรูปหน้าปกหลัก (No Cover Image)</p>
              </div>
            )}
          </div>

          {/* Secondary Ad Images Gallery */}
          <div className="border border-line bg-paper p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-line/60 pb-2">
              <h3 className="text-sm font-semibold text-charcoal flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-olive" />
                <span>รูปภาพโฆษณาประกอบ ({resolvedGallery.length} รูป)</span>
              </h3>
              <span className="text-xs font-mono text-muted">เรียงตาม sort_order</span>
            </div>

            {resolvedGallery.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {resolvedGallery.map((img) => (
                  <div key={img.id} className="border border-line bg-background p-2 space-y-2">
                    <div className="relative aspect-[3/4] bg-charcoal overflow-hidden border border-line flex items-center justify-center">
                      <Image
                        src={img.resolvedUrl}
                        alt={img.alt_text || `Ad image ${img.sort_order}`}
                        fill
                        sizes="(max-width: 640px) 100vw, 25vw"
                        className="object-contain"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono text-muted">ลำดับ #{img.sort_order}</span>
                      </div>
                      <p className="text-xs text-charcoal line-clamp-2">{img.alt_text || "—"}</p>
                      <ImagePreviewModal
                        src={img.resolvedUrl}
                        alt={img.alt_text || `Ad image #${img.sort_order}`}
                        label={`Gallery Image #${img.sort_order}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted py-4 text-center">ไม่มีรูปภาพประกอบเพิ่มเติม</p>
            )}
          </div>
        </div>

        {/* Right Column: Metadata & Action Form */}
        <div className="lg:col-span-5 space-y-6">
          {/* Shop Header Info */}
          {shopData && (
            <div className="border border-line bg-paper p-4 space-y-3">
              <div className="flex items-center gap-3">
                {resolvedShopLogoUrl ? (
                  <Image
                    src={resolvedShopLogoUrl}
                    alt={shopData.name}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover border border-line"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-olive text-white font-serif flex items-center justify-center text-sm font-bold">
                    {shopData.name.slice(0, 1)}
                  </div>
                )}
                <div>
                  <Link href={`/admin/shops/${shopData.id}`} className="text-sm font-semibold text-charcoal hover:underline flex items-center gap-1">
                    <Store className="w-3.5 h-3.5 text-olive" />
                    <span>{shopData.name}</span>
                  </Link>
                  <p className="text-xs text-muted">Slug: {shopData.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-line/60">
                <StatusBadge tone={shopData.status === "approved" ? "success" : "warning"}>
                  ร้าน: {shopData.status}
                </StatusBadge>
                <StatusBadge tone={shopData.subscription_status === "active" ? "success" : "neutral"}>
                  Sub: {shopData.subscription_status}
                </StatusBadge>
              </div>
            </div>
          )}

          {/* Ad Metadata Details */}
          <div className="border border-line bg-background p-4 space-y-4">
            <h3 className="text-sm font-semibold text-charcoal border-b border-line pb-2">รายละเอียดโฆษณา</h3>
            <dl className="detail-list space-y-3 text-xs">
              <div>
                <dt>ประเภทโฆษณา</dt>
                <dd className="font-mono text-olive font-semibold">{ad.ad_type}</dd>
              </div>

              <div>
                <dt>ข้อความราคา</dt>
                <dd>{ad.price_text || "—"}</dd>
              </div>

              <div>
                <dt>คำอธิบาย</dt>
                <dd className="whitespace-pre-line text-charcoal">{ad.description || "—"}</dd>
              </div>

              {fashionTags.length > 0 && (
                <div>
                  <dt>แท็กแฟชั่น (Taxonomy)</dt>
                  <dd>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {fashionTags.map((tag: FashionTag) => (
                        <span key={tag.id} className="px-2 py-0.5 bg-paper border border-line text-[11px] font-medium text-charcoal inline-flex items-center gap-1">
                          <Tag className="w-3 h-3 text-olive" />
                          {tag.name_th}
                        </span>
                      ))}
                    </div>
                  </dd>
                </div>
              )}

              <div className="border-t border-line/60 pt-3">
                <dt className="font-semibold text-charcoal text-xs mb-1">ปลายทางภายนอก</dt>
                <dd className="pt-1">
                  {ad.destination_url ? (
                    <div className="space-y-2 bg-paper p-3 border border-line">
                      <div>
                        <span className="block text-[11px] text-muted font-mono uppercase">URL ปลายทาง:</span>
                        <span className="select-all font-mono text-xs text-charcoal break-all">{ad.destination_url}</span>
                      </div>
                      <div>
                        <span className="block text-[11px] text-muted font-mono uppercase">Hostname:</span>
                        <span className="font-mono text-xs font-semibold text-olive">{host}</span>
                      </div>
                      <div className="pt-1">
                        <a
                          href={ad.destination_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-charcoal text-white hover:bg-olive text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                        >
                          <span>เปิดตรวจสอบในแท็บใหม่</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        </a>
                      </div>
                      <p className="text-[11px] text-warning font-medium pt-1">
                        ลิงก์นี้เป็นเว็บไซต์ภายนอก กรุณาตรวจสอบความสอดคล้องกับโฆษณาก่อนอนุมัติ
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-paper border border-line text-xs text-muted">
                      ร้านค้าไม่ได้ระบุลิงก์ปลายทาง โฆษณานี้จะแสดงโดยไม่มีปุ่มไปยังร้านค้า
                    </div>
                  )}
                </dd>
              </div>

              <div>
                <dt>ช่วงเวลาโฆษณา</dt>
                <dd className="font-mono text-[11px]">
                  {ad.starts_at ? new Date(ad.starts_at).toLocaleString("th-TH") : "เริ่มต้นทันที"}
                  <br />
                  ถึง {ad.ends_at ? new Date(ad.ends_at).toLocaleString("th-TH") : "ไม่มีกำหนดสิ้นสุด"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Moderation Action Form */}
          <div className="border border-line bg-paper p-4 space-y-3">
            <h3 className="text-sm font-semibold text-charcoal">ดำเนินการการตรวจสอบ</h3>
            <p className="text-xs text-muted">ตรวจสอบรูปภาพ รายละเอียด หมวดหมู่ ระยะเวลา และลิงก์ปลายทางก่อนอนุมัติ</p>
            <AdminActionForm
              endpoint={`/api/admin/ads/${id}`}
              actions={[
                { value: "approve", label: "อนุมัติโฆษณา (Approve)" },
                { value: "reject", label: "ปฏิเสธ (Reject)", tone: "danger" },
                { value: "pause", label: "ซ่อน / Pause", tone: "danger" },
              ]}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
