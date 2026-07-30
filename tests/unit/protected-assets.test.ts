import { describe, expect, it } from "vitest";
import { canReadAdAsset } from "@/lib/protected-assets";

const shop = {
  owner_id: "merchant-owner",
  status: "approved",
  subscription_status: "active",
  subscription_ends_at: null,
};

const pendingAd = {
  status: "pending_review",
  starts_at: null,
  ends_at: null,
  shops: shop,
};

const activeAd = {
  status: "active",
  starts_at: null,
  ends_at: null,
  shops: shop,
};

describe("private ad asset authorization", () => {
  it("allows an admin to review pending ad assets", () => {
    expect(canReadAdAsset({ id: "admin-1", role: "admin" }, pendingAd)).toBe(true);
  });

  it("allows the owning merchant to load its own ad assets", () => {
    expect(
      canReadAdAsset({ id: "merchant-owner", role: "merchant" }, pendingAd),
    ).toBe(true);
  });

  it("denies an unrelated merchant pending ad assets", () => {
    expect(
      canReadAdAsset({ id: "other-merchant", role: "merchant" }, pendingAd),
    ).toBe(false);
  });

  it("denies customers and anonymous users pending ad assets", () => {
    expect(canReadAdAsset({ id: "customer-1", role: "customer" }, pendingAd)).toBe(false);
    expect(canReadAdAsset(null, pendingAd)).toBe(false);
  });

  it("allows eligible active ads to remain publicly readable", () => {
    expect(canReadAdAsset(null, activeAd)).toBe(true);
  });

  it("denies active ads when the shop is not eligible", () => {
    expect(
      canReadAdAsset(null, {
        ...activeAd,
        shops: { ...shop, subscription_status: "inactive" },
      }),
    ).toBe(false);
  });
});
