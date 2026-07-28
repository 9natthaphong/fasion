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

  const directions = [
    {
      code: "01",
      tag: "SAFE",
      title: "เรียบง่าย ใส่ง่าย",
      desc: "เพลย์เซฟสำหรับทุกวันด้วยโทนสีนิวทรัลและโครงเสื้อที่ใส่สบาย",
      image: "/images/fittoday/direction-safe-editorial-v1.webp",
    },
    {
      code: "02",
      tag: "ELEVATED",
      title: "แต่งขึ้นอีกระดับ",
      desc: "เพิ่มความเนี้ยบด้วยคัตติ้งคม โครงชุดชัด และการจับคู่สีมีระดับ",
      image: "/images/fittoday/direction-elevated-editorial-v1.webp",
    },
    {
      code: "03",
      tag: "COMFORTABLE",
      title: "สบายและคล่องตัว",
      desc: "เน้นเนื้อผ้าระบายอากาศ ทรงหลวมสบาย คล่องตัวตลอดวัน",
      image: "/images/fittoday/direction-comfortable-editorial-v1.webp",
    },
  ];

  return (
    <>
      <section className="home-hero border-b border-line bg-background">
        <div className="container home-hero-grid">
          <div className="home-hero-copy">
            <div className="inline-flex items-center gap-2 text-xs tracking-widest text-muted uppercase font-mono">
              <span className="w-2 h-2 rounded-full bg-olive" aria-hidden="true" />
              <span>FitToday / Bangkok Daily Style</span>
            </div>
            <h1 className="font-serif font-normal text-charcoal">
              วันนี้จะไปไหน
              <span>ให้ AI ช่วยเลือกชุด</span>
            </h1>
            <p className="home-hero-lede">
              บอกกิจกรรม อากาศ และสไตล์ที่ชอบ รับไอเดียแต่งตัว 3 ทิศทางที่ใช้ได้จริงกับวันของคุณ
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/ai-stylist" className="home-primary-action">
                <span>เริ่มเลือกชุดวันนี้</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              <Link href="/discover" className="home-secondary-action">
                <span>สำรวจแฟชั่นจากร้านค้า</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
            <p className="home-trust-note">
              <ShieldCheck className="w-4 h-4 text-olive shrink-0" aria-hidden="true" />
              <span>คำแนะนำ AI เป็นกลาง และแยกจากโฆษณาร้านค้าอย่างชัดเจน</span>
            </p>
          </div>
          <figure className="home-hero-visual">
            <Image
              src="/images/fittoday/home-hero-bangkok-editorial-v1.webp"
              alt="คนไทยสองคนในลุคร่วมสมัยโทนครีม เขียวมะกอก และกรมท่า เดินในพื้นที่สถาปัตยกรรมกรุงเทพ"
              fill
              priority
              fetchPriority="high"
              sizes="(max-width: 960px) 100vw, 56vw"
              className="object-cover"
            />
            <figcaption>
              <span>Daily direction 01</span>
              <strong>Bangkok, warm light</strong>
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="py-16 sm:py-20 border-b border-line bg-paper">
        <div className="container">
          <div className="direction-intro">
            <Eyebrow>Three directions</Eyebrow>
            <h2>หนึ่งวัน สามวิธีแต่งตัว</h2>
            <p>เลือกจุดเริ่มที่มั่นใจ แล้วปรับระดับความเนี้ยบหรือความสบายให้ตรงกับชีวิตจริง</p>
          </div>
          <div className="direction-grid">
            {directions.map((item) => (
              <article key={item.tag} className="direction-card group">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <span className="font-mono text-xs font-semibold tracking-wider text-charcoal">{item.code} {item.tag}</span>
                  <span className="text-xs text-muted font-medium">{item.title}</span>
                </div>
                <div className="direction-image">
                  <Image
                    src={item.image}
                    alt={`ตัวอย่างแนวแต่งตัว ${item.title}`}
                    fill
                    sizes="(max-width: 768px) 92vw, 31vw"
                    className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  />
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-normal text-charcoal mb-1">{item.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{item.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Activity and Context Index */}
      <section className="py-16 border-b border-line bg-paper">
        <div className="container">
          <SectionHeading
            eyebrow="Occasion Index"
            title="เริ่มจากสไตล์ที่ต้องการในวันนี้"
            body="เลือกหมวดกิจกรรมหรือโอกาสใช้งาน เพื่อสำรวจไอเดียจากร้านค้าอิสระ"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 border-t border-l border-line bg-background">
            {(categories || []).slice(0, 10).map((category, index) => (
              <Link
                className="p-6 border-r border-b border-line hover:bg-paper transition-colors group flex flex-col justify-between min-h-[120px]"
                href={`/categories/${category.slug}`}
                key={category.id}
              >
                <span className="font-mono text-xs text-muted group-hover:text-charcoal">{String(index + 1).padStart(2, "0")}</span>
                <strong className="font-medium text-base text-charcoal group-hover:underline decoration-1 underline-offset-4">{category.name_th}</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Latest Sponsored Lookbook */}
      <section className="py-20 border-b border-line">
        <div className="container">
          <SectionHeading
            eyebrow="Sponsored Editorial"
            title="ชุดและคอลเลกชันล่าสุดจากร้านค้า"
            body="พื้นที่นี้เป็นโฆษณาที่ผ่านการอนุมัติจากร้านค้าอิสระ ทุกรายการติดป้ายชัดเจนและเชื่อมต่อไปยัง Shopee ร้านค้าโดยตรง"
            action={{ href: "/discover", label: "ดูคอลเลกชันทั้งหมด" }}
          />
          <div className="ad-grid">
            {(ads || []).slice(0, 8).map((ad, index) => (
              <AdCard ad={ad} key={ad.id} priority={index < 2} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. How FitToday AI Works */}
      <section className="py-20 border-b border-line bg-paper">
        <div className="container">
          <div className="grid lg:grid-cols-12 gap-12 items-stretch border border-line bg-background p-8 sm:p-12">
            <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
              <div>
                <Eyebrow>Transparency & Standard</Eyebrow>
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal mt-3 mb-6 leading-tight text-charcoal">
                  ความเที่ยงตรงและเป็นกลางของ AI Stylist
                </h2>
                <p className="text-muted text-base leading-relaxed">
                  ระบบประมวลผลคำแนะนำจากกิจกรรม สภาพอากาศ อุณหภูมิ รูปร่าง และงบประมาณของคุณโดยเฉพาะ 
                  ไม่มีการสอดไส้สินค้าสปอนเซอร์ หรือนำเงินโฆษณามามีผลต่อการจัดลุคเด็ดขาด
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 pt-6 border-t border-line">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-charcoal shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-base font-medium text-charcoal">คำแนะนำตรงโอกาส</strong>
                    <span className="text-xs text-muted">คำนวณจากกาลเทศะ สภาพอากาศเมืองไทย และสไตล์ส่วนตัว</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-charcoal shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-base font-medium text-charcoal">ให้เกียรติความเป็นส่วนตัว</strong>
                    <span className="text-xs text-muted">ไม่วิพากษ์วิจารณ์รูปร่าง และเลือกบันทึกข้อมูลสัดส่วนได้ตามต้องการ</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-line pt-8 lg:pt-0 lg:pl-12 flex flex-col justify-center space-y-6">
              <div className="p-6 border border-line bg-paper">
                <span className="font-mono text-xs text-muted block mb-2">01 / UNBIASED ADVICE</span>
                <h3 className="font-serif text-2xl font-normal text-charcoal mb-2">แยกพื้นที่โฆษณาชัดเจน</h3>
                <p className="text-xs text-muted leading-relaxed">
                  รายการสปอนเซอร์แสดงในส่วน Discover เท่านั้น ไม่ปะปนกับผลลัพธ์คำแนะนำ AI
                </p>
              </div>
              <div className="p-6 border border-line bg-paper">
                <span className="font-mono text-xs text-muted block mb-2">02 / 3 LOOK DIRECTIONS</span>
                <h3 className="font-serif text-2xl font-normal text-charcoal mb-2">3 ทางเลือกในทุกการค้นหา</h3>
                <p className="text-xs text-muted leading-relaxed">
                  เสนอทางเลือก Safe, Elevated, และ Comfortable ให้คุณตัดสินใจตามอารมณ์วันนั้น
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Featured Independent Shops */}
      <section className="py-20 border-b border-line">
        <div className="container">
          <SectionHeading
            eyebrow="Independent Studios"
            title="ร้านค้าอิสระบน FitToday"
            body="สำรวจแบรนด์เสื้อผ้าและสตูดิโอออกแบบที่ร่วมแสดงคอลเลกชัน"
          />
          <div className="shop-grid">
            {shops.map((shop) => (
              <ShopCard shop={shop} key={shop.id} />
            ))}
          </div>
        </div>
      </section>

      {/* 7. Merchant Partnership Section (High-Contrast Dark Panel) */}
      <section className="py-24 bg-[#171814] text-[#F4F0E8]">
        <div className="container grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-8">
            <span className="text-xs tracking-widest text-[#D4CEBF] uppercase font-mono">Merchant Partnership</span>
            
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-normal leading-[1.1] text-[#F4F0E8]">
              พื้นที่สำหรับร้านแฟชั่นที่อยากถูกค้นพบ
            </h2>
            
            <p className="text-[#D4CEBF] text-base sm:text-lg leading-relaxed max-w-xl">
              ลงโฆษณาสินค้า คอลเลกชัน หรือโปรโมชัน พร้อมติดตาม Impression, Like, Click และ CTR ได้ในที่เดียวแบบตรงไปตรงมา
            </p>

            <div className="pt-2">
              <Link
                href="/register/merchant"
                className="merchant-partner-button"
              >
                <span>เปิดร้านบน FitToday</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6 border-l border-[#D4CEBF]/20 pl-8 lg:pl-12">
            <div className="space-y-2">
              <span className="font-mono text-xs text-[#D4CEBF]">01</span>
              <h3 className="text-lg font-medium text-[#F4F0E8]">สร้างโปรไฟล์ร้าน & ดราฟต์โฆษณา</h3>
              <p className="text-xs text-[#D4CEBF] leading-relaxed">ลงข้อมูลสินค้า รูปภาพ คอลเลกชัน พร้อมใส่ลิงก์ Shopee ของร้านคุณ</p>
            </div>
            <div className="space-y-2 pt-4 border-t border-[#D4CEBF]/20">
              <span className="font-mono text-xs text-[#D4CEBF]">02</span>
              <h3 className="text-lg font-medium text-[#F4F0E8]">ส่งโฆษณาให้ตรวจสอบ</h3>
              <p className="text-xs text-[#D4CEBF] leading-relaxed">ทีมงานอนุมัติมาตรฐานความถูกต้องเพื่อความมั่นใจของผู้ซื้อ</p>
            </div>
            <div className="space-y-2 pt-4 border-t border-[#D4CEBF]/20">
              <span className="font-mono text-xs text-[#D4CEBF]">03</span>
              <h3 className="text-lg font-medium text-[#F4F0E8]">ดูผลตอบรับและคลิกไป Shopee</h3>
              <p className="text-xs text-[#D4CEBF] leading-relaxed">ติดตามยอดชม ยอดคลิก และ CTR แบบ Real-time ใน Merchant Studio</p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Final AI Stylist CTA */}
      <section className="py-20 bg-background border-b border-line">
        <div className="container text-center max-w-3xl space-y-6">
          <Eyebrow>Ready to Style?</Eyebrow>
          <h2 className="font-serif text-4xl sm:text-5xl font-normal text-charcoal">
            พร้อมรับไอเดียแต่งตัวสำหรับวันนี้หรือยัง?
          </h2>
          <p className="text-muted text-base">
            ให้ AI ช่วยจัดลุค 3 ทิศทางที่เหมาะกับกิจกรรมและอากาศของคุณในไม่กี่วินาที
          </p>
          <div>
            <Link href="/ai-stylist" className="px-8 py-4 bg-charcoal text-white hover:bg-black font-medium text-sm rounded-none transition-colors inline-flex items-center gap-2">
              <span>เริ่มเลือกชุดกับ AI Stylist</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
