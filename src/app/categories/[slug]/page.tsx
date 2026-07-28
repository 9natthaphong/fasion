import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AdCard } from "@/components/ad-card";
import { EditorialPageIntro } from "@/components/ui";
import { filterAdsByCategory } from "@/lib/catalog-filter";
import { getPublicAds, getPublicCategories } from "@/lib/catalog";
import { Tag } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = (await getPublicCategories()).find((item) => item.slug === slug);
  return { title: category ? `${category.name_th} | FitToday` : "หมวดหมู่" };
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

  const categoryAds = filterAdsByCategory(ads, category.slug);

  return (
    <div className="editorial-page-shell">
      <div className="container space-y-10 py-8">
        <header className="editorial-page-header">
          <EditorialPageIntro
            eyebrow="EDITORIAL CATEGORY INDEX"
            title={category.name_th}
            body={`เฉพาะคอลเลกชันและโฆษณาที่ผูกกับหมวด ${category.name_th} โดยตรง ไม่มีรายการจากหมวดอื่นมาทดแทนเมื่อข้อมูลว่าง`}
            aside={
              <div className="editorial-count">
                <span>จำนวนรายการ</span>
                <strong>{categoryAds.length}</strong>
              </div>
            }
          />

          {/* Category navigation */}
        <nav className="filter-row pt-4 border-t border-line/60" aria-label="หมวดหมู่อื่นๆ">
          <Link href="/discover" className="filter-pill">
            ทั้งหมด
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className={`filter-pill ${cat.slug === slug ? "active" : ""}`}
              aria-current={cat.slug === slug ? "page" : undefined}
            >
              {cat.name_th}
            </Link>
          ))}
        </nav>
        </header>

      {/* Ads Grid or Explicit Empty State */}
        <section className="space-y-6">
        {categoryAds.length === 0 ? (
          <div className="text-center py-16 border border-line bg-paper space-y-4 p-8">
            <div className="w-12 h-12 rounded-full bg-ivory border border-line mx-auto flex items-center justify-center text-muted">
              <Tag className="w-6 h-6 text-olive" />
            </div>
            <h2 className="font-serif text-2xl font-normal text-charcoal">
              ยังไม่มีโฆษณาในหมวด {category.name_th}
            </h2>
            <p className="text-xs text-muted max-w-md mx-auto">
              โฆษณาในหมวดหมู่นี้จะอัปเดตเมื่อมีร้านค้าลงรายการใหม่ คุณสามารถดูหมวดหมู่อื่นหรือใช้งาน AI Stylist ได้ทันที
            </p>
            <div className="pt-2">
              <Link
                href="/discover"
                className="px-6 py-3 bg-charcoal text-white hover:bg-olive text-xs font-medium inline-flex items-center gap-2 transition-colors"
              >
                <span>ดูสินค้าทุกหมวดหมู่</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="ad-grid">
            {categoryAds.map((ad, index) => (
              <AdCard ad={ad} key={ad.id} priority={index < 4} />
            ))}
          </div>
        )}
        </section>
      </div>
    </div>
  );
}
