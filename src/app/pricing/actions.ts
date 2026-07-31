"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { canUseCustomerBilling } from "@/lib/capabilities";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function requestProAccess() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!canUseCustomerBilling(user.role)) {
    redirect("/account/subscription?adminMode=1");
  }

  const supabase = await createClient();

  // Check if there is an existing pending request
  const { data: existing } = await supabase
    .from("customer_subscription_requests")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .single();

  if (existing) {
    redirect("/account/subscription/payment");
  }

  const { error } = await supabase
    .from("customer_subscription_requests")
    .insert({
      user_id: user.id,
      requested_plan: "pro",
      status: "pending",
    });

  if (error) {
    console.error("Error creating subscription request", error);
    throw new Error("Failed to request Pro access.");
  }

  revalidatePath("/account/subscription");
  redirect("/account/subscription/payment");
}
