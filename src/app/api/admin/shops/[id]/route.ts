import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";
import { adminShopActionSchema } from "@/lib/validation";
import { requireSameOrigin } from "@/lib/request-security";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSameOrigin(request))) return NextResponse.json({ error: "Origin ไม่ถูกต้อง" }, { status: 403 });
  const { id } = await params;
  const auth = await requireApiRole(["admin"]);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const parsed = adminShopActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "คำสั่งไม่ถูกต้อง" }, { status: 400 });
  const changes = actionToChanges(parsed.data.action, parsed.data.subscriptionEndsAt);
  const admin = getAdminClient();
  const { data: before } = await admin.from("shops").select("status, subscription_status, subscription_ends_at").eq("id", id).maybeSingle();
  if (!before) return NextResponse.json({ error: "ไม่พบร้าน" }, { status: 404 });
  const { error } = await admin.from("shops").update(changes).eq("id", id);
  if (error) return NextResponse.json({ error: "อัปเดตร้านไม่สำเร็จ" }, { status: 400 });
  await admin.rpc("record_admin_audit", {
    p_actor_id: auth.user.id,
    p_action: `shop.${parsed.data.action}`,
    p_entity_type: "shop",
    p_entity_id: id,
    p_before_data: before,
    p_after_data: changes,
  });
  return NextResponse.json({ ok: true });
}

function actionToChanges(action: string, endsAt?: string | null) {
  switch (action) {
    case "approve": return { status: "approved" };
    case "reject": return { status: "rejected" };
    case "suspend": return { status: "suspended" };
    case "activate_subscription": return { subscription_status: "active", subscription_ends_at: endsAt ?? null };
    case "expire_subscription": return { subscription_status: "expired", subscription_ends_at: new Date().toISOString() };
    default: return {};
  }
}
