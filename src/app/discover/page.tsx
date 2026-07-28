import type { Metadata } from "next";
import Link from "next/link";
import { AdCard } from "@/components/ad-card";
import { EditorialPageIntro } from "@/components/ui";
import { getPublicAds, getPublicCategories } from "@/lib/catalog";
import { Info } from "lucide-react";

export const metadata: Metadata = { title: "ค้นหาสไตล์และร้านค้า | FitToday" };

export default async function DiscoverPage() {
  const [ads, categories] = await Promise.all([getPublicAds(), getPublicCategories()]);

  return (
    <div className="editorial-page-shell editorial-page-sponsored">
      <div className="container space-y-10 py-8">
        <header className="editorial-page-header">
          <EditorialPageIntro
            tone="sponsored"
            eyebrow="SPONSORED LOOKBOOK / DISCOVERY"
            title="ค้นหาสไตล์จากร้านค้าอิสระ"
            body="สำรวจชุดและเสื้อผ้าจากร้านค้าพันธมิตร ทุกรายการในหน้านี้เป็นโฆษณาที่ติดป้ายชัดเจน และไม่กระทบคำแนะนำจาก AI Stylist"
            aside={
              <div className="editorial-disclosure">
                <Info aria-hidden="true" />
                <span>โฆษณาโปร่งใส แยกจาก AI Advice 100%</span>
              </div>
            }
          />

          {/* Category navigation */}
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
    </div>
  );
}
