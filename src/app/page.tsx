import Image from "next/image";
import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, Store, CheckCircle2 } from "lucide-react";
import { AdCard } from "@/components/ad-card";
import { ShopCard } from "@/components/shop-card";
import { Eyebrow, SectionHeading } from "@/components/ui";
import { getPublicAds, getPublicCategories, getPublicShops } from "@/lib/catalog";

export default async function HomePage() {
  const [ads, categories, shops] = await Promise.all([
    getPublicAds(8),
    getPublicCategories(),
    getPublicShops(4),
  ]);

  return (
    <>
      {/* 2. Editorial Hero */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <Eyebrow>AI Stylist ภาษาไทย</Eyebrow>
            <h1 className="font-serif leading-tight">
              What to wear,
              <span>วันนี้จะไปไหน?</span>
            </h1>
            <p>
              บอกกิจกรรม อากาศ และสไตล์ที่ชอบ แล้วรับไอเดียแต่งตัว 3 ทางเลือก
              โดยคำแนะนำ AI แยกออกจากโฆษณาของร้านค้าอย่างชัดเจน
            </p>
            <div className="hero-actions">
              <Link href="/ai-stylist" className="button button-solid gap-2">
                <Sparkles className="w-4 h-4" />
                <span>ให้ AI ช่วยเลือกชุด</span>
              </Link>
              <Link href="/discover" className="button button-ghost gap-2">
                <span>ดูสไตล์จากร้านค้า</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="hero-art rounded-lg border border-line">
            <Image
              src="/demo/look-olive.svg"
              alt="ภาพประกอบชุดแฟชั่นมินิมอลโทนมะกอก"
              width={800}
              height={1000}
              priority
              className="object-cover"
            />
            <div className="hero-note rounded-md">
              <strong className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-olive" />
                <span>คำแนะนำที่เป็นกลาง</span>
              </strong>
              <span>เงินโฆษณาไม่มีผลต่อผลลัพธ์จาก AI Stylist</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Popular Categories */}
      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Browse by mood"
            title="เริ่มจากสิ่งที่อยากใส่"
            body="เลือกหมวดที่ใกล้กับวันนี้ แล้วดูไอเดียจากร้านค้าที่ผ่านการอนุมัติ"
          />
          <div className="category-strip rounded-lg overflow-hidden">
            {categories.slice(0, 10).map((category, index) => (
              <Link
                className="category-tile group"
                href={`/categories/${category.slug}`}
                key={category.id}
              >
                <span className="font-mono text-xs text-muted group-hover:text-olive">{String(index + 1).padStart(2, "0")}</span>
                <strong className="font-medium group-hover:text-olive transition-colors">{category.name_th}</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Recent Sponsored Advertisements */}
      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Sponsored edit"
            title="ชุดและคอลเลกชันล่าสุด"
            body="พื้นที่นี้เป็นโฆษณาจากร้านค้า ทุกชิ้นติดป้ายชัดเจนและพาไปซื้อบน Shopee ภายนอก"
            action={{ href: "/discover", label: "ดูทั้งหมด" }}
          />
          <div className="ad-grid">
            {ads.slice(0, 8).map((ad, index) => (
              <AdCard ad={ad} key={ad.id} priority={index < 2} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. Featured Shops */}
      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Independent stores"
            title="ร้านค้าที่น่าสนใจ"
            body="ร้านตัวอย่างไม่มีแบรนด์จริงและใช้เพื่อแสดงประสบการณ์ของ MVP"
          />
          <div className="shop-grid">
            {shops.map((shop) => (
              <ShopCard shop={shop} key={shop.id} />
            ))}
          </div>
        </div>
      </section>

      {/* 6. Explanation of AI Stylist Neutrality */}
      <section className="section">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-8 items-center bg-paper p-8 md:p-12 rounded-xl border border-line">
            <div>
              <Eyebrow>Neutrality & Transparency</Eyebrow>
              <h2 className="font-serif text-3xl md:text-4xl font-normal my-3">คำแนะนำ AI ที่เป็นกลาง 100%</h2>
              <p className="text-muted leading-relaxed mb-6">
                ระบบ AI Stylist ประมวลผลจากกิจกรรม อากาศ และความชอบของคุณโดยเฉพาะ
                ไม่มีการสอดไส้สินค้าสปอนเซอร์หรือนำเงินโฆษณามามีผลต่อการเลือกชุด
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-olive shrink-0" />
                  <span className="text-sm font-medium">คำแนะนำเน้นความสบายและโอกาสใช้งานจริง</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-olive shrink-0" />
                  <span className="text-sm font-medium">ไม่มีการวิพากษ์วิจารณ์รูปร่างหรือไซซ์ผู้ใช้</span>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="p-5 border border-line rounded-lg bg-background">
                <div className="flex items-center gap-3 mb-1">
                  <ShieldCheck className="w-5 h-5 text-olive" />
                  <h3 className="font-medium text-base">แยกโฆษณาออกจาก AI</h3>
                </div>
                <p className="text-xs text-muted">โฆษณาจากร้านค้าจะแสดงในหน้า Discover เท่านั้น ไม่ปะปนในผลลัพธ์ AI</p>
              </div>
              <div className="p-5 border border-line rounded-lg bg-background">
                <div className="flex items-center gap-3 mb-1">
                  <Sparkles className="w-5 h-5 text-olive" />
                  <h3 className="font-medium text-base">3 สไตล์ 3 ทางเลือก</h3>
                </div>
                <p className="text-xs text-muted">ทิศทาง Safe, Elevated, และ Comfortable ให้เลือกตามอารมณ์ของคุณ</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7 & 8. Merchant Advertising Explanation & Merchant CTA */}
      <section className="section">
        <div className="container merchant-cta rounded-xl">
          <div>
            <Eyebrow>For merchants</Eyebrow>
            <h2 className="font-serif">เปิดพื้นที่ให้คอลเลกชันของคุณถูกค้นพบ</h2>
            <p className="mb-6">
              สร้างโปรไฟล์ร้าน ลงโฆษณา ใส่ลิงก์ Shopee และดูยอดชม ถูกใจ คลิก
              และ CTR ได้ในหน้าเดียวด้วยระบบการวัดผลที่ตรงไปตรงมา
            </p>
            <Link className="button flex items-center gap-2" href="/register/merchant">
              <Store className="w-4 h-4" />
              <span>สมัครเป็นร้านค้า</span>
            </Link>
          </div>
          <div className="editorial-list">
            <div className="editorial-step">
              <div>
                <strong className="block text-white font-medium mb-1">1. สร้างร้านค้า & ดราฟต์โฆษณา</strong>
                <span className="text-xs text-olive-pale">ลงข้อมูลสินค้า พร้อมลิงก์ Shopee และรูปภาพ</span>
              </div>
            </div>
            <div className="editorial-step">
              <div>
                <strong className="block text-white font-medium mb-1">2. ตรวจสอบความถูกต้อง</strong>
                <span className="text-xs text-olive-pale">ทีมงานตรวจสอบมาตรฐานและอนุมัติร้านค้า</span>
              </div>
            </div>
            <div className="editorial-step">
              <div>
                <strong className="block text-white font-medium mb-1">3. เผยแพร่ & ติดตาม Analytics</strong>
                <span className="text-xs text-olive-pale">ติดตามยอด Impression, Click และ CTR แบบ Real-time</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
