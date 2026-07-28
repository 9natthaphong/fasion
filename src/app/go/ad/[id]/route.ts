import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdCurrentlyPublic } from "@/lib/domain";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/env";
import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getDemoAd } from "@/lib/demo-data";
import { eventSessionCookie, getEventIdentity, isLikelyBot, passRateLimit } from "@/lib/request-security";
import { normalizeShopeeUrl } from "@/lib/shopee";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (isSupabaseAdminConfigured()) {
    const admin = getAdminClient();
    const { data: ad } = await admin
      .from("ads")
      .select("id, destination_url, status, starts_at, ends_at, shops!inner(status, subscription_status, subscription_ends_at, deleted_at)")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();
    const shop = Array.isArray(ad?.shops) ? ad?.shops[0] : ad?.shops;
    if (
      ad &&
      shop &&
      shop.status === "approved" &&
      shop.subscription_status === "active" &&
      !shop.deleted_at &&
      (!shop.subscription_ends_at || new Date(shop.subscription_ends_at) > new Date()) &&
      isAdCurrentlyPublic(ad.status, ad.starts_at, ad.ends_at)
    ) {
      const user = await getCurrentUser();
      const identity = await getEventIdentity(user?.id);
      let destination: string;
      try {
        destination = normalizeShopeeUrl(ad.destination_url);
      } catch {
        return NextResponse.redirect(new URL("/discover?notice=invalid-destination", request.url), 303);
      }
      if (!(await isLikelyBot()) && (await passRateLimit("ad-click", user?.id ?? identity.sessionId, 60, 3600))) {
        await admin.from("ad_clicks").insert({
          ad_id: ad.id,
          user_id: user?.id ?? null,
          anonymous_session_id: user ? null : identity.sessionId,
          destination_host: new URL(destination).hostname,
        });
      }
      const response = NextResponse.redirect(destination, 303);
      eventSessionCookie(response, identity.sessionId, identity.isNewSession);
      return response;
    }
  } else if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: ad } = await supabase
      .from("ads")
      .select("id, destination_url, status, starts_at, ends_at, shops!inner(status, subscription_status, subscription_ends_at, deleted_at)")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();
    const shop = Array.isArray(ad?.shops) ? ad?.shops[0] : ad?.shops;
    if (
      ad &&
      shop &&
      shop.status === "approved" &&
      shop.subscription_status === "active" &&
      !shop.deleted_at &&
      (!shop.subscription_ends_at || new Date(shop.subscription_ends_at) > new Date()) &&
      isAdCurrentlyPublic(ad.status, ad.starts_at, ad.ends_at)
    ) {
      try {
        return NextResponse.redirect(normalizeShopeeUrl(ad.destination_url), 303);
      } catch {
        return NextResponse.redirect(new URL("/discover?notice=invalid-destination", request.url), 303);
      }
    }
  }

  // Demo fallback
  const demoAd = getDemoAd(id);
  if (demoAd) {
    try {
      return NextResponse.redirect(normalizeShopeeUrl(demoAd.destination_url), 303);
    } catch {
      return NextResponse.redirect(new URL("/discover?notice=invalid-destination", request.url), 303);
    }
  }

  return NextResponse.redirect(new URL("/discover?notice=ad-unavailable", request.url), 303);
}
