import { getAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

export interface AccountDeletionResult {
  success: boolean;
  error?: string;
  requestId: string;
  targetUserId?: string;
}

export async function processAccountDeletion(
  requestId: string,
  adminUserEmail: string,
  adminUserId: string,
): Promise<AccountDeletionResult> {
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!adminUserEmail || !adminEmails.includes(adminUserEmail.toLowerCase())) {
    return { success: false, error: "Unauthorized admin email", requestId };
  }

  const supabaseAdmin = getAdminClient();

  // Validate UUID
  const uuidSchema = z.string().uuid();
  if (!uuidSchema.safeParse(requestId).success) {
    return { success: false, error: "Invalid Request ID", requestId };
  }
  
  if (!uuidSchema.safeParse(adminUserId).success) {
    return { success: false, error: "Invalid Admin ID", requestId };
  }

  // 1. Fetch deletion request and its current status
  const { data: requestRow, error: reqErr } = await supabaseAdmin
    .from("account_deletion_requests")
    .select("id, user_id, status")
    .eq("id", requestId)
    .maybeSingle();

  if (reqErr || !requestRow) {
    return { success: false, error: "Request not found", requestId };
  }
  
  if (requestRow.status === 'completed') {
    return { success: true, requestId, targetUserId: requestRow.user_id || undefined };
  }

  // 2. Atomically claim
  const { data: claimSuccess, error: claimErr } = await supabaseAdmin.rpc('claim_deletion_request', {
    p_request_id: requestId,
    p_admin_id: adminUserId
  });
  
  if (claimErr || !claimSuccess) {
    return { success: false, error: "Failed to claim request (concurrent or invalid status)", requestId };
  }

  const targetUserId = requestRow.user_id;
  if (!targetUserId) {
    await markFailed(supabaseAdmin, requestId, "MISSING_USER", "Target user ID is null");
    return { success: false, error: "Target user ID is null", requestId };
  }

  // 3. Fetch target user profile and verify role is customer
  const { data: targetProfile, error: profileErr } = await supabaseAdmin
    .from("profiles")
    .select("id, role")
    .eq("id", targetUserId)
    .maybeSingle();

  if (profileErr) {
    await markFailed(supabaseAdmin, requestId, "PROFILE_FETCH_ERR", "Failed to fetch profile");
    return { success: false, error: "Failed to fetch profile", requestId, targetUserId };
  }

  if (targetProfile && targetProfile.role === "merchant") {
    await supabaseAdmin
      .from("account_deletion_requests")
      .update({ 
        status: "rejected", 
        processed_at: new Date().toISOString(),
        failure_code: "MERCHANT_REJECTED",
        failure_message: "Merchant deletion requires manual review"
      })
      .eq("id", requestId);
    return {
      success: false,
      error: "Merchant account deletion requires manual shop review and cannot be auto-deleted",
      requestId,
      targetUserId,
    };
  }

  try {
    // 4. Anonymize analytics (preserve aggregate counts)
    const { error: err1 } = await supabaseAdmin.from("ad_impressions").update({ user_id: null }).eq("user_id", targetUserId);
    if (err1) throw new Error("Failed to anonymize ad_impressions");
    const { error: err2 } = await supabaseAdmin.from("ad_clicks").update({ user_id: null }).eq("user_id", targetUserId);
    if (err2) throw new Error("Failed to anonymize ad_clicks");
    const { error: err3 } = await supabaseAdmin.from("shop_views").update({ user_id: null }).eq("user_id", targetUserId);
    if (err3) throw new Error("Failed to anonymize shop_views");

    // 5. Clean up Storage assets
    const { data: wardrobeItems, error: wardrobeErr } = await supabaseAdmin
      .from("wardrobe_items")
      .select("image_path")
      .eq("user_id", targetUserId);
      
    if (wardrobeErr) throw new Error("Failed to fetch wardrobe_items");

    if (wardrobeItems && wardrobeItems.length > 0) {
      const storagePaths = wardrobeItems.map((w) => w.image_path).filter(Boolean);
      // Ensure deletion is restricted to target user
      const safePaths = storagePaths.filter((p: string) => p.startsWith(`${targetUserId}/`));
      if (safePaths.length > 0) {
        const { error: stgErr } = await supabaseAdmin.storage.from("wardrobe-assets").remove(safePaths);
        if (stgErr) throw new Error("Failed to remove wardrobe assets");
      }
    }
    
    const { data: avFiles, error: listErr } = await supabaseAdmin.storage.from("avatars").list(targetUserId);
    if (listErr) throw new Error("Failed to list avatars");
    if (avFiles && avFiles.length > 0) {
      const avPaths = avFiles.map((f: { name: string }) => `${targetUserId}/${f.name}`);
      const { error: rmErr } = await supabaseAdmin.storage.from("avatars").remove(avPaths);
      if (rmErr) throw new Error("Failed to remove avatars");
    }

    // 6. Delete customer relational data
    const del = async (table: string, q: PromiseLike<{ error: Error | null }>) => {
      const { error } = await q;
      if (error) throw new Error(`Failed to delete from ${table}`);
    };
    
    await del('customer_fit_profiles', supabaseAdmin.from("customer_fit_profiles").delete().eq("user_id", targetUserId));
    await del('customer_preferences', supabaseAdmin.from("customer_preferences").delete().eq("user_id", targetUserId));
    await del('wear_logs', supabaseAdmin.from("wear_logs").delete().eq("user_id", targetUserId));
    await del('outfit_feedback', supabaseAdmin.from("outfit_feedback").delete().eq("user_id", targetUserId));

    const { data: savedOutfits } = await supabaseAdmin
      .from("saved_outfits")
      .select("id")
      .eq("user_id", targetUserId);

    if (savedOutfits && savedOutfits.length > 0) {
      const savedIds = savedOutfits.map((s) => s.id);
      await del('saved_outfit_items', supabaseAdmin.from("saved_outfit_items").delete().in("saved_outfit_id", savedIds));
      await del('saved_outfits', supabaseAdmin.from("saved_outfits").delete().eq("user_id", targetUserId));
    }

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
        // FIX: use outfit_result_id instead of result_id
        await del('outfit_result_items', supabaseAdmin.from("outfit_result_items").delete().in("outfit_result_id", resIds));
        await del('outfit_results', supabaseAdmin.from("outfit_results").delete().in("request_id", reqIds));
      }
      await del('outfit_requests', supabaseAdmin.from("outfit_requests").delete().eq("user_id", targetUserId));
    }

    await del('ad_likes', supabaseAdmin.from("ad_likes").delete().eq("user_id", targetUserId));
    await del('wardrobe_items', supabaseAdmin.from("wardrobe_items").delete().eq("user_id", targetUserId));

    // Wait for cascading deletes (profiles table delete is normally handled by auth cascade, but doing explicitly can be safer)
    // Wait, the prompt says: "Do not delete the public profile manually before Auth deletion if that could leave an Auth user without a profile."
    // 7. Delete the Auth user using the Supabase Admin API
    const { error: authDeleteErr } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
    if (authDeleteErr && !authDeleteErr.message.includes("User not found")) {
      throw new Error("Failed to delete Auth User");
    }

    // 8. Verify that the Auth user and profile no longer exist
    const { data: checkUser, error: checkAuthErr } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
    if (checkAuthErr && !checkAuthErr.message.includes("User not found")) {
      throw new Error("Failed to verify Auth user deletion");
    }
    if (checkUser && checkUser.user) {
      throw new Error("Auth User still exists after deletion attempt");
    }
    const { data: checkProfile, error: checkProfileErr } = await supabaseAdmin.from("profiles").select("id").eq("id", targetUserId).maybeSingle();
    if (checkProfileErr) {
      throw new Error("Failed to verify profile deletion");
    }
    if (checkProfile && checkProfile.id) {
      throw new Error("Profile still exists after deletion attempt");
    }

    // Record admin audit
    const { error: auditErr } = await supabaseAdmin.rpc('record_admin_audit', {
      p_actor_id: adminUserId,
      p_action: 'DELETE_ACCOUNT',
      p_entity_type: 'customer',
      p_entity_id: targetUserId,
      p_after_data: { request_id: requestId }
    });
    if (auditErr) {
      throw new Error("Failed to record admin audit");
    }

    // 9. Update preserved request to completed
    const { data: updateData, error: updateErr } = await supabaseAdmin
      .from("account_deletion_requests")
      .update({ 
        status: "completed", 
        processed_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        user_id: null
      })
      .eq("id", requestId)
      .select("status, user_id, processed_at, completed_at, processed_by, attempt_count");

    if (updateErr) {
      throw new Error("Failed to update deletion request to completed");
    }
    
    if (!updateData || updateData.length !== 1) {
      throw new Error("Failed to confirm exactly one deletion request was updated");
    }
    
    const finalRow = updateData[0];
    if (
      finalRow.status !== "completed" || 
      finalRow.user_id !== null || 
      !finalRow.processed_at || 
      !finalRow.completed_at || 
      !finalRow.processed_by || 
      finalRow.attempt_count < 1
    ) {
      throw new Error("Final request state is invalid");
    }

    return { success: true, requestId, targetUserId };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error during deletion";
    const safeError = errorMsg.includes("Failed") || errorMsg.includes("exists") ? errorMsg : "Deletion processing failed due to internal error";
    console.error("[ACCOUNT_DELETION_PROCESS_FAILURE]", safeError);
    await markFailed(supabaseAdmin, requestId, "PROCESSING_ERROR", safeError);
    return { success: false, error: safeError, requestId, targetUserId };
  }
}

async function markFailed(supabaseAdmin: ReturnType<typeof getAdminClient>, requestId: string, code: string, msg: string) {
  await supabaseAdmin
    .from("account_deletion_requests")
    .update({ 
      status: "failed",
      failure_code: code,
      failure_message: msg
    })
    .eq("id", requestId);
}
