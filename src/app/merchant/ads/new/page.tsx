import { AdEditor } from "@/components/ad-editor";
import { EmptyState } from "@/components/ui";
import { requirePageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getActiveFashionTags } from "@/lib/taxonomy";

export default async function NewAdPage() {
  const user = await requirePageRole(["merchant"], "/login/merchant");
  const supabase = await createClient();
  const [{ data: shop }, { data: categories }, allTags] = await Promise.all([
    supabase.from("shops").select("*").eq("owner_id", user.id).is("deleted_at", null).maybeSingle(),
    supabase.from("categories").select("id, name_th").eq("is_active", true).order("sort_order"),
    getActiveFashionTags(),
  ]);

  if (!shop) return <EmptyState title="ยังไม่มีร้าน" body="สร้างร้านก่อนสร้างโฆษณา" href="/merchant/onboarding" action="สร้างร้าน" />;

  return (
    <section className="dashboard-section">
      <p className="eyebrow">New campaign</p>
      <h1>สร้างโฆษณา</h1>
      <AdEditor
        shopId={shop.id}
        categories={categories ?? []}
        allTags={allTags}
        canSubmit={shop.status === "approved" && shop.subscription_status === "active"}
      />
    </section>
  );
}
