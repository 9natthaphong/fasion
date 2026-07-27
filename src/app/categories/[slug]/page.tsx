import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdCard } from "@/components/ad-card";
import { getPublicAds, getPublicCategories } from "@/lib/catalog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = (await getPublicCategories()).find((item) => item.slug === slug);
  return { title: category?.name_th ?? "หมวดหมู่" };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [categories, ads] = await Promise.all([getPublicCategories(), getPublicAds()]);
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();
  const categoryAds = ads.filter((ad) =>
    ad.categories?.some((item) => item.slug === category.slug),
  );

  return (
    <div className="container">
      <header className="content-hero">
        <p className="eyebrow">Category</p>
        <h1>{category.name_th}</h1>
        <p>
          โฆษณาที่จัดอยู่ในหมวด {category.name_th} และผ่านเงื่อนไขการเผยแพร่ของ FitToday
        </p>
      </header>
      <section className="section" style={{ paddingTop: 32 }}>
        <div className="ad-grid">
          {(categoryAds.length ? categoryAds : ads.slice(0, 4)).map((ad) => (
            <AdCard ad={ad} key={ad.id} />
          ))}
        </div>
      </section>
    </div>
  );
}
