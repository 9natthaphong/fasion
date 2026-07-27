import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, CheckCircle2, ArrowUpRight } from "lucide-react";
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
      {/* 2. Editorial Fashion Hero */}
      <section className="pt-8 pb-16 border-b border-line bg-background">
        <div className="container grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs tracking-widest text-muted uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-olive"></span>
              <span>AI Fashion Assistant — FitToday</span>
            </div>
            
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal leading-[1.1] text-charcoal">
              วันนี้จะไปไหน?
            </h1>
            
            <p className="text-base sm:text-lg text-muted max-w-xl leading-relaxed">
              ให้ AI ช่วยคิดชุดที่เหมาะกับกิจกรรม อากาศ และสไตล์ของคุณ
              เลือกทิศทางที่ลงตัวที่สุด พร้อมแยกคำแนะนำที่เป็นกลางออกจากโฆษณาของร้านค้าอย่างชัดเจน
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <Link href="/ai-stylist" className="px-6 py-3.5 bg-charcoal text-white hover:bg-black font-medium text-sm rounded-none transition-colors flex items-center gap-2">
                <span>เริ่มเลือกชุดสำหรับวันนี้</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/discover" className="px-6 py-3.5 border border-line text-charcoal hover:bg-paper font-medium text-sm rounded-none transition-colors flex items-center gap-1.5">
                <span>ดูคอลเลกชันจากร้านค้า</span>
                <ArrowUpRight className="w-4 h-4 text-muted" />
              </Link>
            </div>

            <div className="pt-4 flex items-center gap-3 text-xs text-muted border-t border-line/60 max-w-lg">
              <ShieldCheck className="w-4 h-4 text-olive shrink-0" />
              <span>AI Neutrality Guarantee — คำแนะนำ AI ประมวลผลอย่างเป็นกลาง ไม่ขายอันดับสปอนเซอร์</span>
            </div>
          </div>

          <div className="lg:col-span-6 grid grid-cols-12 gap-3 items-end">
            <div className="col-span-7 space-y-2">
              <div className="aspect-[3/4] relative bg-paper overflow-hidden border border-line">
                <Image
                  src="/demo-assets/hero-lookbook.jpg"
                  alt="ภาพแต่งกายลินินโทนธรรมชาติสำหรับอากาศเมืองไทย"
                  fill
                  sizes="(max-width: 1024px) 60vw, 35vw"
                  priority
                  className="object-cover"
                />
              </div>
              <p className="text-[11px] font-mono text-muted tracking-tight">01 · Summer Linen Lookbook</p>
            </div>
            <div className="col-span-5 space-y-2">
              <div className="aspect-[3/4] relative bg-paper overflow-hidden border border-line">
                <Image
                  src="/demo-assets/hero-lookbook-2.jpg"
                  alt="สไตล์มินิมอลสำหรับวันทำงานและคาเฟ่"
                  fill
                  sizes="(max-width: 1024px) 40vw, 20vw"
                  priority
                  className="object-cover"
                />
              </div>
              <p className="text-[11px] font-mono text-muted tracking-tight">02 · Everyday Minimal</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Activity Index */}
      <section className="py-12 border-b border-line bg-paper">
        <div className="container">
          <SectionHeading
            eyebrow="Occasion & Category Index"
            title="เริ่มจากสิ่งที่อยากใส่ในวันนี้"
            body="เลือกหมวดสไตล์ที่ใกล้เคียงกับโอกาสใช้งานของคุณ เพื่อดูไอเดียจากร้านค้าอิสระ"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 border-t border-l border-line bg-background">
            {categories.slice(0, 10).map((category, index) => (
              <Link
                className="p-5 border-r border-b border-line hover:bg-paper transition-colors group flex flex-col justify-between min-h-[110px]"
                href={`/categories/${category.slug}`}
                key={category.id}
              >
                <span className="font-mono text-xs text-muted group-hover:text-charcoal">{String(index + 1).padStart(2, "0")}</span>
                <strong className="font-medium text-sm group-hover:text-charcoal transition-colors">{category.name_th}</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Recent Sponsored Advertisements */}
      <section className="py-16 border-b border-line">
        <div className="container">
          <SectionHeading
            eyebrow="Sponsored Editorial Gallery"
            title="ชุดและคอลเลกชันล่าสุด"
            body="รายการในส่วนนี้เป็นโฆษณาที่ผ่านการอนุมัติจากร้านค้าอิสระ ทุกชิ้นเชื่อมต่อไปยัง Shopee ร้านค้าโดยตรง"
            action={{ href: "/discover", label: "ดูทั้งหมด" }}
          />
          <div className="ad-grid">
            {ads.slice(0, 8).map((ad, index) => (
              <AdCard ad={ad} key={ad.id} priority={index < 2} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. Featured Independent Shops */}
      <section className="py-16 border-b border-line bg-paper">
        <div className="container">
          <SectionHeading
            eyebrow="Curated Brands"
            title="ร้านค้าอิสระบน FitToday"
            body="สำรวจหน้าร้านค้าตัวอย่างเพื่อดูคอลเลกชันและสไตล์ที่เป็นเอกลักษณ์"
          />
          <div className="shop-grid">
            {shops.map((shop) => (
              <ShopCard shop={shop} key={shop.id} />
            ))}
          </div>
        </div>
      </section>

      {/* 6. AI Neutrality Standard */}
      <section className="py-16 border-b border-line">
        <div className="container">
          <div className="grid lg:grid-cols-12 gap-10 items-stretch bg-paper p-8 sm:p-12 border border-line">
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              <div>
                <Eyebrow>Neutral AI Styling Guarantee</Eyebrow>
                <h2 className="font-serif text-3xl sm:text-4xl font-normal mt-3 mb-4 leading-tight text-charcoal">
                  ความเที่ยงตรงและเป็นกลางของระบบคำแนะนำ
                </h2>
                <p className="text-muted leading-relaxed text-sm sm:text-base">
                  อัลกอริทึม AI Stylist คำนวณชุดแต่งกายจากปัจจัยจริงของผู้ใช้ ได้แก่ โอกาส อากาศ รูปร่าง และงบประมาณ
                  โดยไม่มีการนำค่าโฆษณาหรือสปอนเซอร์มาแทรกแซงในผลลัพธ์คำแนะนำเด็ดขาด
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-line">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-charcoal shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-sm font-medium text-charcoal">คำแนะนำตรงโอกาส</strong>
                    <span className="text-xs text-muted">วิเคราะห์ความเหมาะสมกับสภาพอากาศเมืองไทยและกาลเทศะ</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-charcoal shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-sm font-medium text-charcoal">เคารพความเป็นส่วนตัว</strong>
                    <span className="text-xs text-muted">ไม่ตัดสินรูปร่าง ไซซ์เสื้อผ้า และให้ผู้ใช้ควบคุมการบันทึกสัดส่วน</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-line pt-6 lg:pt-0 lg:pl-10 flex flex-col justify-center space-y-4">
              <div className="p-6 border border-line bg-background">
                <span className="font-mono text-xs text-muted block mb-1">01 / Pure Advice</span>
                <h3 className="font-serif text-xl font-normal mb-2">แยกพื้นที่โฆษณาชัดเจน</h3>
                <p className="text-xs text-muted leading-relaxed">
                  โฆษณาจากร้านค้าจำกัดอยู่เฉพาะในส่วน Discover และ Sponsored Edit เพื่อไม่ให้กระทบต่อความน่าเชื่อถือของ AI
                </p>
              </div>
              <div className="p-6 border border-line bg-background">
                <span className="font-mono text-xs text-muted block mb-1">02 / 3 Distinct Directions</span>
                <h3 className="font-serif text-xl font-normal mb-2">3 ทิศทางสไตล์ให้เลือก</h3>
                <p className="text-xs text-muted leading-relaxed">
                  ให้คำแนะนำแบบ Safe (เพลย์เซฟ), Elevated (ยกระดับ), และ Comfortable (เน้นความสบาย) ทุกครั้งที่ค้นหา
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7 & 8. Merchant Platform Statement */}
      <section className="py-16 bg-charcoal text-white">
        <div className="container grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <span className="text-xs tracking-widest text-muted uppercase">Merchant Partnership</span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal leading-tight">
              เชื่อมต่อแบรนด์ของคุณสู่ผู้ใช้ที่กำลังค้นหาสไตล์
            </h2>
            <p className="text-muted text-sm sm:text-base leading-relaxed max-w-xl">
               FitToday มอบพื้นที่โฆษณาแฟชั่นที่ตรงไปตรงมา วัดผลได้จริงด้วยยอด Impression, Click และ CTR 
              พร้อมพาผู้ซื้อไปยังร้านค้าของคุณบน Shopee โดยตรง
            </p>
            <div className="pt-2">
              <Link href="/register/merchant" className="px-6 py-3.5 bg-white text-charcoal hover:bg-paper font-medium text-sm rounded-none transition-colors inline-flex items-center gap-2">
                <span>สมัครเปิดหน้าร้านบน FitToday</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4 border-l border-white/10 pl-6 lg:pl-10">
            <div className="space-y-1">
              <span className="font-mono text-xs text-white/50">STEP 01</span>
              <h3 className="text-base font-medium text-white">สร้างร้านและลงโฆษณา</h3>
              <p className="text-xs text-white/70">ใส่รูปภาพสินค้า คำบรรยาย สไตล์ และปลายทาง Shopee</p>
            </div>
            <div className="space-y-1 pt-3 border-t border-white/10">
              <span className="font-mono text-xs text-white/50">STEP 02</span>
              <h3 className="text-base font-medium text-white">ผ่านการตรวจสอบมาตรฐาน</h3>
              <p className="text-xs text-white/70">ทีมงานอนุมัติร้านค้าและรายการโฆษณาเพื่อความมั่นใจของผู้ใช้</p>
            </div>
            <div className="space-y-1 pt-3 border-t border-white/10">
              <span className="font-mono text-xs text-white/50">STEP 03</span>
              <h3 className="text-base font-medium text-white">วิเคราะห์ผลตอบรับ Real-time</h3>
              <p className="text-xs text-white/70">ดูสถิติ Impression, Click และ CTR ย้อนหลังใน Merchant Studio</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
