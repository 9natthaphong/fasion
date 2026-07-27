import { notFound } from "next/navigation";
import { AdEditor } from "@/components/ad-editor";
import { requirePageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function EditAdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePageRole(["merchant"], "/login/merchant");
  const supabase = await createClient();
  const { data: shop } = await supabase.from("shops").select("*").eq("owner_id", user.id).is("deleted_at", null).maybeSingle();
  if (!shop) notFound();
  const [{ data: ad }, { data: categories }] = await Promise.all([
    supabase.from("ads").select("*, ad_categories(category_id), ad_images(storage_path, alt_text, sort_order)").eq("id", id).eq("shop_id", shop.id).is("deleted_at", null).maybeSingle(),
    supabase.from("categories").select("id, name_th").eq("is_active", true).order("sort_order"),
  ]);
  if (!ad) notFound();
  return <section className="dashboard-section"><p className="eyebrow">Edit campaign</p><h1>แก้ไขโฆษณา</h1><AdEditor shopId={shop.id} categories={categories ?? []} ad={ad} canSubmit={shop.status === "approved" && shop.subscription_status === "active"} /></section>;
}
