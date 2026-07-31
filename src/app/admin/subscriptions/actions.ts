"use server";

import { createClient } from "@/lib/supabase/server";
import { requirePageRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function approveRequest(requestId: string, userId: string, price: number, isFirstMonth: boolean) {
  const admin = await requirePageRole(["admin"], "/login/admin");
  const supabase = await createClient();

  const startsAt = new Date();
  const endsAt = new Date();
  endsAt.setMonth(endsAt.getMonth() + 1);

  // 1. Update the request status
  await supabase
    .from("customer_subscription_requests")
    .update({ 
      status: "active", 
      reviewed_by: admin.id, 
      reviewed_at: new Date().toISOString() 
    })
    .eq("id", requestId);

  // 2. Insert or update the subscription
  const { data: existingSub } = await supabase
    .from("customer_subscriptions")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (existingSub) {
    await supabase
      .from("customer_subscriptions")
      .update({
        plan: "pro",
        status: "active",
        approved_price_thb: price,
        is_first_month_offer: isFirstMonth,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        approved_by: admin.id,
        approved_at: new Date().toISOString()
      })
      .eq("user_id", userId);
  } else {
    await supabase
      .from("customer_subscriptions")
      .insert({
        user_id: userId,
        plan: "pro",
        status: "active",
        approved_price_thb: price,
        is_first_month_offer: isFirstMonth,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        approved_by: admin.id,
        approved_at: new Date().toISOString()
      });
  }

  revalidatePath("/admin/subscriptions");
}

export async function rejectRequest(requestId: string, reason: string) {
  const admin = await requirePageRole(["admin"], "/login/admin");
  const supabase = await createClient();

  await supabase
    .from("customer_subscription_requests")
    .update({ 
      status: "rejected", 
      admin_note: reason,
      reviewed_by: admin.id, 
      reviewed_at: new Date().toISOString() 
    })
    .eq("id", requestId);

  revalidatePath("/admin/subscriptions");
}

export async function revokeSubscription(subscriptionId: string) {
  await requirePageRole(["admin"], "/login/admin");
  const supabase = await createClient();

  await supabase
    .from("customer_subscriptions")
    .update({ 
      status: "revoked", 
      revoked_at: new Date().toISOString() 
    })
    .eq("id", subscriptionId);

  revalidatePath("/admin/subscriptions");
}
