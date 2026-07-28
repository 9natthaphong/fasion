import type { Metadata } from "next";
import Link from "next/link";
import { AdCard } from "@/components/ad-card";
import { getPublicAds, getPublicCategories } from "@/lib/catalog";
import { Compass, Info } from "lucide-react";

export const metadata: Metadata = { title: "ค้นหาสไตล์และร้านค้า | FitToday" };

export default async function DiscoverPage() {
  const [ads, categories] = await Promise.all([getPublicAds(), getPublicCategories()]);

  return (
    <div className="container space-y-10 py-8">
      {/* Editorial Discovery Hero */}
      <header className="border-b border-line pb-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-muted uppercase">
              <Compass className="w-3.5 h-3.5 text-olive" />
              <span>Editorial Lookbook & Discovery</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-normal text-charcoal mt-1">
              ค้นหาสไตล์จากร้านค้าอิสระ
            </h1>
            <p className="text-sm text-muted mt-2 max-w-xl">
              สำรวจชุดและเสื้อผ้าล่าสุดจากร้านค้าพันธมิตร ทุกรายการในหน้านี้เป็นโฆษณาที่ติดป้ายกำกับชัดเจน ไม่กระทบคำแนะนำ AI Stylist
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted border border-line bg-paper p-3 shrink-0">
            <Info className="w-4 h-4 text-olive shrink-0" />
            <span>โฆษณาโปร่งใส แยกจาก AI Advice 100%</span>
          </div>
        </div>

        {/* Category Pills Navigation */}
        <nav className="filter-row pt-4 border-t border-line/60" aria-label="กรองตามหมวดหมู่">
          <Link href="/discover" className="filter-pill active" aria-current="page">
            ทั้งหมด ({ads.length})
          </Link>
          {categories.map((category) => (
            <Link
              href={`/categories/${category.slug}`}
              className="filter-pill"
              key={category.id}
            >
              {category.name_th}
            </Link>
          ))}
        </nav>
      </header>

      {/* Discovery Product Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-normal text-charcoal">รายการล่าสุดทั้งหมด ({ads.length})</h2>
          <span className="text-xs font-mono text-muted uppercase">เรียงตามความสดใหม่</span>
        </div>

        <div className="ad-grid">
          {ads.map((ad, index) => (
            <AdCard ad={ad} key={ad.id} priority={index < 4} />
          ))}
        </div>
      </section>
    </div>
  );
}
