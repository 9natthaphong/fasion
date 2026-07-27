import { describe, expect, it } from "vitest";
import { normalizeShopeeUrl } from "@/lib/shopee";

describe("Shopee URL validation", () => {
  it("allows canonical HTTPS Shopee Thailand URLs", () => {
    expect(normalizeShopeeUrl("https://shopee.co.th/example#details")).toBe("https://shopee.co.th/example");
    expect(normalizeShopeeUrl("https://seller.shopee.co.th/product")).toBe("https://seller.shopee.co.th/product");
  });
  it.each([
    "http://shopee.co.th/item",
    "javascript:alert(1)",
    "https://evil.example/?next=shopee.co.th",
    "https://localhost/item",
    "https://127.0.0.1/item",
    "https://192.168.1.2/item",
    "https://shope.ee/short",
  ])("rejects %s", (url) => expect(() => normalizeShopeeUrl(url)).toThrow());
});
