import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, CheckCircle2, ArrowUpRight, Sparkles } from "lucide-react";
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
      image: "/demo-assets/ad-linen-shirt.jpg",
      caption: "01 · Everyday Neutral Linen",
    },
    {
      code: "02",
      tag: "ELEVATED",
      title: "แต่งขึ้นอีกระดับ",
      desc: "เพิ่มความเนี้ยบด้วยคัตติ้งคม โครงชุดชัด และการจับคู่สีมีระดับ",
      image: "/demo-assets/ad-tailored-set.jpg",
      caption: "02 · Structured Tailoring",
    },
    {
      code: "03",
      tag: "COMFORTABLE",
      title: "สบายและคล่องตัว",
      desc: "เน้นเนื้อผ้าระบายอากาศ ทรงหลวมสบาย คล่องตัวตลอดวัน",
      image: "/demo-assets/hero-lookbook-2.jpg",
      caption: "03 · Fluid & Relaxed Fit",
    },
  ];

  return (
    <>
      {/* 2. Signature 3-Direction Hero */}
      <section className="pt-10 pb-20 border-b border-line bg-background">
        <div className="container space-y-12">
          {/* Hero Header */}
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 text-xs tracking-widest text-muted uppercase font-mono">
              <span className="w-2 h-2 rounded-full bg-olive"></span>
              <span>FitToday Lookbook Editorial</span>
            </div>
            
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-normal leading-[1.05] text-charcoal">
              วันนี้จะไปไหน?
            </h1>
            
            <p className="text-lg sm:text-xl text-muted leading-relaxed">
              ทำให้แต่ละวันแต่งตัวง่ายขึ้น บอกกิจกรรม อากาศ และสไตล์ที่ชอบ แล้วรับไอเดียชุด 3 ทิศทางจาก AI Stylist
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link href="/ai-stylist" className="px-8 py-4 bg-charcoal text-white hover:bg-black font-medium text-sm rounded-none transition-colors inline-flex items-center gap-2">
                <span>เริ่มเลือกชุด</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/discover" className="px-6 py-4 border border-line text-charcoal hover:bg-paper font-medium text-sm rounded-none transition-colors inline-flex items-center gap-1.5">
                <span>ดูไอเดียล่าสุด</span>
                <ArrowUpRight className="w-4 h-4 text-muted" />
              </Link>
            </div>

            <p className="text-xs text-muted flex items-center gap-2 pt-2">
              <ShieldCheck className="w-4 h-4 text-olive shrink-0" />
              <span>คำแนะนำจาก AI แยกจากพื้นที่โฆษณาของร้านค้าอย่างชัดเจน</span>
            </p>
          </div>

          {/* Signature 3 Outfit Directions Lookbook Grid */}
          <div className="grid md:grid-cols-3 gap-6 pt-4">
            {directions.map((item) => (
              <div key={item.tag} className="group border border-line bg-paper p-5 space-y-4 hover:border-charcoal transition-colors">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <span className="font-mono text-xs font-semibold tracking-wider text-charcoal">{item.code} {item.tag}</span>
                  <span className="text-xs text-muted font-medium">{item.title}</span>
                </div>

                <div className="aspect-[3/4] relative bg-background border border-line overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 90vw, 30vw"
                    priority
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                <div>
                  <h2 className="font-serif text-2xl font-normal text-charcoal mb-1">{item.title}</h2>
                  <p className="text-xs text-muted leading-relaxed">{item.desc}</p>
                </div>
              </div>
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
            {categories.slice(0, 10).map((category, index) => (
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
            {ads.slice(0, 8).map((ad, index) => (
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
                className="px-8 py-4 bg-[#F4F0E8] text-[#161713] hover:bg-white font-medium text-sm rounded-none transition-colors inline-flex items-center gap-2 shadow-sm"
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
              <Sparkles className="w-4 h-4" />
              <span>เริ่มเลือกชุดกับ AI Stylist</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
