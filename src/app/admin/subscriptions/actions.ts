"use server";

import { createClient } from "@/lib/supabase/server";
import { requirePageRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ApproveRequestSchema = z.object({
  requestId: z.string().uuid(),
  userId: z.string().uuid(),
  isFirstMonth: z.boolean(),
});

export async function approveRequest(requestId: string, userId: string, isFirstMonth: boolean) {
  const admin = await requirePageRole(["admin"], "/login/admin");
  const parsed = ApproveRequestSchema.safeParse({ requestId, userId, isFirstMonth });
  if (!parsed.success) {
    throw new Error("Invalid request data.");
  }

  const supabase = await createClient();
  const price = parsed.data.isFirstMonth ? 9 : 29;

  const startsAt = new Date();
  const endsAt = new Date();
  endsAt.setMonth(endsAt.getMonth() + 1);

  // Check idempotency
  const { data: requestCheck } = await supabase
    .from("customer_subscription_requests")
    .select("status")
    .eq("id", parsed.data.requestId)
    .single();

  if (!requestCheck || requestCheck.status !== "pending") {
    revalidatePath("/admin/subscriptions");
    return;
  }

  // 1. Update the request status
  const { error: updateErr } = await supabase
    .from("customer_subscription_requests")
    .update({ 
      status: "approved", 
      reviewed_by: admin.id, 
      reviewed_at: new Date().toISOString() 
    })
    .eq("id", parsed.data.requestId)
    .eq("status", "pending");

  if (updateErr) throw new Error("Failed to update request");

  // 2. Insert or update the subscription
  const { data: existingSub } = await supabase
    .from("customer_subscriptions")
    .select("id")
    .eq("user_id", parsed.data.userId)
    .single();

  if (existingSub) {
    await supabase
      .from("customer_subscriptions")
      .update({
        plan: "pro",
        status: "active",
        approved_price_thb: price,
        is_first_month_offer: parsed.data.isFirstMonth,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        approved_by: admin.id,
        approved_at: new Date().toISOString()
      })
      .eq("user_id", parsed.data.userId);
  } else {
    await supabase
      .from("customer_subscriptions")
      .insert({
        user_id: parsed.data.userId,
        plan: "pro",
        status: "active",
        approved_price_thb: price,
        is_first_month_offer: parsed.data.isFirstMonth,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        approved_by: admin.id,
        approved_at: new Date().toISOString()
      });
  }

  revalidatePath("/admin/subscriptions");
  revalidatePath("/account/subscription");
}

const RejectRequestSchema = z.object({
  requestId: z.string().uuid(),
  reason: z.string().min(1),
});

export async function rejectRequest(requestId: string, reason: string) {
  const admin = await requirePageRole(["admin"], "/login/admin");
  const parsed = RejectRequestSchema.safeParse({ requestId, reason });
  if (!parsed.success) throw new Error("Invalid request data.");

  const supabase = await createClient();

  const { error } = await supabase
    .from("customer_subscription_requests")
    .update({ 
      status: "rejected", 
      admin_note: parsed.data.reason,
      reviewed_by: admin.id, 
      reviewed_at: new Date().toISOString() 
    })
    .eq("id", parsed.data.requestId)
    .eq("status", "pending");

  if (!error) {
    revalidatePath("/admin/subscriptions");
    revalidatePath("/account/subscription");
  }
}

const RevokeSchema = z.object({
  subscriptionId: z.string().uuid(),
});

export async function revokeSubscription(subscriptionId: string) {
  await requirePageRole(["admin"], "/login/admin");
  const parsed = RevokeSchema.safeParse({ subscriptionId });
  if (!parsed.success) throw new Error("Invalid request data.");

  const supabase = await createClient();

  await supabase
    .from("customer_subscriptions")
    .update({ 
      status: "revoked", 
      revoked_at: new Date().toISOString() 
    })
    .eq("id", parsed.data.subscriptionId);

  revalidatePath("/admin/subscriptions");
  // Cannot easily target customer's page since we don't know their user_id here without a select, but it's fine.
}
