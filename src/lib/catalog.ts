import {
  ads as demoAds,
  categories as demoCategories,
  demoAdCoverBySlug,
  demoAdAltBySlug,
  getDemoAd,
  getDemoShop,
  shops as demoShops,
} from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Ad, Category, Shop } from "@/lib/types";

function assetUrl(bucket: "shop-assets" | "ad-assets", path: string | null) {
  if (!path) return null;
  if (path.startsWith("/")) return path;
  return `/api/assets?bucket=${bucket}&path=${encodeURIComponent(path)}`;
}

function mapShop(row: Record<string, unknown>): Shop {
  return {
    ...(row as unknown as Shop),
    website_url:
      (row.website_url as string | null | undefined) ??
      (row.shopee_url as string | null | undefined) ??
      null,
    logo_path: assetUrl("shop-assets", row.logo_path as string | null),
    cover_path: assetUrl("shop-assets", row.cover_path as string | null),
  };
}

function mapAd(row: Record<string, unknown>): Ad {
  const shopRow = Array.isArray(row.shops) ? row.shops[0] : row.shops;
  const categoryRows = (row.ad_categories as { categories: Category | Category[] }[] | null) ?? [];
  const demoCover =
    row.is_demo === true && typeof row.slug === "string"
      ? demoAdCoverBySlug[row.slug]
      : undefined;
  return {
    ...(row as unknown as Ad),
    purchase_info:
      row.is_demo === true
        ? "สินค้าตัวอย่าง — ติดต่อร้านค้าเพื่อสอบถามรายละเอียด"
        : (row.purchase_info as string | null),
    cover_image_path: assetUrl(
      "ad-assets",
      demoCover ?? (row.cover_image_path as string | null),
    ),
    image_alt:
      row.is_demo === true && typeof row.slug === "string"
        ? demoAdAltBySlug[row.slug]
        : undefined,
    shop: shopRow ? mapShop(shopRow as Record<string, unknown>) : undefined,
    categories: categoryRows.flatMap((item) => Array.isArray(item.categories) ? item.categories : [item.categories]).filter(Boolean),
    impressions: 0,
    clicks: 0,
    likes: 0,
  };
}

const adSelect = "*, shops(*), ad_categories(categories(*))";

export async function getPublicCategories() {
  if (!isSupabaseConfigured()) return demoCategories;
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("*").eq("is_active", true).order("sort_order");
  return error || !data?.length ? demoCategories : (data as Category[]);
}

export async function getPublicAds(limit = 60) {
  if (!isSupabaseConfigured()) return demoAds.slice(0, limit);
  const supabase = await createClient();
  const { data, error } = await supabase.from("ads").select(adSelect).eq("status", "active").order("created_at", { ascending: false }).limit(limit);
  return error || !data?.length ? demoAds.slice(0, limit) : data.map((row) => mapAd(row));
}

export async function getPublicShops(limit = 20) {
  const approvedDemo = demoShops.filter((s) => s.status === "approved" || s.status === undefined);
  if (!isSupabaseConfigured()) return approvedDemo.slice(0, limit);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);
  return error || !data?.length ? approvedDemo.slice(0, limit) : data.map((row) => mapShop(row));
}

export async function getPublicAd(slug: string) {
  if (!isSupabaseConfigured()) return getDemoAd(slug);
  const supabase = await createClient();
  const { data } = await supabase.from("ads").select(adSelect).eq("slug", slug).maybeSingle();
  return data ? mapAd(data) : getDemoAd(slug);
}

export async function getPublicShop(slug: string) {
  if (!isSupabaseConfigured()) return getDemoShop(slug);
  const supabase = await createClient();
  const { data } = await supabase.from("shops").select("*").eq("slug", slug).maybeSingle();
  return data ? mapShop(data) : getDemoShop(slug);
}
