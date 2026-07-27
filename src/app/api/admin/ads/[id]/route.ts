import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";
import { adminAdActionSchema } from "@/lib/validation";
import { requireSameOrigin } from "@/lib/request-security";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSameOrigin(request))) return NextResponse.json({ error: "Origin ไม่ถูกต้อง" }, { status: 403 });
  const { id } = await params;
  const auth = await requireApiRole(["admin"]);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const parsed = adminAdActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "คำสั่งไม่ถูกต้อง" }, { status: 400 });
  const admin = getAdminClient();
  const { data: ad } = await admin.from("ads").select("status, destination_url, cover_image_path, shops(status, subscription_status, subscription_ends_at)").eq("id", id).maybeSingle();
  if (!ad) return NextResponse.json({ error: "ไม่พบโฆษณา" }, { status: 404 });
  const shop = Array.isArray(ad.shops) ? ad.shops[0] : ad.shops;
  if (parsed.data.action === "approve" && (!shop || shop.status !== "approved" || shop.subscription_status !== "active" || (shop.subscription_ends_at && new Date(shop.subscription_ends_at) <= new Date()))) {
    return NextResponse.json({ error: "ต้องอนุมัติร้านและเปิด subscription ก่อนอนุมัติโฆษณา" }, { status: 409 });
  }
  const status = parsed.data.action === "approve" ? "active" : parsed.data.action === "reject" ? "rejected" : "paused";
  const { error } = await admin.from("ads").update({ status }).eq("id", id);
  if (error) return NextResponse.json({ error: "อัปเดตโฆษณาไม่สำเร็จ" }, { status: 400 });
  await admin.rpc("record_admin_audit", {
    p_actor_id: auth.user.id,
    p_action: `ad.${parsed.data.action}`,
    p_entity_type: "ad",
    p_entity_id: id,
    p_before_data: { status: ad.status },
    p_after_data: { status },
  });
  return NextResponse.json({ ok: true });
}
