import { describe, expect, it } from "vitest";
import { canAccessCustomerExperience, canManageAdmin, canUseCustomerBilling, hasProductProEntitlement } from "@/lib/capabilities";

describe("role capability model", () => {
  it.each([
    ["customer", true],
    ["admin", true],
    ["merchant", false],
  ] as const)("customer experience for %s is %s", (role, expected) => {
    expect(canAccessCustomerExperience(role)).toBe(expected);
  });

  it.each([
    ["customer", false],
    ["admin", true],
    ["merchant", false],
  ] as const)("admin management for %s is %s", (role, expected) => {
    expect(canManageAdmin(role)).toBe(expected);
  });

  it.each([
    ["customer", true],
    ["admin", false],
    ["merchant", false],
  ] as const)("customer billing for %s is %s", (role, expected) => {
    expect(canUseCustomerBilling(role)).toBe(expected);
  });

  it("grants internal Pro entitlement to admins without a subscription", () => {
    expect(hasProductProEntitlement("admin", null)).toBe(true);
  });

  it("requires an active, non-expired Pro subscription for customers", () => {
    expect(hasProductProEntitlement("customer", { plan: "pro", status: "active", ends_at: null })).toBe(true);
    expect(hasProductProEntitlement("customer", { plan: "pro", status: "active", ends_at: "2020-01-01T00:00:00.000Z" })).toBe(false);
    expect(hasProductProEntitlement("customer", { plan: "free", status: "active", ends_at: null })).toBe(false);
  });

  it("never grants customer Pro features to merchants", () => {
    expect(hasProductProEntitlement("merchant", { plan: "pro", status: "active", ends_at: null })).toBe(false);
  });
});
