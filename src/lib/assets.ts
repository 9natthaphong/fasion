export type AssetBucket = "ad-assets" | "shop-assets" | "wardrobe-assets" | "avatars";

/**
 * Resolves local static assets (/demo-assets/, /images/) and
 * authenticated Supabase Storage paths (/api/assets?bucket=...&path=...)
 * safely. Rejects malformed paths, path traversal, and arbitrary external URLs.
 */
export function resolveAssetUrl(
  path: string | null | undefined,
  bucket: AssetBucket = "ad-assets"
): string | null {
  if (!path || typeof path !== "string") return null;
  const trimmed = path.trim();
  if (!trimmed) return null;

  // 1. Local static repository assets
  if (trimmed.startsWith("/demo-assets/") || trimmed.startsWith("/images/")) {
    if (trimmed.includes("..") || trimmed.includes("\\") || /[\0\r\n\t]/.test(trimmed)) {
      return null;
    }
    return trimmed;
  }

  // 2. Reject arbitrary external protocols (http://, https://, data:, etc.)
  if (/^[a-z0-9+.-]+:/i.test(trimmed)) {
    // Only allow if it matches a trusted site origin if needed; otherwise reject external URLs
    return null;
  }

  // 3. Supabase Storage relative paths (e.g. shopId/filename.jpg or userId/itemId/filename.jpg)
  // Ensure path contains no path traversal or dangerous characters
  if (trimmed.includes("..") || trimmed.includes("\\") || /[\0\r\n\t<>"']/.test(trimmed)) {
    return null;
  }

  // Valid storage object relative path pattern: alphanumeric, hyphen, underscore, dot, slash
  const storagePathPattern = /^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_.-]+)+$/;
  if (!storagePathPattern.test(trimmed)) {
    return null;
  }

  return `/api/assets?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(trimmed)}`;
}

export function resolveAdCoverUrl(path: string | null | undefined): string | null {
  return resolveAssetUrl(path, "ad-assets");
}

export function resolveAdImageUrl(path: string | null | undefined): string | null {
  return resolveAssetUrl(path, "ad-assets");
}

export function resolveShopAssetUrl(path: string | null | undefined): string | null {
  return resolveAssetUrl(path, "shop-assets");
}

export function resolveAvatarUrl(path: string | null | undefined): string | null {
  return resolveAssetUrl(path, "avatars");
}

export function resolveWardrobeAssetUrl(path: string | null | undefined): string | null {
  return resolveAssetUrl(path, "wardrobe-assets");
}
