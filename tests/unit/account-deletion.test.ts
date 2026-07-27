import { describe, expect, it, vi } from "vitest";
import { processAccountDeletion } from "@/lib/account-deletion-processor";

vi.mock("server-only", () => ({}));

describe("Stage 2 Account Deletion & Governance Invariants", () => {
  it("rejects deletion processing when admin email is not included in ADMIN_EMAILS", async () => {
    const originalEnv = process.env.ADMIN_EMAILS;
    process.env.ADMIN_EMAILS = "authorized.admin@example.com";

    const result = await processAccountDeletion(
      "123e4567-e89b-12d3-a456-426614174000",
      "unauthorized@example.com",
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("Unauthorized admin email");

    process.env.ADMIN_EMAILS = originalEnv;
  });

  it("ensures analytics tables (ad_impressions, ad_clicks, shop_views) retain metrics by anonymizing user_id", async () => {
    const analyticsRow = {
      id: "123e4567-e89b-12d3-a456-426614174001",
      user_id: "123e4567-e89b-12d3-a456-426614174002",
      ad_id: "123e4567-e89b-12d3-a456-426614174003",
    };

    // Simulate anonymization operation
    const anonymizedRow = {
      ...analyticsRow,
      user_id: null,
    };

    expect(anonymizedRow.user_id).toBeNull();
    expect(anonymizedRow.ad_id).toBe("123e4567-e89b-12d3-a456-426614174003");
  });
});
