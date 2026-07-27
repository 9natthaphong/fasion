import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../../supabase/migrations/20260727000100_initial_schema.sql", import.meta.url),
  "utf8",
).toLowerCase();
const hardeningMigration = readFileSync(
  new URL(
    "../../supabase/migrations/20260727145323_harden_merchant_ad_assets.sql",
    import.meta.url,
  ),
  "utf8",
).toLowerCase();

const exposedTables = [
  "profiles",
  "customer_preferences",
  "shops",
  "shop_members",
  "categories",
  "ads",
  "ad_categories",
  "ad_images",
  "ad_likes",
  "ad_impressions",
  "ad_clicks",
  "shop_views",
  "outfit_requests",
  "outfit_results",
  "account_deletion_requests",
];

describe("database migration security invariants", () => {
  it.each(exposedTables)("enables RLS on %s", (table) => {
    expect(migration).toContain(`alter table public.${table} enable row level security`);
  });

  it("keeps analytics events server-written", () => {
    expect(migration).not.toMatch(/grant insert on public\.ad_impressions[^;]*authenticated/);
    expect(migration).not.toMatch(/grant insert on public\.ad_clicks[^;]*authenticated/);
    expect(migration).not.toMatch(/grant insert on public\.shop_views[^;]*authenticated/);
  });

  it("uses column grants to protect moderation fields", () => {
    const shopGrant = migration.match(/grant update \([\s\S]*?\) on public\.shops to authenticated/)?.[0] ?? "";
    expect(shopGrant).not.toContain("subscription_status");
    expect(shopGrant).not.toContain("status,");
  });

  it("does not grant secret RPCs to authenticated users", () => {
    expect(migration).toContain("grant execute on function public.consume_rate_limit");
    expect(migration).toContain("to service_role");
    expect(migration).not.toMatch(/grant execute on function public\.record_admin_audit[^;]*authenticated/);
  });

  it("creates private image buckets with MIME restrictions", () => {
    for (const bucket of ["avatars", "shop-assets", "ad-assets"]) {
      expect(migration).toContain(`('${bucket}', '${bucket}', false`);
    }
    expect(migration).toContain("array['image/jpeg', 'image/png', 'image/webp']");
  });

  it("hardens merchant ad transitions and asset ownership", () => {
    expect(hardeningMigration).toContain("merchant ads must be created as draft");
    expect(hardeningMigration).toContain("active ads may only be paused by merchants");
    expect(hardeningMigration).toContain("private.is_owned_ad_asset_path");
    expect(hardeningMigration).toContain("ads under review cannot be changed by merchants");
  });
});
