import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { requireSameOrigin } from "@/lib/request-security";

export async function POST(request: Request) {
  if (!(await requireSameOrigin(request))) return NextResponse.json({ error: "Origin ไม่ถูกต้อง" }, { status: 403 });
  const auth = await requireApiRole(["customer", "merchant"]);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const formData = await request.formData();
  if (formData.get("confirmation") !== "DELETE") {
    return NextResponse.json({ error: "คำยืนยันไม่ถูกต้อง พิมพ์ DELETE เพื่อยืนยัน" }, { status: 400 });
  }

  const supabase = await createClient();

  // Create pending deletion request
  const { error } = await supabase
    .from("account_deletion_requests")
    .insert({ user_id: auth.user.id, status: "pending" });

  if (error) {
    return NextResponse.json({ error: "ส่งคำขอลบบัญชีไม่สำเร็จ" }, { status: 400 });
  }

  // Anonymize user_id in analytics tables (preserve aggregate metric counts)
  await supabase.from("ad_impressions").update({ user_id: null }).eq("user_id", auth.user.id);
  await supabase.from("ad_clicks").update({ user_id: null }).eq("user_id", auth.user.id);
  await supabase.from("shop_views").update({ user_id: null }).eq("user_id", auth.user.id);

  // Soft/hard delete customer data
  await supabase.from("customer_fit_profiles").delete().eq("user_id", auth.user.id);
  await supabase.from("customer_preferences").delete().eq("user_id", auth.user.id);
  await supabase.from("saved_outfits").delete().eq("user_id", auth.user.id);
  await supabase.from("wear_logs").delete().eq("user_id", auth.user.id);
  await supabase.from("outfit_feedback").delete().eq("user_id", auth.user.id);
  await supabase.from("ad_likes").delete().eq("user_id", auth.user.id);
  await supabase.from("wardrobe_items").update({ deleted_at: new Date().toISOString() }).eq("user_id", auth.user.id);

  await supabase.auth.signOut();
  const redirectTo = "/?account-deletion=requested";
  if (request.headers.get("accept")?.includes("application/json")) {
    return NextResponse.json({ redirectTo });
  }
  return NextResponse.redirect(new URL(redirectTo, request.url), 303);
}
