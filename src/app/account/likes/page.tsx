import { AdCard } from "@/components/ad-card";
import { EmptyState } from "@/components/ui";
import { requirePageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Ad } from "@/lib/types";

export default async function LikesPage() {
  const user = await requirePageRole(["customer"], "/login/customer");
  const supabase = await createClient();
  const { data } = await supabase
    .from("ad_likes")
    .select("ad_id, ads(*, shops(*))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const likedAds = (data ?? [])
    .map((row) => {
      const ad = Array.isArray(row.ads) ? row.ads[0] : row.ads;
      if (!ad) return null;
      const shop = Array.isArray(ad.shops) ? ad.shops[0] : ad.shops;
      return { ...ad, shop } as unknown as Ad;
    })
    .filter((ad): ad is Ad => Boolean(ad));
  return (
    <>
      <header className="dashboard-heading">
        <p className="eyebrow">Saved ads</p>
        <h1>รายการที่ถูกใจ</h1>
        <p>โฆษณาที่คุณเก็บไว้ ไม่ถูกนำไปใช้ชี้นำคำแนะนำจาก AI</p>
      </header>
      {!likedAds.length ? (
        <EmptyState
          title="ยังไม่มีรายการที่ถูกใจ"
          body="กดหัวใจบนโฆษณาที่สนใจ แล้วกลับมาดูได้จากหน้านี้"
          href="/discover"
          action="ค้นหาสไตล์"
        />
      ) : (
        <div className="ad-grid">
          {likedAds.map((ad) => (
            <AdCard ad={ad} key={ad.id} />
          ))}
        </div>
      )}
    </>
  );
}

