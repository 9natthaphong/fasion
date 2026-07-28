import { describe, it, expect } from "vitest";
import {
  resolveAssetUrl,
  resolveAdCoverUrl,
  resolveShopAssetUrl,
  resolveAvatarUrl,
} from "@/lib/assets";

describe("Asset Resolver Security & Path Handling", () => {
  it("returns null for empty, null, or undefined paths", () => {
    expect(resolveAssetUrl(null)).toBeNull();
    expect(resolveAssetUrl(undefined)).toBeNull();
    expect(resolveAssetUrl("")).toBeNull();
    expect(resolveAssetUrl("   ")).toBeNull();
  });

  it("resolves local static repository assets directly", () => {
    expect(resolveAssetUrl("/demo-assets/ad-linen-shirt.jpg")).toBe("/demo-assets/ad-linen-shirt.jpg");
    expect(resolveAssetUrl("/images/fittoday/ad-pleated-pants.jpg")).toBe("/images/fittoday/ad-pleated-pants.jpg");
  });

  it("resolves valid Supabase Storage relative paths into /api/assets proxy URLs", () => {
    const shopAssetPath = "00000000-0000-4000-8000-000000000101/cover.png";
    expect(resolveAdCoverUrl(shopAssetPath)).toBe(
      "/api/assets?bucket=ad-assets&path=00000000-0000-4000-8000-000000000101%2Fcover.png"
    );

    const shopLogoPath = "00000000-0000-4000-8000-000000000101/logo.webp";
    expect(resolveShopAssetUrl(shopLogoPath)).toBe(
      "/api/assets?bucket=shop-assets&path=00000000-0000-4000-8000-000000000101%2Flogo.webp"
    );

    const avatarPath = "00000000-0000-4000-8000-000000000001/avatar.jpg";
    expect(resolveAvatarUrl(avatarPath)).toBe(
      "/api/assets?bucket=avatars&path=00000000-0000-4000-8000-000000000001%2Favatar.jpg"
    );
  });

  it("rejects path traversal attempts", () => {
    expect(resolveAssetUrl("../secret.png")).toBeNull();
    expect(resolveAssetUrl("/demo-assets/../etc/passwd")).toBeNull();
    expect(resolveAssetUrl("bucket/../../config.json")).toBeNull();
  });

  it("rejects arbitrary external URLs and javascript: protocols", () => {
    expect(resolveAssetUrl("https://evil.com/phishing.jpg")).toBeNull();
    expect(resolveAssetUrl("http://untrusted.com/image.png")).toBeNull();
    expect(resolveAssetUrl("javascript:alert(1)")).toBeNull();
  });
});
