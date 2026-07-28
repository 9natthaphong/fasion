import Image from "next/image";
import Link from "next/link";
import { adTypeLabel, formatNumber } from "@/lib/format";
import type { Ad } from "@/lib/types";
import { DemoBadge } from "@/components/ui";
import { ImpressionBeacon } from "@/components/impression-beacon";

export function AdCard({ ad, priority = false }: { ad: Ad; priority?: boolean }) {
  return (
    <article className="ad-card" data-ad-id={ad.id}>
      <ImpressionBeacon adId={ad.id} pageContext="ad_card" disabled={ad.is_demo} />
      <Link href={`/ads/${ad.slug}`} className="ad-image-wrap">
        <Image
          src={ad.cover_image_path ?? "/demo/look-olive.svg"}
          alt={ad.image_alt ?? ad.title}
          width={720}
          height={900}
          priority={priority}
          className="ad-image"
        />
        <span className="sponsored-label">โฆษณา</span>
        {ad.is_demo ? <DemoBadge /> : null}
      </Link>
      <div className="ad-card-body">
        <div className="meta-row">
          <span>{adTypeLabel(ad.ad_type)}</span>
          <span>{ad.shop?.name}</span>
        </div>
        <Link href={`/ads/${ad.slug}`} className="ad-title">
          {ad.title}
        </Link>
        <div className="ad-card-footer">
          <strong>{ad.price_text}</strong>
          <span>
            {formatNumber(ad.likes ?? 0)} ถูกใจ · {formatNumber(ad.clicks ?? 0)} คลิก
          </span>
        </div>
      </div>
    </article>
  );
}
