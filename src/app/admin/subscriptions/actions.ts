"use server";

import { getAdminClient } from "@/lib/supabase/admin";
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

  const adminClient = getAdminClient();
  const price = parsed.data.isFirstMonth ? 9 : 29;

  const startsAt = new Date();
  const endsAt = new Date();
  endsAt.setMonth(endsAt.getMonth() + 1);

  // Check idempotency
  const { data: requestCheck } = await adminClient
    .from("customer_subscription_requests")
    .select("status, payment_status")
    .eq("id", parsed.data.requestId)
    .single();

  if (!requestCheck || requestCheck.status !== "pending") {
    revalidatePath("/admin/subscriptions");
    return;
  }
  
  if (requestCheck.payment_status !== "submitted" && requestCheck.payment_status !== "verified") {
    throw new Error("Payment proof is not ready for approval.");
  }

  // 0. Update payment proof status to verified
  await adminClient
    .from("subscription_payment_proofs")
    .update({ 
      status: "verified",
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString()
    })
    .eq("request_id", parsed.data.requestId)
    .eq("status", "submitted");

  // 1. Update the request status
  const { error: updateErr } = await adminClient
    .from("customer_subscription_requests")
    .update({ 
      status: "approved", 
      payment_status: "verified",
      reviewed_by: admin.id, 
      reviewed_at: new Date().toISOString() 
    })
    .eq("id", parsed.data.requestId)
    .eq("status", "pending");

  if (updateErr) throw new Error("Failed to update request");

  // 2. Insert or update the subscription
  const { data: existingSub } = await adminClient
    .from("customer_subscriptions")
    .select("id")
    .eq("user_id", parsed.data.userId)
    .single();

  if (existingSub) {
    await adminClient
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
    await adminClient
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

  const adminClient = getAdminClient();

  // Update payment proof
  await adminClient
    .from("subscription_payment_proofs")
    .update({ 
      status: "rejected",
      rejection_reason: parsed.data.reason,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString()
    })
    .eq("request_id", parsed.data.requestId)
    .eq("status", "submitted");

  const { error } = await adminClient
    .from("customer_subscription_requests")
    .update({ 
      status: "rejected", 
      payment_status: "not_submitted", // or keep it as submitted/verified depending on design, but prompt says needs_resubmission or rejected
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

export async function requestResubmission(requestId: string, reason: string) {
  const admin = await requirePageRole(["admin"], "/login/admin");
  const parsed = RejectRequestSchema.safeParse({ requestId, reason });
  if (!parsed.success) throw new Error("Invalid request data.");

  const adminClient = getAdminClient();

  // Update payment proof
  await adminClient
    .from("subscription_payment_proofs")
    .update({ 
      status: "rejected",
      rejection_reason: parsed.data.reason,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString()
    })
    .eq("request_id", parsed.data.requestId)
    .eq("status", "submitted");

  const { error } = await adminClient
    .from("customer_subscription_requests")
    .update({ 
      payment_status: "needs_resubmission",
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

  const adminClient = getAdminClient();

  await adminClient
    .from("customer_subscriptions")
    .update({ 
      status: "revoked", 
      revoked_at: new Date().toISOString() 
    })
    .eq("id", parsed.data.subscriptionId);

  revalidatePath("/admin/subscriptions");
}
