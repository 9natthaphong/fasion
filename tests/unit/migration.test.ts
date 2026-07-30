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
const staticAssetRepairMigration = readFileSync(
  new URL(
    "../../supabase/migrations/20260728235056_restrict_static_demo_ad_assets.sql",
    import.meta.url,
  ),
  "utf8",
).toLowerCase();
const optionalDestinationMigration = readFileSync(
  new URL(
    "../../supabase/migrations/20260730221500_optional_ad_destination_url.sql",
    import.meta.url,
  ),
  "utf8",
).toLowerCase();
const purchaseInfoMigration = readFileSync(
  new URL(
    "../../supabase/migrations/20260730234000_add_purchase_info.sql",
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

  it("limits repository-static ad images to fixed demo shops and files", () => {
    expect(staticAssetRepairMigration).toContain(
      "'00000000-0000-4000-8000-000000000101'::uuid",
    );
    expect(staticAssetRepairMigration).toContain(
      "'/images/fittoday/ad-pleated-pants.jpg'",
    );
    expect(staticAssetRepairMigration).not.toMatch(
      /p_path like '\/images\/%'/,
    );
    expect(staticAssetRepairMigration).not.toMatch(
      /p_path like '\/demo-assets\/%'/,
    );
  });

  it("makes destination_url optional and removes Shopee domain requirement", () => {
    expect(optionalDestinationMigration).toContain("alter table public.ads alter column destination_url drop not null");
    expect(optionalDestinationMigration).toContain("destination_url is null or char_length(destination_url) <= 2048");
    expect(optionalDestinationMigration).not.toContain("shopee.co.th");
  });

  it("adds purchase_info free-text column and preserves destination_url", () => {
    // Adds the new column additiviely
    expect(purchaseInfoMigration).toContain("add column purchase_info");
    // Adds length constraint
    expect(purchaseInfoMigration).toContain("ads_purchase_info_length_check");
    expect(purchaseInfoMigration).toContain("char_length(purchase_info) <= 500");
    expect(purchaseInfoMigration).toContain("ads_purchase_info_safe_text_check");
    // Does not drop destination_url (backward compat)
    expect(purchaseInfoMigration).not.toContain("drop column destination_url");
    // Does not drop the ads table
    expect(purchaseInfoMigration).not.toContain("drop table");
    // Backfills legacy ads
    expect(purchaseInfoMigration).toContain("purchase_info = destination_url");
    expect(purchaseInfoMigration).toContain("new.purchase_info is distinct from old.purchase_info");
    // Does not require shopee
    expect(purchaseInfoMigration).not.toContain("shopee.co.th");
  });
});
