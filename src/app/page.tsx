import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  Check,
  LockKeyhole,
  Megaphone,
  Shirt,
  Sparkles,
} from "lucide-react";
import { WardrobeStory } from "@/components/cinematic/wardrobe-story";
import { AdCard } from "@/components/ad-card";
import { ShopCard } from "@/components/shop-card";
import { getPublicAds, getPublicCategories, getPublicShops } from "@/lib/catalog";

import { getCurrentUser } from "@/lib/auth";
import { getCustomerEntitlements } from "@/lib/entitlements";
import { createClient } from "@/lib/supabase/server";

const directions = [
  {
    code: "01",
    tag: "SAFE",
    thaiTag: "ใส่ง่าย",
    title: "มั่นใจโดยไม่ต้องคิดเยอะ",
    description:
      "เริ่มจากโทนและทรงที่ไว้ใจได้ เหมาะกับตารางประจำวันที่ต้องเคลื่อนไหวจริง",
    image: "/images/fittoday/direction-safe-editorial-v1.webp",
    alt: "ผู้หญิงไทยในลุคใส่ง่าย เสื้อคลุมสีอ่อนกับกางเกงโทนกลาง",
  },
  {
    code: "02",
    tag: "ELEVATED",
    thaiTag: "แต่งขึ้น",
    title: "เพิ่มจังหวะให้ลุคเดิม",
    description:
      "ปรับสัดส่วน สี หรือชิ้นเด่นอีกหนึ่งระดับ โดยยังใช้เสื้อผ้าที่คุณมีอยู่",
    image: "/images/fittoday/direction-elevated-editorial-v1.webp",
    alt: "ผู้หญิงไทยในลุคแต่งขึ้นด้วยเสื้อสูทโครงชัดโทนน้ำตาล",
  },
  {
    code: "03",
    tag: "COMFORTABLE",
    thaiTag: "สบาย",
    title: "เบา คล่องตัว พร้อมทั้งวัน",
    description:
      "เน้นเนื้อผ้าที่หายใจได้และทรงที่เคลื่อนไหวสะดวกสำหรับอากาศเมืองไทย",
    image: "/images/fittoday/direction-comfortable-editorial-v1.webp",
    alt: "ผู้หญิงไทยในลุคสบายด้วยเสื้อทรงผ่อนคลายสีน้ำเงิน",
  },
] as const;

