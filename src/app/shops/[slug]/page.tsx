import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AdCard } from "@/components/ad-card";
import { DemoBadge } from "@/components/ui";
import { ShopViewBeacon } from "@/components/shop-view-beacon";
import { getPublicAds, getPublicShop } from "@/lib/catalog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const shop = await getPublicShop((await params).slug);
  return { title: shop?.name ?? "ร้านค้า" };
}

export default async function ShopPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const shop = await getPublicShop((await params).slug);
  if (!shop) notFound();
  const shopAds = (await getPublicAds()).filter((ad) => ad.shop_id === shop.id);

  return (
    <div className="container">
      <ShopViewBeacon shopId={shop.id} disabled={shop.is_demo} />
      <section className="shop-hero">
        <div className="shop-cover">
          <Image
            src={shop.cover_path ?? "/demo/look-sand.svg"}
            alt={`ภาพหน้าปกร้าน ${shop.name}`}
            width={1600}
            height={700}
            priority
          />
          {shop.is_demo ? <DemoBadge /> : null}
        </div>
        <div className="shop-intro">
          <Image
            src={shop.logo_path ?? "/demo/shop-quiet.svg"}
            alt=""
            width={80}
            height={80}
            className="shop-logo"
          />
          <div>
            <h1>{shop.name}</h1>
            <p>{shop.description}</p>
          </div>
          {shop.is_demo ? <span className="button button-ghost" aria-disabled="true">Demo shop</span> : null}
        </div>
      </section>
      <section className="section">
        <p className="eyebrow">Sponsored by this shop</p>
        <h2 style={{ marginBottom: 28 }}>โฆษณาจากร้าน</h2>
        <div className="ad-grid">
          {shopAds.map((ad) => (
            <AdCard ad={ad} key={ad.id} />
          ))}
        </div>
      </section>
    </div>
  );
}
