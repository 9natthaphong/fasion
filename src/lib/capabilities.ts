import type { UserRole } from "@/lib/types";

export type CustomerSubscription = {
  plan?: string | null;
  status?: string | null;
  ends_at?: string | null;
} | null;

export function canAccessCustomerExperience(role: UserRole): boolean {
  return role === "customer" || role === "admin";
}

export function canManageAdmin(role: UserRole): boolean {
  return role === "admin";
}

export function canUseCustomerBilling(role: UserRole): boolean {
  return role === "customer";
}

export function hasProductProEntitlement(
  role: UserRole,
  subscription: CustomerSubscription,
): boolean {
  if (role === "admin") return true;
  if (role !== "customer") return false;

  return (
    subscription?.plan === "pro" &&
    subscription.status === "active" &&
    (!subscription.ends_at || new Date(subscription.ends_at) > new Date())
  );
}
