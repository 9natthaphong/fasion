import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseAdminConfigured } from "@/lib/env";
import { getAdminClient } from "@/lib/supabase/admin";
import { eventSessionCookie, getEventIdentity, isLikelyBot, passRateLimit, requireSameOrigin } from "@/lib/request-security";
import { shopViewSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!(await requireSameOrigin(request))) return NextResponse.json({ error: "Origin ไม่ถูกต้อง" }, { status: 403 });
  if (await isLikelyBot()) return NextResponse.json({ ok: true });
  const parsed = shopViewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูล event ไม่ถูกต้อง" }, { status: 400 });
  const user = await getCurrentUser();
  const identity = await getEventIdentity(user?.id);
  if (!(await passRateLimit("shop-view", user?.id ?? identity.sessionId, 60, 3600))) return NextResponse.json({ error: "ส่ง event ถี่เกินไป" }, { status: 429 });
  if (!isSupabaseAdminConfigured()) return NextResponse.json({ ok: true, deduplicated: false });
  const admin = getAdminClient();
  const { data: shop } = await admin.from("shops").select("id").eq("id", parsed.data.shopId).eq("status", "approved").eq("subscription_status", "active").is("deleted_at", null).maybeSingle();
  if (!shop) return NextResponse.json({ error: "ไม่พบร้าน" }, { status: 404 });
  const since = new Date(Date.now() - 30 * 60_000).toISOString();
  let duplicate = admin.from("shop_views").select("id").eq("shop_id", shop.id).gte("created_at", since).limit(1);
  duplicate = user ? duplicate.eq("user_id", user.id) : duplicate.eq("anonymous_session_id", identity.sessionId);
  const { data: exists } = await duplicate.maybeSingle();
  if (!exists) await admin.from("shop_views").insert({ shop_id: shop.id, user_id: user?.id ?? null, anonymous_session_id: user ? null : identity.sessionId });
  const response = NextResponse.json({ ok: true, deduplicated: Boolean(exists) });
  eventSessionCookie(response, identity.sessionId, identity.isNewSession);
  return response;
}
