import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function AccountPage() {
  const user = await requirePageRole(["customer"], "/login/customer");
  const supabase = await createClient();
  const [{ count: outfitCount }, { count: likeCount }, { count: wardrobeCount }] = await Promise.all([
    supabase
      .from("outfit_requests")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase.from("ad_likes").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase
      .from("wardrobe_items")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("deleted_at", null),
  ]);
  return (
    <>
      <header className="dashboard-heading">
        <p className="eyebrow">Customer account</p>
        <h1>สวัสดี {user.displayName ?? "วันนี้"}</h1>
        <p>กลับมาเลือกชุดต่อ หรือเปิดสิ่งที่เก็บไว้จากครั้งก่อน</p>
      </header>
      <div className="stats-grid">
        <div className="stat-card">
          <span>ตู้เสื้อผ้าของฉัน</span>
          <strong>{wardrobeCount ?? 0} ชิ้น</strong>
          <Link href="/account/wardrobe">จัดการตู้เสื้อผ้า →</Link>
        </div>
        <div className="stat-card">
          <span>คำแนะนำที่บันทึก</span>
          <strong>{outfitCount ?? 0}</strong>
          <Link href="/account/outfits">ดูประวัติ →</Link>
        </div>
        <div className="stat-card">
          <span>โฆษณาที่ถูกใจ</span>
          <strong>{likeCount ?? 0}</strong>
          <Link href="/account/likes">เปิดรายการ →</Link>
        </div>
      </div>
      <div className="content-card account-cta">
        <div>
          <p className="eyebrow">Today&apos;s outfit</p>
          <h2>พร้อมเลือกชุดสำหรับวันนี้หรือยัง?</h2>
          <p>ข้อมูลที่เลือกบันทึกจะถูกเติมให้อัตโนมัติ และแก้ได้ก่อนส่งทุกครั้ง</p>
        </div>
        <Link className="button button-solid" href="/ai-stylist">
          เปิด AI Stylist
        </Link>
      </div>
    </>
  );
}

