import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdCard } from "@/components/ad-card";
import { DemoBadge } from "@/components/ui";
import { ImpressionBeacon } from "@/components/impression-beacon";
import { LikeButton } from "@/components/like-button";
import { getPublicAd, getPublicAds } from "@/lib/catalog";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { Heart } from "lucide-react";
import { adTypeLabel, calculateCtr, formatNumber } from "@/lib/format";
import { PurchaseInfoText } from "@/components/purchase-info-text";
import { resolvePurchaseInfo } from "@/lib/purchase-info";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const ad = await getPublicAd((await params).slug);
  return { title: ad?.title ?? "โฆษณาแฟชั่น" };
}

export default async function AdDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const ad = await getPublicAd((await params).slug);
  if (!ad) notFound();
  const ads = await getPublicAds();
  const user = await getCurrentUser();
  let liked = false;
  if (!ad.is_demo && user?.role === "customer" && isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.from("ad_likes").select("ad_id").eq("ad_id", ad.id).eq("user_id", user.id).maybeSingle();
    liked = Boolean(data);
  }
  const ctr = calculateCtr(ad.clicks ?? 0, ad.impressions ?? 0);
  const purchaseInfo = resolvePurchaseInfo(ad.purchase_info, ad.destination_url);
  const hasReviewedLegacyDestination = Boolean(ad.destination_url && !ad.is_demo);

  return (
    <>
      <div className="container detail-grid">
        <ImpressionBeacon adId={ad.id} pageContext="ad_detail" disabled={ad.is_demo} />
        <div className="detail-media">
          <Image
            src={ad.cover_image_path ?? "/demo/look-olive.svg"}
            alt={ad.image_alt ?? ad.title}
            width={960}
            height={1200}
            priority
          />
          <span className="sponsored-label">โฆษณา</span>
          {ad.is_demo ? <DemoBadge /> : null}
        </div>
        <aside className="detail-panel">
          <p className="eyebrow">{adTypeLabel(ad.ad_type)}</p>
          <h1 className="detail-title">{ad.title}</h1>
          <Link href={`/shops/${ad.shop?.slug}`} className="text-link">
            โดย {ad.shop?.name} ↗
          </Link>
          <p className="detail-description">{ad.description}</p>
          <strong className="detail-price">{ad.price_text}</strong>
          <div className="detail-actions">
            {purchaseInfo ? (
              <div className="purchase-info-block">
                <p className="text-xs text-muted font-mono uppercase mb-1">ช่องทางสั่งซื้อ</p>
                <PurchaseInfoText
                  value={purchaseInfo}
                  className="text-sm text-charcoal whitespace-pre-wrap break-words"
                />
                {hasReviewedLegacyDestination ? (
                  <a className="button button-solid" href={`/go/ad/${ad.id}`}>
                    เปิดช่องทางสั่งซื้อ ↗
                  </a>
                ) : null}
              </div>
            ) : null}
            {ad.is_demo ? (
              <button type="button" className="button button-ghost" disabled>
                <Heart className="w-4 h-4" aria-hidden="true" />
                ถูกใจ
              </button>
            ) : <LikeButton adId={ad.id} initialLiked={liked} />}
          </div>
          <div className="disclosure-box">
            <strong>สนับสนุนโดยร้านค้า</strong>
            <br />
            รายการนี้เป็นโฆษณา ไม่เกี่ยวข้องกับคำแนะนำที่ AI Stylist สร้างให้คุณ
            ข้อมูลตัวอย่างมี {formatNumber(ad.impressions ?? 0)} ครั้งที่มองเห็น,{" "}
            {formatNumber(ad.clicks ?? 0)} คลิก และ CTR {ctr.toFixed(2)}%
          </div>
        </aside>
      </div>
      <section className="section">
        <div className="container">
          <h2 style={{ marginBottom: 28 }}>รายการอื่นจากร้านค้า</h2>
          <div className="ad-grid">
            {ads
              .filter((item) => item.shop_id === ad.shop_id && item.id !== ad.id)
              .slice(0, 4)
              .map((item) => (
                <AdCard ad={item} key={item.id} />
              ))}
          </div>
        </div>
      </section>
    </>
  );
}
