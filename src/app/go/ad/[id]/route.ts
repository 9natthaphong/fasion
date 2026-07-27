import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdCurrentlyPublic } from "@/lib/domain";
import { getAdminClient } from "@/lib/supabase/admin";
import { eventSessionCookie, getEventIdentity, isLikelyBot, passRateLimit } from "@/lib/request-security";
import { normalizeShopeeUrl } from "@/lib/shopee";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = getAdminClient();
  const { data: ad } = await admin.from("ads").select("id, destination_url, status, starts_at, ends_at, shops!inner(status, subscription_status, subscription_ends_at, deleted_at)").eq("id", id).is("deleted_at", null).maybeSingle();
  const shop = Array.isArray(ad?.shops) ? ad?.shops[0] : ad?.shops;
  if (!ad || !shop || shop.status !== "approved" || shop.subscription_status !== "active" || shop.deleted_at || (shop.subscription_ends_at && new Date(shop.subscription_ends_at) <= new Date()) || !isAdCurrentlyPublic(ad.status, ad.starts_at, ad.ends_at)) {
    return NextResponse.redirect(new URL("/discover?notice=ad-unavailable", request.url), 303);
  }
  let destination: string;
  try {
    destination = normalizeShopeeUrl(ad.destination_url);
  } catch {
    return NextResponse.redirect(new URL("/discover?notice=invalid-destination", request.url), 303);
  }
  const user = await getCurrentUser();
  const identity = await getEventIdentity(user?.id);
  if (!(await isLikelyBot()) && await passRateLimit("ad-click", user?.id ?? identity.sessionId, 60, 3600)) {
    await admin.from("ad_clicks").insert({ ad_id: ad.id, user_id: user?.id ?? null, anonymous_session_id: user ? null : identity.sessionId, destination_host: new URL(destination).hostname });
  }
  const response = NextResponse.redirect(destination, 303);
  eventSessionCookie(response, identity.sessionId, identity.isNewSession);
  return response;
}
