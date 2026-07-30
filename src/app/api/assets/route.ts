import { NextResponse } from "next/server";
import { isSupabaseAdminConfigured } from "@/lib/env";
import { getAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";

const buckets = new Set(["avatars", "shop-assets", "ad-assets", "wardrobe-assets"]);

export async function GET(request: Request) {
  if (!isSupabaseAdminConfigured()) return new NextResponse(null, { status: 404 });
  const url = new URL(request.url);
  const bucket = url.searchParams.get("bucket");
  const path = url.searchParams.get("path");
  if (!bucket || !path || !buckets.has(bucket)) return new NextResponse(null, { status: 400 });
  
  if (path.includes("..") || path.includes("\\") || /[\0\r\n\t<>"']/.test(path) || path.startsWith("/")) {
    return new NextResponse(null, { status: 400 });
  }

  const validPathPattern = /^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_.-]+)+$/;
  if (!validPathPattern.test(path)) return new NextResponse(null, { status: 400 });

  const admin = getAdminClient();
  const user = await getCurrentUser();
  const allowed = await canReadAsset(admin, bucket, path, user);
  if (!allowed) return new NextResponse(null, { status: 404 });
  const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, 120);
  if (error) return new NextResponse(null, { status: 404 });
  return NextResponse.redirect(data.signedUrl, 307);
}

async function canReadAsset(
  admin: ReturnType<typeof getAdminClient>,
  bucket: string,
  path: string,
  user: Awaited<ReturnType<typeof getCurrentUser>>,
) {
  if (user?.role === "admin") return true;
  if (bucket === "avatars") return Boolean(user && path.startsWith(`${user.id}/`));
  if (bucket === "wardrobe-assets") return Boolean(user && path.startsWith(`${user.id}/`));
  if (user?.role === "merchant") {
    const shopId = path.split("/", 1)[0];
    const { data: ownedShop } = await admin
      .from("shops")
      .select("id")
      .eq("id", shopId)
      .eq("owner_id", user.id)
      .is("deleted_at", null)
      .maybeSingle();
    if (ownedShop) return true;
  }
  if (bucket === "shop-assets") {
    const { data: shop } = await admin.from("shops").select("id, owner_id, status, subscription_status, subscription_ends_at").or(`logo_path.eq.${path},cover_path.eq.${path}`).is("deleted_at", null).maybeSingle();
    if (!shop) return false;
    if (user?.role === "merchant" && shop.owner_id === user.id) return true;
    return shop.status === "approved" && shop.subscription_status === "active" && (!shop.subscription_ends_at || new Date(shop.subscription_ends_at) > new Date());
  }
  const { data: coverAd } = await admin.from("ads").select("status, starts_at, ends_at, shops(owner_id, status, subscription_status, subscription_ends_at)").eq("cover_image_path", path).is("deleted_at", null).maybeSingle();
  let ad = coverAd;
  if (!ad) {
    const { data: image } = await admin.from("ad_images").select("ads(status, starts_at, ends_at, deleted_at, shops(owner_id, status, subscription_status, subscription_ends_at))").eq("storage_path", path).maybeSingle();
    const related = Array.isArray(image?.ads) ? image?.ads[0] : image?.ads;
    ad = related?.deleted_at ? null : (related ?? null);
  }
  if (!ad) return false;
  const shop = Array.isArray(ad.shops) ? ad.shops[0] : ad.shops;
  if (user?.role === "merchant" && shop?.owner_id === user.id) return true;
  return ad.status === "active" && (!ad.starts_at || new Date(ad.starts_at) <= new Date()) && (!ad.ends_at || new Date(ad.ends_at) > new Date()) && shop?.status === "approved" && shop?.subscription_status === "active" && (!shop.subscription_ends_at || new Date(shop.subscription_ends_at) > new Date());
}

