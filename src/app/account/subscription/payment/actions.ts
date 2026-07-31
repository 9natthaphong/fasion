"use server";

import { requirePageRole } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type UploadPaymentSlipResult =
  | { ok: true; alreadySubmitted?: boolean }
  | { ok: false; error: string };

const RequestIdSchema = z.string().uuid();

function extensionForMimeType(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return null;
  }
}

export async function uploadPaymentSlip(formData: FormData): Promise<UploadPaymentSlipResult> {
  const user = await requirePageRole(["customer"], "/login/customer");

  const fileValue = formData.get("slip");
  const requestIdValue = formData.get("requestId");
  const file = fileValue instanceof File ? fileValue : null;
  const requestId = typeof requestIdValue === "string" ? requestIdValue : "";

  if (!file || !RequestIdSchema.safeParse(requestId).success) {
    return { ok: false, error: "ข้อมูลไม่ครบถ้วน" };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: "ไฟล์มีขนาดเกิน 5MB" };
  }

  const extension = extensionForMimeType(file.type);
  if (!extension) {
    return { ok: false, error: "รองรับเฉพาะไฟล์รูปภาพ (JPEG, PNG, WEBP) เท่านั้น" };
  }

  const adminClient = getAdminClient();

  // Validate request ownership and state
  const { data: request } = await adminClient
    .from("customer_subscription_requests")
    .select("id, user_id, status")
    .eq("id", requestId)
    .single();

  if (!request || request.user_id !== user.id || request.status !== "pending") {
    return { ok: false, error: "คำขอไม่ถูกต้องหรือหมดอายุแล้ว" };
  }

  const { data: existingProof, error: existingProofError } = await adminClient
    .from("subscription_payment_proofs")
    .select("id")
    .eq("request_id", requestId)
    .eq("user_id", user.id)
    .eq("status", "submitted")
    .maybeSingle();

  if (existingProofError) {
    console.error("Existing payment proof lookup error:", existingProofError);
    return { ok: false, error: "ตรวจสอบสถานะสลิปไม่สำเร็จ กรุณาลองใหม่" };
  }

  if (existingProof) {
    revalidatePath("/account/subscription/payment");
    revalidatePath("/account/subscription");
    return { ok: true, alreadySubmitted: true };
  }

  const { data: subscription, error: subscriptionError } = await adminClient
    .from("customer_subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .maybeSingle();

  if (subscriptionError) {
    console.error("Subscription lookup error:", subscriptionError);
    return { ok: false, error: "ตรวจสอบแพ็กเกจไม่สำเร็จ กรุณาลองใหม่" };
  }

  // The browser's displayed amount is informational; persist only the
  // server-derived first-month or renewal amount.
  const expectedAmount = subscription?.plan === "pro" ? 29 : 9;
  const safeFilename = `${crypto.randomUUID()}.${extension}`;
  const storagePath = `${user.id}/${requestId}/${safeFilename}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to storage
  const { error: uploadError } = await adminClient.storage
    .from("payment-slips")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false
    });

  if (uploadError) {
    console.error("Storage upload error:", uploadError);
    return { ok: false, error: "ไม่สามารถอัปโหลดไฟล์ได้ กรุณาลองใหม่" };
  }

  // Insert payment proof
  const { data: insertedProof, error: dbError } = await adminClient
    .from("subscription_payment_proofs")
    .insert({
      request_id: requestId,
      user_id: user.id,
      storage_path: storagePath,
      original_filename_safe: file.name.replace(/[^a-zA-Z0-9.-]/g, "_"), // sanitize
      mime_type: file.type,
      file_size_bytes: file.size,
      expected_amount_thb: expectedAmount,
      status: "submitted",
    })
    .select("id")
    .single();

  if (dbError) {
    console.error("DB insert error:", dbError);
    await adminClient.storage.from("payment-slips").remove([storagePath]);
    if (dbError.code === "23505") {
      revalidatePath("/account/subscription/payment");
      revalidatePath("/account/subscription");
      return { ok: true, alreadySubmitted: true };
    }
    return { ok: false, error: "บันทึกข้อมูลไม่สำเร็จ" };
  }

  // Update request status
  const { data: updatedRequest, error: requestUpdateError } = await adminClient
    .from("customer_subscription_requests")
    .update({ payment_status: "submitted" })
    .eq("id", requestId)
    .eq("user_id", user.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (requestUpdateError || !updatedRequest) {
    console.error("Subscription request update error:", requestUpdateError);
    if (insertedProof?.id) {
      await adminClient.from("subscription_payment_proofs").delete().eq("id", insertedProof.id);
    }
    await adminClient.storage.from("payment-slips").remove([storagePath]);
    return { ok: false, error: "บันทึกสถานะการชำระเงินไม่สำเร็จ" };
  }

  revalidatePath("/account/subscription/payment");
  revalidatePath("/account/subscription");
  revalidatePath("/admin/subscriptions");
  return { ok: true };
}
