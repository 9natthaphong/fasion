import type { Metadata } from "next";
import Link from "next/link";
import { AdCard } from "@/components/ad-card";
import { getPublicAds, getPublicCategories } from "@/lib/catalog";

export const metadata: Metadata = { title: "ค้นหาสไตล์" };

export default async function DiscoverPage() {
  const [ads, categories] = await Promise.all([getPublicAds(), getPublicCategories()]);
  return (
    <div className="container">
      <header className="content-hero">
        <p className="eyebrow">Sponsored discovery</p>
        <h1>ค้นหาสไตล์จากร้านค้า</h1>
        <p>
          รายการในหน้านี้เป็นโฆษณาจากร้านค้า ไม่ใช่ผลลัพธ์จาก AI Stylist
          เลือกหมวดเพื่อดูชิ้นที่ตรงกับสิ่งที่กำลังหา
        </p>
      </header>
      <nav className="filter-row" aria-label="กรองตามหมวดหมู่">
        <Link href="/discover" className="filter-pill" aria-current="page">
          ทั้งหมด
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
      <section className="section" style={{ paddingTop: 32 }}>
        <div className="ad-grid">
          {ads.map((ad, index) => (
            <AdCard ad={ad} key={ad.id} priority={index < 4} />
          ))}
        </div>
      </section>
    </div>
  );
}
