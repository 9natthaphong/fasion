import { getAdminClient } from "@/lib/supabase/admin";

export interface AccountDeletionResult {
  success: boolean;
  error?: string;
  requestId: string;
  targetUserId?: string;
}

export async function processAccountDeletion(
  requestId: string,
  adminUserEmail: string,
): Promise<AccountDeletionResult> {
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!adminUserEmail || !adminEmails.includes(adminUserEmail.toLowerCase())) {
    return { success: false, error: "Unauthorized admin email", requestId };
  }

  const supabaseAdmin = getAdminClient();

  // 1. Fetch deletion request
  const { data: requestRow, error: reqErr } = await supabaseAdmin
    .from("account_deletion_requests")
    .select("id, user_id, status")
    .eq("id", requestId)
    .maybeSingle();

  if (reqErr || !requestRow) {
    return { success: false, error: "Request not found", requestId };
  }

  const targetUserId = requestRow.user_id;

  // 2. Fetch target user profile and verify role is customer
  const { data: targetProfile } = await supabaseAdmin
    .from("profiles")
    .select("id, role")
    .eq("id", targetUserId)
    .maybeSingle();

  if (targetProfile && targetProfile.role === "merchant") {
    await supabaseAdmin
      .from("account_deletion_requests")
      .update({ status: "rejected" })
      .eq("id", requestId);
    return {
      success: false,
      error: "Merchant account deletion requires manual shop review and cannot be auto-deleted",
      requestId,
      targetUserId,
    };
  }

  try {
    // 3. Anonymize analytics (preserve aggregate counts)
    await supabaseAdmin.from("ad_impressions").update({ user_id: null }).eq("user_id", targetUserId);
    await supabaseAdmin.from("ad_clicks").update({ user_id: null }).eq("user_id", targetUserId);
    await supabaseAdmin.from("shop_views").update({ user_id: null }).eq("user_id", targetUserId);

    // 4. Clean up Storage assets (wardrobe-assets bucket)
    const { data: wardrobeItems } = await supabaseAdmin
      .from("wardrobe_items")
      .select("image_path")
      .eq("user_id", targetUserId);

    if (wardrobeItems && wardrobeItems.length > 0) {
      const storagePaths = wardrobeItems.map((w) => w.image_path).filter(Boolean);
      if (storagePaths.length > 0) {
        await supabaseAdmin.storage.from("wardrobe-assets").remove(storagePaths);
      }
    }

    // 5. Delete customer relational data
    await supabaseAdmin.from("customer_fit_profiles").delete().eq("user_id", targetUserId);
    await supabaseAdmin.from("customer_preferences").delete().eq("user_id", targetUserId);
    await supabaseAdmin.from("wear_logs").delete().eq("user_id", targetUserId);
    await supabaseAdmin.from("outfit_feedback").delete().eq("user_id", targetUserId);

    // Delete saved outfits and items
    const { data: savedOutfits } = await supabaseAdmin
      .from("saved_outfits")
      .select("id")
      .eq("user_id", targetUserId);

    if (savedOutfits && savedOutfits.length > 0) {
      const savedIds = savedOutfits.map((s) => s.id);
      await supabaseAdmin.from("saved_outfit_items").delete().in("saved_outfit_id", savedIds);
      await supabaseAdmin.from("saved_outfits").delete().eq("user_id", targetUserId);
    }

    // Delete outfit requests, results, items
    const { data: outfitRequests } = await supabaseAdmin
      .from("outfit_requests")
      .select("id")
      .eq("user_id", targetUserId);

    if (outfitRequests && outfitRequests.length > 0) {
      const reqIds = outfitRequests.map((r) => r.id);
      const { data: outfitResults } = await supabaseAdmin
        .from("outfit_results")
        .select("id")
        .in("request_id", reqIds);

      if (outfitResults && outfitResults.length > 0) {
        const resIds = outfitResults.map((res) => res.id);
        await supabaseAdmin.from("outfit_result_items").delete().in("result_id", resIds);
        await supabaseAdmin.from("outfit_results").delete().in("request_id", reqIds);
      }
      await supabaseAdmin.from("outfit_requests").delete().eq("user_id", targetUserId);
    }

    await supabaseAdmin.from("ad_likes").delete().eq("user_id", targetUserId);
    await supabaseAdmin.from("wardrobe_items").delete().eq("user_id", targetUserId);

    // Delete profile
    await supabaseAdmin.from("profiles").delete().eq("id", targetUserId);

    // 6. Delete auth user in Supabase Auth
    const { error: authDeleteErr } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
    if (authDeleteErr && !authDeleteErr.message.includes("User not found")) {
      console.error("[DELETION_AUTH_USER_ERROR]", authDeleteErr.message);
    }

    // 7. Update deletion request status to completed
    await supabaseAdmin
      .from("account_deletion_requests")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", requestId);

    return { success: true, requestId, targetUserId };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error during deletion";
    console.error("[ACCOUNT_DELETION_PROCESS_FAILURE]", errorMsg);
    await supabaseAdmin
      .from("account_deletion_requests")
      .update({ status: "failed" })
      .eq("id", requestId);
    return { success: false, error: "Deletion processing failed", requestId, targetUserId };
  }
}
