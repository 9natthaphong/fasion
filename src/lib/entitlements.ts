import { createClient } from "./supabase/server";
import { hasProductProEntitlement } from "@/lib/capabilities";
import type { UserRole } from "@/lib/types";

export async function getCustomerEntitlements(userId: string, role: UserRole = "customer") {
  if (role === "admin") {
    return { isProActive: true, plan: "pro", status: "active" };
  }
  const supabase = await createClient();
  const { data: subscription } = await supabase
    .from("customer_subscriptions")
    .select("plan, status, ends_at")
    .eq("user_id", userId)
    .single();

  const isProActive = hasProductProEntitlement(role, subscription);

  return {
    isProActive,
    plan: subscription?.plan || "free",
    status: subscription?.status || "pending",
  };
}

export async function requireActivePro(userId: string, role: UserRole = "customer") {
  const entitlements = await getCustomerEntitlements(userId, role);
  if (!entitlements.isProActive) {
    throw new Error("Pro membership required");
  }
}
