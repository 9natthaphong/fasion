"use server";

import { requirePageRole } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function uploadPaymentSlip(formData: FormData) {
  const user = await requirePageRole(["customer"], "/login/customer");
  
  const file = formData.get("slip") as File;
  const requestId = formData.get("requestId") as string;
  const expectedAmount = parseFloat(formData.get("expectedAmount") as string);

  if (!file || !requestId || isNaN(expectedAmount)) {
    return { error: "ข้อมูลไม่ครบถ้วน" };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: "ไฟล์มีขนาดเกิน 5MB" };
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return { error: "รองรับเฉพาะไฟล์รูปภาพ (JPEG, PNG, WEBP) เท่านั้น" };
  }

  const adminClient = getAdminClient();

  // Validate request ownership and state
  const { data: request } = await adminClient
    .from("customer_subscription_requests")
    .select("id, user_id, status")
    .eq("id", requestId)
    .single();

  if (!request || request.user_id !== user.id || request.status !== "pending") {
    return { error: "คำขอไม่ถูกต้องหรือหมดอายุแล้ว" };
  }

  const extension = file.name.split(".").pop();
  const safeFilename = crypto.randomUUID() + (extension ? `.${extension}` : "");
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
    return { error: "ไม่สามารถอัปโหลดไฟล์ได้ กรุณาลองใหม่" };
  }

  // Soft delete any previously submitted proofs
  await adminClient
    .from("subscription_payment_proofs")
    .update({ status: "superseded" })
    .eq("request_id", requestId)
    .eq("status", "submitted");

  // Insert payment proof
  const { error: dbError } = await adminClient
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
    });

  if (dbError) {
    console.error("DB insert error:", dbError);
    return { error: "บันทึกข้อมูลไม่สำเร็จ" };
  }

  // Update request status
  await adminClient
    .from("customer_subscription_requests")
    .update({ payment_status: "submitted" })
    .eq("id", requestId);

  revalidatePath("/account/subscription/payment");
  revalidatePath("/account/subscription");
  revalidatePath("/admin/subscriptions");
  return { success: true };
}