export default async function HomePage() {
  const user = await getCurrentUser();
  let isPro = false;
  let isPending = false;

  if (user) {
    const entitlements = await getCustomerEntitlements(user.id);
    isPro = entitlements.isProActive;
    
    if (!isPro) {
      const supabase = await createClient();
      const { data: request } = await supabase
        .from("customer_subscription_requests")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .single();
      isPending = !!request;
    }
  }

  const [ads, categories, shops] = await Promise.all([
    getPublicAds(8),
    getPublicCategories(),
    getPublicShops(4),
  ]);

  return (
    <>
      <WardrobeStory />

      <section className="home-quick-actions" aria-labelledby="quick-actions-title">
        <div className="container">
          <div className="editorial-kicker">
            <span>เริ่มจากสิ่งที่ต้องการวันนี้</span>
            <span>01 — 03</span>
          </div>
          <h2 id="quick-actions-title">สามทางลัดที่ไม่ปะปนกัน</h2>
          <div className="quick-action-list">
            <Link href="/ai-stylist">
              <Sparkles aria-hidden="true" />
              <span>
                <small>Neutral AI</small>
                <strong>ให้ AI ช่วยเลือกชุด</strong>
              </span>
              <ArrowUpRight aria-hidden="true" />
            </Link>
            <Link href="/account/wardrobe">
              <Shirt aria-hidden="true" />
              <span>
                <small>Private wardrobe</small>
                <strong>เปิดตู้เสื้อผ้าของฉัน</strong>
              </span>
              <ArrowUpRight aria-hidden="true" />
            </Link>
            <Link href="/discover" className="quick-action-sponsored">
              <Megaphone aria-hidden="true" />
              <span>
                <small>Sponsored discovery</small>
                <strong>ค้นหาแฟชั่นจากร้านค้า</strong>
              </span>
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="home-wardrobe-story" aria-labelledby="wardrobe-title">
        <div className="container wardrobe-story-grid">
          <figure className="wardrobe-story-media">
            <Image
              src="/images/fittoday/wardrobe-capture-guide.jpg"
              alt="เสื้อเชิ้ต กางเกง กระเป๋า และรองเท้าวางบนพื้นเรียบเพื่อถ่ายเข้าตู้เสื้อผ้าส่วนตัว"
              fill
              sizes="(max-width: 768px) 100vw, 52vw"
              className="object-cover"
            />
            <figcaption>
              <Camera aria-hidden="true" />
              <span>ถ่ายในแสงธรรมชาติ · เห็นทรงและสีชัด</span>
            </figcaption>
          </figure>

          <div className="wardrobe-story-copy">
            <p className="editorial-eyebrow">YOUR OWN WARDROBE</p>
            <h2 id="wardrobe-title">เสื้อผ้าที่มีอยู่ ควรได้ออกไปใช้ชีวิต</h2>
            <p className="wardrobe-story-lede">
              ถ่ายรูปทีละชิ้น ให้ AI อ่านลักษณะเบื้องต้น แล้วคุณเป็นคนยืนยันก่อนบันทึกทุกครั้ง
            </p>
            <ol className="wardrobe-step-list">
              <li>
                <span>01</span>
                <div>
                  <strong>ถ่ายหรืออัปโหลด</strong>
                  <p>กล้องคือทางลัดหลักบนมือถือ รูปต้นฉบับอยู่ในพื้นที่ส่วนตัว</p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>AI วิเคราะห์ คุณยืนยัน</strong>
                  <p>ตรวจประเภท สี เนื้อผ้า และโอกาสใช้งานก่อนบันทึก</p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>จัดลุคจากของจริง</strong>
                  <p>เลือกจากชิ้นที่พร้อมใส่ โดยไม่ให้โฆษณาแทรกในผลลัพธ์</p>
                </div>
              </li>
            </ol>
            <div className="wardrobe-privacy">
              <LockKeyhole aria-hidden="true" />
              <span>รูปตู้เสื้อผ้าเป็นข้อมูลส่วนตัว เห็นได้เฉพาะเจ้าของบัญชี</span>
            </div>
            <Link href="/account/wardrobe/new" className="editorial-text-link">
              เพิ่มเสื้อผ้าชิ้นแรก
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="home-directions" aria-labelledby="directions-title">
        <div className="container">
          <div className="directions-heading">
            <div>
              <p className="editorial-eyebrow">THREE DIRECTIONS</p>
              <h2 id="directions-title">หนึ่งวัน ไม่จำเป็นต้องมีคำตอบเดียว</h2>
            </div>
            <p>
              ทุกครั้งที่ขอคำแนะนำ คุณจะได้สามทิศทางที่ต่างกันชัดเจน พร้อมเหตุผลและชิ้นที่ต้องใช้
            </p>
          </div>

          <div className="direction-editorial-grid">
            {directions.map((direction) => (
              <article key={direction.tag} className="direction-editorial">
                <div className="direction-editorial-media">
                  <Image
                    src={direction.image}
                    alt={direction.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 34vw"
                    className="object-cover"
                  />
                  <span>{direction.thaiTag}</span>
                </div>
                <div className="direction-editorial-copy">
                  <div>
                    <span>{direction.code}</span>
                    <span>{direction.tag}</span>
                  </div>
                  <h3>{direction.title}</h3>
                  <p>{direction.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-ai-standard" aria-labelledby="standard-title">
        <div className="container ai-standard-grid">
          <div>
            <p className="editorial-eyebrow">NEUTRAL BY DESIGN</p>
            <h2 id="standard-title">คำแนะนำที่มองคุณ ไม่ได้มองงบโฆษณา</h2>
          </div>
          <div className="ai-standard-points">
            <p>
              AI Stylist ใช้กิจกรรม อากาศ เวลา สไตล์ และตู้เสื้อผ้าที่คุณเลือกแชร์ในคำขอเท่านั้น
            </p>
            <ul>
              <li><Check aria-hidden="true" /> ไม่มีลิงก์สินค้าในผลลัพธ์ AI</li>
              <li><Check aria-hidden="true" /> ไม่วิจารณ์รูปร่างหรือให้คำแนะนำลดน้ำหนัก</li>
              <li><Check aria-hidden="true" /> พื้นที่โฆษณาแยกออกและติดป้ายเสมอ</li>
            </ul>
            <Link href="/ai-stylist" className="editorial-text-link">
              ทดลองจัดลุค
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="home-sponsored-zone" aria-labelledby="sponsored-title">
        <div className="container">
          <div className="sponsored-zone-heading">
            <div>
              <p className="editorial-eyebrow">SPONSORED DISCOVERY</p>
              <h2 id="sponsored-title">แฟชั่นจากร้านค้าอิสระ</h2>
            </div>
            <div className="sponsored-disclosure">
              <Megaphone aria-hidden="true" />
              <p>
                เนื้อหาส่วนนี้เป็นโฆษณา แยกจากคำแนะนำ AI
                <Link href="/privacy">ทำไมฉันเห็นโฆษณานี้</Link>
              </p>
            </div>
          </div>

          <nav className="home-category-index" aria-label="หมวดแฟชั่นจากร้านค้า">
            {categories.slice(0, 8).map((category, index) => (
              <Link href={`/categories/${category.slug}`} key={category.id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {category.name_th}
              </Link>
            ))}
          </nav>

          <div className="ad-grid home-sponsored-grid">
            {ads.slice(0, 4).map((ad, index) => (
              <AdCard ad={ad} key={ad.id} priority={index < 2} />
            ))}
          </div>
          <Link href="/discover" className="editorial-text-link sponsored-all-link">
            ดูโฆษณาแฟชั่นทั้งหมด
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="home-shops" aria-labelledby="shops-title">
        <div className="container">
          <div className="directions-heading">
            <div>
              <p className="editorial-eyebrow">INDEPENDENT STUDIOS</p>
              <h2 id="shops-title">ร้านที่มีมุมมองของตัวเอง</h2>
            </div>
            <p>หน้าร้านและรายการสาธิตติดป้าย Demo ชัดเจน ไม่มีแบรนด์หรือเสียงตอบรับที่แต่งขึ้น</p>
          </div>
          <div className="shop-grid">
            {shops.map((shop) => (
              <ShopCard shop={shop} key={shop.id} />
            ))}
          </div>
        </div>
      </section>

      <section className="home-pricing py-16 bg-muted/30" aria-labelledby="pricing-title">
        <div className="container">
          <header className="mb-12 text-center">
            <h2 id="pricing-title" className="text-3xl font-serif font-bold text-olive-dark mb-4">เลือกรูปแบบที่เหมาะกับคุณ</h2>
            <p className="text-muted-foreground">ไม่มีระบบตัดเงินอัตโนมัติ ชำระด้วยการโอนและตรวจสอบโดยผู้ดูแล</p>
          </header>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Card */}
            <div className="border border-border rounded-xl p-8 bg-card shadow-sm flex flex-col">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <p className="text-muted-foreground mb-6 h-12">เริ่มจัดตู้เสื้อผ้าและรับคำแนะนำพื้นฐานได้ฟรี</p>
              <div className="text-3xl font-bold mb-8">0 บาท <span className="text-lg font-normal text-muted-foreground">/ เดือน</span></div>
              
              <ul className="space-y-4 mb-8 flex-1 text-sm">
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-olive-dark shrink-0 mt-1" /> <span>ใช้งานตู้เสื้อผ้าส่วนตัว</span></li>
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-olive-dark shrink-0 mt-1" /> <span>ขอคำแนะนำ AI Stylist แบบพื้นฐาน</span></li>
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-olive-dark shrink-0 mt-1" /> <span>บันทึกลุคและประวัติการสวมใส่</span></li>
              </ul>
              
              <div className="mt-auto">
                <Link href={user ? "/account" : "/register"} className="block w-full py-3 px-4 bg-secondary text-secondary-foreground text-center rounded-lg font-medium hover:bg-secondary/80 transition-colors">
                  เริ่มใช้งานฟรี
                </Link>
              </div>
            </div>

            {/* Pro Card */}
            <div className="border-2 border-olive-dark rounded-xl p-8 bg-olive-pale/30 shadow-md flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-olive-dark text-background text-xs font-bold px-3 py-1 rounded-bl-lg">แนะนำ</div>
              <h3 className="text-2xl font-bold mb-2 text-olive-dark">Pro</h3>
              <p className="text-muted-foreground mb-6 h-12">YourStylist ที่จดจำกิจวัตรและช่วยวางแผนชุดให้คุณทั้งสัปดาห์</p>
              
              <div className="mb-2">
                <div className="text-3xl font-bold text-olive-dark">29 บาท <span className="text-lg font-normal text-muted-foreground">/ เดือน</span></div>
                <div className="text-sm font-medium text-destructive mt-1">เดือนแรก 9 บาท</div>
              </div>
              <div className="text-xs text-muted-foreground mb-8">ชำระด้วยการโอนและตรวจสอบโดยผู้ดูแล ไม่มีการตัดเงินอัตโนมัติ</div>
              
              <ul className="space-y-4 mb-8 flex-1 text-sm">
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-olive-dark shrink-0 mt-1" /> <span>Weekly Style Memory</span></li>
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-olive-dark shrink-0 mt-1" /> <span>Weekly Outfit Planner</span></li>
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-olive-dark shrink-0 mt-1" /> <span>Smart Repeat Avoidance</span></li>
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-olive-dark shrink-0 mt-1" /> <span>Advanced wardrobe insights</span></li>
                <li className="flex items-start gap-3"><Check className="w-4 h-4 text-olive-dark shrink-0 mt-1" /> <span>Theme customization</span></li>
              </ul>
              
              <div className="mt-auto">
                {!user ? (
                  <Link href="/login" className="block w-full py-3 px-4 bg-olive-dark text-background text-center rounded-lg font-medium hover:bg-olive-dark/90 transition-colors">
                    เข้าสู่ระบบเพื่ออัปเกรด
                  </Link>
                ) : isPro ? (
                  <div className="block w-full py-3 px-4 bg-olive-pale text-olive-dark border border-olive-dark text-center rounded-lg font-medium">
                    คุณเป็นสมาชิก Pro แล้ว
                  </div>
                ) : isPending ? (
                  <Link href="/account/subscription/payment" className="block w-full py-3 px-4 bg-secondary text-secondary-foreground text-center rounded-lg font-medium">
                    กำลังรอตรวจสอบ
                  </Link>
                ) : (
                  <form action={async () => {
                    "use server";
                    const { requestProAccess } = await import("@/app/pricing/actions");
                    await requestProAccess();
                  }}>
                    <button type="submit" className="block w-full py-3 px-4 bg-olive-dark text-background text-center rounded-lg font-medium hover:bg-olive-dark/90 transition-colors">
                      อัปเกรดเป็น Pro
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-merchant-story" aria-labelledby="merchant-title">
        <div className="container merchant-story-grid">
          <div>
            <p className="editorial-eyebrow">FOR FASHION MERCHANTS</p>
            <h2 id="merchant-title">เล่าเรื่องสินค้าให้ชัด แล้ววัดผลอย่างตรงไปตรงมา</h2>
          </div>
          <div>
            <p>
              สร้างร่างโฆษณา อัปโหลดภาพ ใส่ alt text ส่งตรวจ และติดตาม Impression, Like, Click
              กับ CTR ในพื้นที่ที่แยกจาก AI Stylist
            </p>
            <ul>
              <li><span>01</span> ร้านต้องผ่านการอนุมัติก่อนเผยแพร่</li>
              <li><span>02</span> โฆษณาทุกรายการมีป้ายกำกับ</li>
              <li><span>03</span> เจ้าของร้านเห็นเฉพาะข้อมูลของร้านตัวเอง</li>
            </ul>
            <Link href="/register/merchant" className="merchant-story-action">
              เปิดพื้นที่ร้านบน YourStylist
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
