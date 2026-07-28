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
    .select("id, user_id, target_user_id, status")
    .eq("id", requestId)
    .maybeSingle();

  if (reqErr || !requestRow) {
    return { success: false, error: "Request not found", requestId };
  }
  
  if (requestRow.status === 'completed') {
    return { success: true, requestId, targetUserId: requestRow.target_user_id || requestRow.user_id || undefined };
  }

  // 2. Atomically claim
  const { data: claimSuccess, error: claimErr } = await supabaseAdmin.rpc('claim_deletion_request', {
    p_request_id: requestId,
    p_admin_id: adminUserId
  });
  
  if (claimErr || !claimSuccess) {
    return { success: false, error: "Failed to claim request (concurrent or invalid status)", requestId };
  }

  const targetUserId = requestRow.target_user_id || requestRow.user_id;
  if (!targetUserId) {
    try {
      await markFailed(supabaseAdmin, requestId, "MISSING_USER", "Target user ID is null");
    } catch (e) {
      return { success: false, error: "Target user ID is null (and failed to persist failure state)", requestId };
    }
    return { success: false, error: "Target user ID is null", requestId };
  }

  // 3. Fetch target user profile and verify role is customer
  // If the profile is already gone, it might be a retry, so it's safe to continue
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
    // If it's a retry and profile is gone, this block won't run, which is correct
    // (A merchant would have been rejected on the first try)
    const { error: rejectErr } = await supabaseAdmin
      .from("account_deletion_requests")
      .update({ 
        status: "rejected", 
        processed_at: new Date().toISOString(),
        failure_code: "MERCHANT_REJECTED",
        failure_message: "Merchant deletion requires manual review"
      })
      .eq("id", requestId);
    if (rejectErr) {
      return { success: false, error: "Failed to persist rejection state", requestId, targetUserId };
    }
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

    // 5. Clean up Storage assets (recursive)
    const cleanupFolder = async (bucket: string, prefix: string) => {
      let pathsToRemove: string[] = [];
      const listRecursive = async (currentPrefix: string) => {
        const { data: files, error } = await supabaseAdmin.storage.from(bucket).list(currentPrefix);
        if (error) throw new Error(`Failed to list ${bucket}`);
        if (!files || files.length === 0) return;
        
        for (const file of files) {
          // If it's a folder, there's no way to know except by checking if it has no id/size but just a name
          // Supabase returns folders with metadata missing except name. But let's just list everything just in case,
          // or assume if size is missing it's a folder. Wait, the simplest way is to fetch all paths.
          // In Supabase, list() returns folders and files. Folders lack id/size.
          const isFolder = !file.id && !file.updated_at;
          const fullPath = `${currentPrefix}/${file.name}`;
          if (isFolder) {
            await listRecursive(fullPath);
          } else {
            pathsToRemove.push(fullPath);
          }
        }
      };
      
      await listRecursive(prefix);
      
      // Batch remove in chunks of 100
      for (let i = 0; i < pathsToRemove.length; i += 100) {
        const batch = pathsToRemove.slice(i, i + 100);
        // Ensure we only delete within the prefix
        const safeBatch = batch.filter(p => p.startsWith(`${targetUserId}/`));
        if (safeBatch.length > 0) {
          const { error } = await supabaseAdmin.storage.from(bucket).remove(safeBatch);
          if (error) throw new Error(`Failed to remove ${bucket} assets`);
        }
      }
    };

    await cleanupFolder("wardrobe-assets", targetUserId);
    await cleanupFolder("avatars", targetUserId);

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
        await del('outfit_result_items', supabaseAdmin.from("outfit_result_items").delete().in("outfit_result_id", resIds));
        await del('outfit_results', supabaseAdmin.from("outfit_results").delete().in("request_id", reqIds));
      }
      await del('outfit_requests', supabaseAdmin.from("outfit_requests").delete().eq("user_id", targetUserId));
    }

    await del('ad_likes', supabaseAdmin.from("ad_likes").delete().eq("user_id", targetUserId));
    await del('wardrobe_items', supabaseAdmin.from("wardrobe_items").delete().eq("user_id", targetUserId));

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

    // 9. Atomically record audit and update to completed
    const { data: finalReq, error: finalizeErr } = await supabaseAdmin.rpc('finalize_account_deletion', {
      p_request_id: requestId,
      p_admin_id: adminUserId
    });

    if (finalizeErr || !finalReq) {
      throw new Error("Failed to atomically finalize deletion request");
    }

    // Validate finalizer returned row
    if (finalReq.id !== requestId) throw new Error("Finalizer returned mismatched ID");
    if (finalReq.status !== "completed") throw new Error("Finalizer did not set status to completed");
    if (finalReq.user_id !== null) throw new Error("Finalizer did not nullify user_id");
    if (finalReq.target_user_id !== targetUserId) throw new Error("Finalizer altered target_user_id");
    if (finalReq.processed_by !== adminUserId) throw new Error("Finalizer altered processed_by");
    if (!finalReq.processed_at) throw new Error("Finalizer did not set processed_at");
    if (!finalReq.completed_at) throw new Error("Finalizer did not set completed_at");
    if (finalReq.attempt_count < 1) throw new Error("Finalizer attempt_count invalid");

    return { success: true, requestId, targetUserId };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error during deletion";
    const safeError = errorMsg.includes("Failed") || errorMsg.includes("exists") || errorMsg.includes("Finalizer") ? errorMsg : "Deletion processing failed due to internal error";
    console.error("[ACCOUNT_DELETION_PROCESS_FAILURE]", safeError);
    try {
      await markFailed(supabaseAdmin, requestId, "PROCESSING_ERROR", safeError);
    } catch (markErr) {
      return { success: false, error: safeError + " (and failed to persist failure state)", requestId, targetUserId };
    }
    return { success: false, error: safeError, requestId, targetUserId };
  }
}

async function markFailed(supabaseAdmin: ReturnType<typeof getAdminClient>, requestId: string, code: string, msg: string) {
  const { error } = await supabaseAdmin
    .from("account_deletion_requests")
    .update({ 
      status: "failed",
      failure_code: code,
      failure_message: msg
    })
    .eq("id", requestId);
  if (error) {
    throw new Error(`Failed to persist failure state: ${code}`);
  }
}
