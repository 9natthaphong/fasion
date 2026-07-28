/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { processAccountDeletion } from "@/lib/account-deletion-processor";

vi.mock("server-only", () => ({}));

let mockRpc: any;
let mockAuthAdminDeleteUser: any;
let mockAuthAdminGetUserById: any;
let mockStorageFromList: any;
let mockStorageFromRemove: any;

const tableErrors: Record<string, string | null> = {};
let selectError: any = null;
let updateError: any = null;
let deleteError: any = null;
let requestData: any = null;
let profileData: any = null;
let profileError: any = null;
let updateDataOverride: any = null;
let lastUpdateCall: any = null;

const createChain = (table: string, action: string) => {
  return {
    select: vi.fn().mockImplementation(() => createChain(table, action === 'update' ? 'update' : 'select')),
    update: vi.fn().mockImplementation((payload) => {
      lastUpdateCall = { table, payload };
      return createChain(table, 'update');
    }),
    insert: vi.fn().mockImplementation((payload) => {
      return createChain(table, 'insert');
    }),
    delete: vi.fn().mockImplementation(() => {
      if (tableErrors[table]) return { error: { message: tableErrors[table] }, data: null };
      if (deleteError) return { error: { message: deleteError }, data: null };
      return createChain(table, 'delete');
    }),
    eq: vi.fn().mockImplementation(() => createChain(table, action)),
    in: vi.fn().mockImplementation(() => createChain(table, action)),
    maybeSingle: vi.fn().mockImplementation(async () => {
      if (table === "account_deletion_requests") {
        if (selectError) return { error: { message: selectError }, data: null };
        return { error: null, data: requestData };
      }
      if (table === "profiles") {
        if (profileError) return { error: { message: profileError }, data: null };
        const ret = profileData ? { ...profileData } : null;
        profileData = null; // consume it so deletion verification returns null
        return { error: null, data: ret };
      }
      return { error: null, data: null };
    }),
    single: vi.fn().mockImplementation(async () => {
      return { error: null, data: null };
    }),
    then: function(resolve: any, reject: any) {
      if (tableErrors[table]) return Promise.resolve({ error: { message: tableErrors[table] }, data: null }).then(resolve, reject);
      if (action === 'delete') {
        if (deleteError) return Promise.resolve({ error: { message: deleteError }, data: null }).then(resolve, reject);
        return Promise.resolve({ error: null, data: [] }).then(resolve, reject);
      }
      if (action === 'update' && table === 'account_deletion_requests') {
         if (updateError) return Promise.resolve({ error: { message: updateError }, data: null }).then(resolve, reject);
         return Promise.resolve({ error: null, data: updateDataOverride || [] }).then(resolve, reject);
      }
      return Promise.resolve({ error: null, data: [] }).then(resolve, reject);
    }
  };
};

const supabaseAdminMock = {
  rpc: vi.fn().mockImplementation(async (fn: string, args: any) => {
    return mockRpc(fn, args);
  }),
  from: vi.fn((table: string) => createChain(table, 'from')),
  storage: {
    from: vi.fn((bucket: string) => ({
      remove: vi.fn(async (paths: string[]) => mockStorageFromRemove(bucket, paths)),
      list: vi.fn(async (path: string) => mockStorageFromList(bucket, path))
    }))
  },
  auth: {
    admin: {
      deleteUser: vi.fn(async (id: string) => mockAuthAdminDeleteUser(id)),
      getUserById: vi.fn(async (id: string) => mockAuthAdminGetUserById(id))
    }
  }
};

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: () => supabaseAdminMock
}));

