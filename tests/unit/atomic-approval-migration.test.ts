import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL(
    "../../supabase/migrations/20260731200000_harden_atomic_subscription_approval.sql",
    import.meta.url,
  ),
  "utf8",
).toLowerCase();

describe("atomic subscription approval forward fix", () => {
  it("binds authorization to the authenticated admin", () => {
    expect(migration).toContain("role::text = 'admin'");
    expect(migration).not.toContain("public.user_role");
    expect(migration).toContain("auth.uid() is null");
    expect(migration).toContain("not private.is_admin()");
    expect(migration).toContain("p_admin_id is distinct from auth.uid()");
    expect(migration).toContain("revoke execute");
    expect(migration).toContain("from public, anon, service_role");
    expect(migration).toContain("to authenticated");
  });

  it("derives the amount from locked server subscription state", () => {
    expect(migration).toContain("for update");
    expect(migration).toContain("v_existing_sub.plan = 'pro'");
    expect(migration).toContain("if v_existing_sub.id is not null");
    expect(migration).toContain("case when v_has_prior_pro then 29.00 else 9.00 end");
    expect(migration).not.toContain("case when p_is_first_month");
  });

  it("checks proof ownership and makes repeated approval a no-op", () => {
    expect(migration).toContain("user_id = v_request.user_id");
    expect(migration).toContain("already_approved");
    expect(migration).toContain("insert into private.admin_audit_log");
  });
});
