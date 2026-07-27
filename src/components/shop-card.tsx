import Image from "next/image";
import Link from "next/link";
import type { Shop } from "@/lib/types";
import { DemoBadge } from "@/components/ui";

export function ShopCard({ shop }: { shop: Shop }) {
  return (
    <article className="shop-card">
      <Link href={`/shops/${shop.slug}`} className="shop-image-wrap">
        <Image
          src={shop.cover_path ?? "/demo/look-sand.svg"}
          alt={`ภาพบรรยากาศร้าน ${shop.name}`}
          width={900}
          height={600}
          className="shop-image"
        />
        {shop.is_demo ? <DemoBadge /> : null}
      </Link>
      <div className="shop-card-body">
        <Image
          src={shop.logo_path ?? "/demo/shop-quiet.svg"}
          alt=""
          width={48}
          height={48}
          className="shop-logo"
        />
        <div>
          <Link href={`/shops/${shop.slug}`} className="ad-title">
            {shop.name}
          </Link>
          <p>{shop.description}</p>
        </div>
      </div>
    </article>
  );
}

