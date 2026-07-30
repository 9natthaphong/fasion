import { describe, expect, it } from "vitest";
import { createBaseSlug, generateUniqueAdSlug } from "@/lib/slug";

describe("Server-side Slug Generation", () => {
  it("generates readable ASCII slug for English title", () => {
    const slug = createBaseSlug("Linen Loose Shirt 2026!");
    expect(slug).toBe("linen-loose-shirt-2026");
  });

  it("provides safe fallback ad-{shortId} slug for Thai-only title", () => {
    const slug = createBaseSlug("เสื้อเชิ้ตคอตตอนลินินทรงหลวม");
    expect(slug).toMatch(/^ad-[a-f0-9]{8}$/);
  });

  it("enforces lowercase, hyphens only, and no trailing hyphens", () => {
    const slug = createBaseSlug("  Hello---World---   ");
    expect(slug).toBe("hello-world");
  });

  it("handles duplicate title collisions safely by appending unique suffix", async () => {
    const existingSlugs = new Set(["linen-shirt"]);
    const mockCheckExists = async (s: string) => existingSlugs.has(s);

    const newSlug = await generateUniqueAdSlug("Linen Shirt", mockCheckExists);
    expect(newSlug).not.toBe("linen-shirt");
    expect(newSlug.startsWith("linen-shirt-")).toBe(true);
  });

  it("handles consecutive collisions gracefully", async () => {
    const mockCheckExists = async () => true; // Always collides until fallback
    const newSlug = await generateUniqueAdSlug("Summer Dress", mockCheckExists);
    expect(newSlug).toMatch(/^summer-dress-/);
  });
});
