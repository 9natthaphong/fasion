import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseAdminConfigured } from "@/lib/env";
import { getAdminClient } from "@/lib/supabase/admin";
import { getEventIdentity, eventSessionCookie, isLikelyBot, passRateLimit, requireSameOrigin } from "@/lib/request-security";
import { impressionSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!(await requireSameOrigin(request))) return NextResponse.json({ error: "Origin ไม่ถูกต้อง" }, { status: 403 });
  if (await isLikelyBot()) return NextResponse.json({ ok: true });
  const parsed = impressionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "ข้อมูล event ไม่ถูกต้อง" }, { status: 400 });
  const user = await getCurrentUser();
  const identity = await getEventIdentity(user?.id);
  if (!(await passRateLimit("impression", user?.id ?? identity.sessionId, 120, 3600))) return NextResponse.json({ error: "ส่ง event ถี่เกินไป" }, { status: 429 });
  if (!isSupabaseAdminConfigured()) return NextResponse.json({ ok: true, deduplicated: false });
  const admin = getAdminClient();
  const { data: ad } = await admin.from("ads").select("id, status, starts_at, ends_at, shops!inner(status, subscription_status, subscription_ends_at)").eq("id", parsed.data.adId).eq("status", "active").is("deleted_at", null).maybeSingle();
  if (!ad || (ad.starts_at && new Date(ad.starts_at) > new Date()) || (ad.ends_at && new Date(ad.ends_at) <= new Date())) return NextResponse.json({ error: "โฆษณาไม่พร้อมเผยแพร่" }, { status: 404 });
  const since = new Date(Date.now() - 30 * 60_000).toISOString();
  let duplicate = admin.from("ad_impressions").select("id").eq("ad_id", ad.id).gte("created_at", since).limit(1);
  duplicate = user ? duplicate.eq("user_id", user.id) : duplicate.eq("anonymous_session_id", identity.sessionId);
  const { data: exists } = await duplicate.maybeSingle();
  if (!exists) await admin.from("ad_impressions").insert({ ad_id: ad.id, user_id: user?.id ?? null, anonymous_session_id: user ? null : identity.sessionId, page_context: parsed.data.pageContext });
  const response = NextResponse.json({ ok: true, deduplicated: Boolean(exists) });
  eventSessionCookie(response, identity.sessionId, identity.isNewSession);
  return response;
}
