"use server";

import { getAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requirePageRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { canCancelInvalidSubscriptionRequest } from "@/lib/subscription-queue";

const ApproveRequestSchema = z.object({
  requestId: z.string().uuid(),
  userId: z.string().uuid(),
});

export async function approveRequest(requestId: string, userId: string) {
  const admin = await requirePageRole(["admin"], "/login/admin");
  const parsed = ApproveRequestSchema.safeParse({ requestId, userId });
  if (!parsed.success) {
    throw new Error("Invalid request data.");
  }

  // Use the authenticated SSR client for the RPC so auth.uid() and the
  // database admin check refer to the signed-in administrator. The RPC is
  // SECURITY DEFINER and owns the transaction; the service-role client must
  // not be used as a substitute for the caller identity.
  const supabase = await createClient();

  // Execute atomic approval RPC
  const { data: rpcResult, error: rpcError } = await supabase.rpc('approve_subscription_request', {
    p_request_id: parsed.data.requestId,
    p_user_id: parsed.data.userId,
    // Kept for the already-deployed RPC signature; the forward-fix migration
    // ignores this legacy hint and derives pricing from locked DB state.
    p_is_first_month: false,
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

const CancelInvalidRequestSchema = z.object({
  requestId: z.string().uuid(),
});

/**
 * Server Actions receive Next.js' built-in same-origin/CSRF protection. This
 * action is deliberately narrower than rejection: it can only mark a
 * pending request with no payment proof as rejected and never deletes data.
 */
export async function cancelInvalidRequest(requestId: string) {
  const admin = await requirePageRole(["admin"], "/login/admin");
  const parsed = CancelInvalidRequestSchema.safeParse({ requestId });
  if (!parsed.success) throw new Error("Invalid request data.");

  const adminClient = getAdminClient();
  const { data: request, error: requestError } = await adminClient
    .from("customer_subscription_requests")
    .select("id, user_id, status, payment_status")
    .eq("id", parsed.data.requestId)
    .maybeSingle();

  if (requestError || !request) throw new Error("ไม่พบคำขอสมาชิก");
  if (!canCancelInvalidSubscriptionRequest({ ...request, hasProof: false })) throw new Error("ยกเลิกได้เฉพาะคำขอที่ยังไม่มีสลิปเท่านั้น");

  const { data: proof, error: proofError } = await adminClient
    .from("subscription_payment_proofs")
    .select("id")
    .eq("request_id", request.id)
    .limit(1)
    .maybeSingle();
  if (proofError) throw new Error("ตรวจสอบหลักฐานการชำระเงินไม่สำเร็จ");
  if (proof) throw new Error("คำขอนี้มีหลักฐานการชำระเงินแล้ว");

  const now = new Date().toISOString();
  const note = "ยกเลิกคำขอของบัญชีผู้ดูแลระบบ";
  const { error: updateError } = await adminClient
    .from("customer_subscription_requests")
    .update({
      status: "rejected",
      admin_note: note,
      reviewed_by: admin.id,
      reviewed_at: now,
    })
    .eq("id", request.id)
    .eq("status", "pending")
    .eq("payment_status", "not_submitted");
  if (updateError) throw new Error("ยกเลิกคำขอไม่สำเร็จ");

  await adminClient.rpc("record_admin_audit", {
    p_actor_id: admin.id,
    p_action: "cancel_invalid_subscription_request",
    p_entity_type: "customer_subscription_requests",
    p_entity_id: request.id,
    p_before_data: request,
    p_after_data: { ...request, status: "rejected", admin_note: note },
  });

  revalidatePath("/admin/subscriptions");
  revalidatePath("/account/subscription");
}

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
