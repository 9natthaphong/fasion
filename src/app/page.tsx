import Image from "next/image";
import Link from "next/link";
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
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <Eyebrow>AI Stylist ภาษาไทย</Eyebrow>
            <h1>
              What to wear,
              <span>วันนี้จะไปไหน?</span>
            </h1>
            <p>
              บอกกิจกรรม อากาศ และสไตล์ที่ชอบ แล้วรับไอเดียแต่งตัว 3 ทางเลือก
              โดยคำแนะนำ AI แยกจากโฆษณาของร้านค้าอย่างชัดเจน
            </p>
            <div className="hero-actions">
              <Link href="/ai-stylist" className="button button-solid">
                ให้ AI ช่วยเลือกชุด
              </Link>
              <Link href="/discover" className="button button-ghost">
                ดูสไตล์จากร้านค้า
              </Link>
            </div>
          </div>
          <div className="hero-art">
            <Image
              src="/demo/look-olive.svg"
              alt="ภาพประกอบชุดแฟชั่นมินิมอลโทนมะกอก"
              width={800}
              height={1000}
              priority
            />
            <div className="hero-note">
              <strong>คำแนะนำที่เป็นกลาง</strong>
              <span>เงินโฆษณาไม่มีผลต่อผลลัพธ์จาก AI Stylist</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading
            eyebrow="Browse by mood"
            title="เริ่มจากสิ่งที่อยากใส่"
            body="เลือกหมวดที่ใกล้กับวันนี้ แล้วดูไอเดียจากร้านค้าที่ผ่านการอนุมัติ"
          />
          <div className="category-strip">
            {categories.slice(0, 10).map((category, index) => (
              <Link
                className="category-tile"
                href={`/categories/${category.slug}`}
                key={category.id}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{category.name_th}</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

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

      <section className="section">
        <div className="container merchant-cta">
          <div>
            <Eyebrow>For merchants</Eyebrow>
            <h2>เปิดพื้นที่ให้คอลเลกชันของคุณถูกค้นพบ</h2>
            <p>
              สร้างโปรไฟล์ร้าน ลงโฆษณา ใส่ลิงก์ Shopee และดูยอดชม ถูกใจ คลิก
              และ CTR ได้ในหน้าเดียว
            </p>
            <Link className="button" href="/register/merchant">
              สมัครเป็นร้านค้า
            </Link>
          </div>
          <div className="editorial-list">
            <div className="editorial-step">สร้างร้านและเตรียมโฆษณาแบบ Draft</div>
            <div className="editorial-step">ส่งร้านและโฆษณาให้ผู้ดูแลตรวจ</div>
            <div className="editorial-step">เผยแพร่พร้อมดู analytics ที่ตรวจสอบย้อนกลับได้</div>
          </div>
        </div>
      </section>
    </>
  );
}