describe("Account Deletion Processor", () => {
  const adminEmail = "authorized.admin@example.com";
  const adminId = "123e4567-e89b-12d3-a456-426614174001";
  const reqId = "123e4567-e89b-12d3-a456-426614174000";

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_EMAILS = adminEmail;
    
    // Reset all mock data and errors
    Object.keys(tableErrors).forEach(k => delete tableErrors[k]);
    selectError = null;
    updateError = null;
    deleteError = null;
    profileError = null;
    requestData = { id: reqId, user_id: "user-1", target_user_id: "user-1", status: "pending" };
    profileData = { id: "user-1", role: "customer" };
    updateDataOverride = null;
    lastUpdateCall = null;
    
    // Claim RPC and Finalize RPC mock
    mockRpc = vi.fn().mockImplementation(async (fn: string, args: any) => {
      if (fn === 'claim_deletion_request') return { data: true, error: null };
      if (fn === 'finalize_account_deletion') {
        return { data: { 
          id: reqId, 
          status: "completed", 
          user_id: null, 
          target_user_id: "user-1", 
          processed_by: adminId, 
          processed_at: new Date().toISOString(), 
          completed_at: new Date().toISOString(),
          attempt_count: 1 
        }, error: null };
      }
      return { data: null, error: null };
    });
    mockStorageFromList = vi.fn().mockResolvedValue({ data: [], error: null });
    mockStorageFromRemove = vi.fn().mockResolvedValue({ error: null });
    mockAuthAdminDeleteUser = vi.fn().mockResolvedValue({ error: null });
    mockAuthAdminGetUserById = vi.fn().mockResolvedValue({ data: { user: null }, error: null });
  });

  const runSuccessFlow = () => processAccountDeletion(reqId, adminEmail, adminId);

  it("finalizer returns invalid row -> processor fails", async () => {
    mockRpc.mockImplementation(async (fn: string) => {
      if (fn === 'claim_deletion_request') return { data: true, error: null };
      if (fn === 'finalize_account_deletion') {
        return { data: { id: "wrong-id", status: "processing", user_id: "user-1", attempt_count: 0 }, error: null };
      }
    });
    const result = await runSuccessFlow();
    expect(result.success).toBe(false);
    expect(result.error).toContain("Finalizer returned mismatched ID");
  });

  it("markFailed update fails -> processor still returns failure and reports state-persistence failure safely", async () => {
    // Cause an internal error during processing
    mockStorageFromList.mockResolvedValue({ data: null, error: new Error("Simulated storage error") });
    // And also make markFailed throw
    updateError = "mock error inside markFailed";
    
    const result = await runSuccessFlow();
    expect(result.success).toBe(false);
    expect(result.error).toContain("Failed to list wardrobe-assets (and failed to persist failure state)");
  });

  it("merchant rejection update fails -> detected", async () => {
    profileData.role = "merchant";
    updateError = "update error"; 
    const result = await runSuccessFlow();
    expect(result.success).toBe(false);
    expect(result.error).toContain("Failed to persist rejection state");
  });

  it("fresh concurrent processing claim fails", async () => {
    mockRpc.mockImplementation(async (fn: string) => {
      if (fn === 'claim_deletion_request') return { data: false, error: null };
      return { data: null, error: null };
    });
    const result = await runSuccessFlow();
    expect(result.success).toBe(false);
    expect(result.error).toContain("Failed to claim request");
  });

  it("stale processing claim succeeds", async () => {
    // The processor just calls claim_deletion_request and relies on it returning true
    const result = await runSuccessFlow();
    expect(result.success).toBe(true);
  });

  it("finalizer called twice -> handled safely", async () => {
    // Simulate retrying a completed request
    requestData.status = 'completed';
    requestData.user_id = null;
    requestData.target_user_id = "user-1";
    
    const result = await runSuccessFlow();
    expect(result.success).toBe(true);
    // Should short-circuit without calling claim or finalize again
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("nested wardrobe Storage files are deleted", async () => {
    const listSpy = vi.fn();
    mockStorageFromList = listSpy.mockImplementation(async (bucket: string, prefix: string) => {
      if (bucket === "wardrobe-assets") {
        if (prefix === "user-1") {
          return { data: [{ name: "folder1" }], error: null }; // folder
        }
        if (prefix === "user-1/folder1") {
          return { data: [{ name: "image.png", id: "uuid-1", updated_at: "now" }], error: null }; // file
        }
      }
      return { data: [], error: null };
    });
    
    const removeSpy = vi.fn().mockResolvedValue({ error: null });
    mockStorageFromRemove = removeSpy;

    const result = await runSuccessFlow();
    expect(result.success).toBe(true);
    
    // Check if it recursively listed and removed the nested file
    expect(listSpy).toHaveBeenCalledWith("wardrobe-assets", "user-1");
    expect(listSpy).toHaveBeenCalledWith("wardrobe-assets", "user-1/folder1");
    expect(removeSpy).toHaveBeenCalledWith("wardrobe-assets", ["user-1/folder1/image.png"]);
  });

  it("nested avatar Storage files are deleted", async () => {
    const listSpy = vi.fn();
    mockStorageFromList = listSpy.mockImplementation(async (bucket: string, prefix: string) => {
      if (bucket === "avatars") {
        if (prefix === "user-1") {
          return { data: [{ name: "nested" }], error: null }; // folder
        }
        if (prefix === "user-1/nested") {
          return { data: [{ name: "avatar.png", id: "uuid-2", updated_at: "now" }], error: null }; // file
        }
      }
      return { data: [], error: null };
    });
    
    const removeSpy = vi.fn().mockResolvedValue({ error: null });
    mockStorageFromRemove = removeSpy;

    const result = await runSuccessFlow();
    expect(result.success).toBe(true);
    
    // Check if it recursively listed and removed the nested file
    expect(listSpy).toHaveBeenCalledWith("avatars", "user-1");
    expect(listSpy).toHaveBeenCalledWith("avatars", "user-1/nested");
    expect(removeSpy).toHaveBeenCalledWith("avatars", ["user-1/nested/avatar.png"]);
  });

  it("retry after Auth/profile deletion completes using target_user_id", async () => {
    requestData = { id: reqId, user_id: null, target_user_id: "user-1", status: "failed" };
    profileData = null; // profile gone
    mockAuthAdminDeleteUser.mockResolvedValueOnce({ error: { message: "User not found" } }); // auth gone
    
    const result = await runSuccessFlow();
    expect(result.success).toBe(true);
    expect(result.targetUserId).toBe("user-1");
  });
});
