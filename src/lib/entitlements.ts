import { createClient } from "./supabase/server";

export async function getCustomerEntitlements(userId: string) {
  const supabase = await createClient();
  const { data: subscription } = await supabase
    .from("customer_subscriptions")
    .select("plan, status, ends_at")
    .eq("user_id", userId)
    .single();

  const isProActive =
    subscription?.plan === "pro" &&
    subscription?.status === "active" &&
    (!subscription?.ends_at || new Date(subscription.ends_at) > new Date());

  return {
    isProActive,
    plan: subscription?.plan || "free",
    status: subscription?.status || "pending",
  };
}

export async function requireActivePro(userId: string) {
  const entitlements = await getCustomerEntitlements(userId);
  if (!entitlements.isProActive) {
    throw new Error("Pro membership required");
  }
}
