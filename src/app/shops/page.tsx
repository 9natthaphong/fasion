import type { Metadata } from "next";
import { EditorialPageIntro, EmptyState } from "@/components/ui";
import { ShopCard } from "@/components/shop-card";
import { getPublicShops } from "@/lib/catalog";

export const metadata: Metadata = { title: "ร้านค้าทั้งหมด | YourStylist" };

export default async function ShopsPage() {
  const shops = await getPublicShops(60);

  return (
    <div className="editorial-page-shell">
      <div className="container space-y-10 py-8">
        <header className="editorial-page-header">
          <EditorialPageIntro
            tone="neutral"
            eyebrow="INDEPENDENT STUDIOS"
            title="ร้านค้าทั้งหมด"
            body="สำรวจหน้าร้านและคอลเลกชันจากร้านค้าแฟชั่นอิสระที่มีมุมมองเป็นของตัวเอง"
          />
          <div className="editorial-count">
            <span>ร้านค้าทั้งหมด</span>
            <strong>{shops.length}</strong>
          </div>
        </header>

        {shops.length === 0 ? (
          <EmptyState
            title="ยังไม่มีร้านค้าในระบบ"
            body="กรุณากลับมาใหม่ภายหลัง หรือสมัครเป็นร้านค้าเพื่อเปิดพื้นที่ของคุณ"
            href="/register/merchant"
            action="เปิดพื้นที่ร้านค้า"
          />
        ) : (
          <section className="space-y-6">
            <div className="shop-grid">
              {shops.map((shop) => (
                <ShopCard shop={shop} key={shop.id} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
