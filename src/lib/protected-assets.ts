import type { CurrentUser } from "@/lib/auth";

type AdAssetRecord = {
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  shops?:
    | {
        owner_id: string;
        status: string;
        subscription_status: string;
        subscription_ends_at: string | null;
      }
    | {
        owner_id: string;
        status: string;
        subscription_status: string;
        subscription_ends_at: string | null;
      }[]
    | null;
};

function firstShop(
  shops: AdAssetRecord["shops"],
): Exclude<AdAssetRecord["shops"], null | undefined | unknown[]> | null {
  if (!shops) return null;
  return Array.isArray(shops) ? shops[0] ?? null : shops;
}

/**
 * Policy for ad-assets after the route has resolved the stored path to an ad.
 * Admins may review any ad, merchants may read their own shop's assets, and
 * all other roles may read only currently public, eligible advertisements.
 */
export function canReadAdAsset(
  user: Pick<CurrentUser, "id" | "role"> | null,
  ad: AdAssetRecord | null,
  now = new Date(),
) {
  if (!ad) return false;
  if (user?.role === "admin") return true;

  const shop = firstShop(ad.shops);
  if (user?.role === "merchant" && shop?.owner_id === user.id) return true;
  if (!shop || ad.status !== "active") return false;

  return (
    (!ad.starts_at || new Date(ad.starts_at) <= now) &&
    (!ad.ends_at || new Date(ad.ends_at) > now) &&
    shop.status === "approved" &&
    shop.subscription_status === "active" &&
    (!shop.subscription_ends_at || new Date(shop.subscription_ends_at) > now)
  );
}

export function isProtectedAssetUrl(src: string) {
  return src.startsWith("/api/assets?");
}
