import { describe, it, expect, vi } from "vitest";
import { getCustomerEntitlements, requireActivePro } from "@/lib/entitlements";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn()
}));

describe("Entitlements Helper", () => {
  it("should return false if no subscription is found", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null })
    };
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

    const result = await getCustomerEntitlements("user-1");
    expect(result.isProActive).toBe(false);
    expect(result.plan).toBe("free");
  });

  it("should return true if active pro subscription exists", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ 
        data: { plan: "pro", status: "active", ends_at: new Date(Date.now() + 86400000).toISOString() }
      })
    };
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

    const result = await getCustomerEntitlements("user-1");
    expect(result.isProActive).toBe(true);
    expect(result.plan).toBe("pro");
  });

  it("should throw error if requireActivePro fails", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null })
    };
    (createClient as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockSupabase);

    await expect(requireActivePro("user-1")).rejects.toThrow("Pro membership required");
  });
});
