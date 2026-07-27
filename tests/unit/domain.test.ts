import { describe, expect, it } from "vitest";
import { calculateCtr, formatCtr, isAdCurrentlyPublic, isAllowedRole } from "@/lib/domain";

describe("analytics helpers", () => {
  it("calculates CTR and avoids division by zero", () => {
    expect(calculateCtr(4, 200)).toBe(2);
    expect(calculateCtr(4, 0)).toBe(0);
    expect(formatCtr(0, 0)).toContain("0");
  });
});

describe("ad availability", () => {
  const now = new Date("2026-07-27T12:00:00Z");
  it("accepts only active ads in their date window", () => {
    expect(isAdCurrentlyPublic("active", "2026-07-01T00:00:00Z", "2026-08-01T00:00:00Z", now)).toBe(true);
    expect(isAdCurrentlyPublic("draft", null, null, now)).toBe(false);
    expect(isAdCurrentlyPublic("active", "2026-08-01T00:00:00Z", null, now)).toBe(false);
    expect(isAdCurrentlyPublic("active", null, "2026-07-01T00:00:00Z", now)).toBe(false);
  });
});

describe("role helpers", () => {
  it("does not widen an allow-list", () => {
    expect(isAllowedRole("customer", ["customer"])).toBe(true);
    expect(isAllowedRole("merchant", ["customer"])).toBe(false);
    expect(isAllowedRole("admin", ["merchant"])).toBe(false);
  });
});
