import { EmptyState, StatusBadge } from "@/components/ui";
import { ShopForm } from "@/components/shop-form";
import { requirePageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function MerchantShopPage() {
  const user = await requirePageRole(["merchant"], "/login/merchant");
  const supabase = await createClient();
  const { data: shop } = await supabase.from("shops").select("*").eq("owner_id", user.id).is("deleted_at", null).maybeSingle();
  if (!shop) return <EmptyState title="ยังไม่มีร้าน" body="เริ่มจากสร้างโปรไฟล์ร้าน" href="/merchant/onboarding" action="สร้างร้าน" />;
  return (
    <section className="dashboard-section narrow">
      <p className="eyebrow">Shop profile</p>
      <h1>ข้อมูลร้าน</h1>
      <div className="badge-row"><StatusBadge tone={shop.status === "approved" ? "success" : "warning"}>{shop.status}</StatusBadge></div>
      <ShopForm
        shop={{
          name: shop.name,
          slug: shop.slug,
          description: shop.description,
          website_url: shop.shopee_url,
          instagram_url: shop.instagram_url,
        }}
      />
      <p className="muted">สถานะอนุมัติและ subscription แก้ได้โดยผู้ดูแลระบบเท่านั้น</p>
    </section>
  );
}
