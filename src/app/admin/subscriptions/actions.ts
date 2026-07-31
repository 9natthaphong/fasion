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

  // Execute atomic approval RPC
  const { data: rpcResult, error: rpcError } = await adminClient.rpc('approve_subscription_request', {
    p_request_id: parsed.data.requestId,
    p_user_id: parsed.data.userId,
    p_is_first_month: parsed.data.isFirstMonth,
    p_admin_id: admin.id
  });

  if (rpcError) {
    console.error("Atomic approval failed:", rpcError);
    throw new Error("Failed to approve request: " + rpcError.message);
  }

  if (rpcResult?.status === 'already_approved') {
    // Idempotent: already processed
    revalidatePath("/admin/subscriptions");
    return;
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
