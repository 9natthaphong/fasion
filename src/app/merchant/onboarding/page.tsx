import { redirect } from "next/navigation";
import { ShopForm } from "@/components/shop-form";
import { requirePageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function MerchantOnboardingPage() {
  const user = await requirePageRole(["merchant"], "/login/merchant");
  const supabase = await createClient();
  const { data: existing } = await supabase.from("shops").select("id").eq("owner_id", user.id).is("deleted_at", null).maybeSingle();
  if (existing) redirect("/merchant");
  return (
    <section className="dashboard-section narrow">
      <p className="eyebrow">เริ่มต้นขายพื้นที่โฆษณา</p>
      <h1>สร้างโปรไฟล์ร้าน</h1>
      <p className="lead">ร้านใหม่จะอยู่สถานะ pending คุณสร้างร่างโฆษณารอได้ระหว่างการตรวจ</p>
      <ShopForm onboarding />
    </section>
  );
}
