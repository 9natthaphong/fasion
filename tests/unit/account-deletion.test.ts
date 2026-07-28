import { describe, expect, it, vi, beforeEach } from "vitest";
import { processAccountDeletion } from "@/lib/account-deletion-processor";

vi.mock("server-only", () => ({}));

// Mock the admin client
const mockRpc = vi.fn();
const mockFrom = vi.fn();
const mockUpdate = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockIn = vi.fn();
const mockMaybeSingle = vi.fn();
const mockDelete = vi.fn();
const mockRemove = vi.fn();
const mockList = vi.fn();

const mockDeleteUser = vi.fn();
const mockGetUserById = vi.fn();

const supabaseAdminMock = {
  rpc: mockRpc,
  from: mockFrom,
  storage: {
    from: vi.fn(() => ({
      remove: mockRemove,
      list: mockList
    }))
  },
  auth: {
    admin: {
      deleteUser: mockDeleteUser,
      getUserById: mockGetUserById
    }
  }
};

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: () => supabaseAdminMock
}));

describe("Account Deletion Processor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_EMAILS = "authorized.admin@example.com";
    
    // Default chain mocks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chainBuilder: any = {
      select: mockSelect,
      update: mockUpdate,
      delete: mockDelete,
      eq: mockEq,
      in: mockIn,
      maybeSingle: mockMaybeSingle,
      single: vi.fn(),
    };

    mockFrom.mockReturnValue(chainBuilder);
    mockSelect.mockReturnValue(chainBuilder);
    mockUpdate.mockReturnValue(chainBuilder);
    mockDelete.mockReturnValue(chainBuilder);
    mockEq.mockReturnValue(chainBuilder);
    mockIn.mockReturnValue(chainBuilder);
    
    // Make chainBuilder act as a promise for operations that don't call maybeSingle/single
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chainBuilder.then = function(resolve: any, reject: any) {
      // If someone awaits chainBuilder directly, resolve with default
      return Promise.resolve({ data: [], error: null }).then(resolve, reject);
    };

    // Resolving data for terminators
    mockMaybeSingle.mockImplementation(() => Promise.resolve({ data: null, error: null }));
    chainBuilder.single.mockImplementation(() => Promise.resolve({ data: null, error: null }));
    
    mockRemove.mockResolvedValue({ error: null });
    mockList.mockResolvedValue({ data: [], error: null });
    mockDeleteUser.mockResolvedValue({ error: null });
    mockGetUserById.mockResolvedValue({ data: { user: null }, error: null });
    mockRpc.mockResolvedValue({ data: true, error: null });
  });

  it("rejects when admin email is not authorized", async () => {
    const result = await processAccountDeletion(
      "123e4567-e89b-12d3-a456-426614174000",
      "unauthorized@example.com",
      "admin-id"
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("Unauthorized");
  });

  it("rejects invalid request UUID", async () => {
    const result = await processAccountDeletion(
      "invalid-uuid",
      "authorized.admin@example.com",
      "admin-id"
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid Request ID");
  });

  it("returns idempotent completed if already completed", async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: { id: "123e4567-e89b-12d3-a456-426614174000", user_id: "user-1", status: "completed" },
      error: null
    });

    const result = await processAccountDeletion(
      "123e4567-e89b-12d3-a456-426614174000",
      "authorized.admin@example.com",
      "123e4567-e89b-12d3-a456-426614174001"
    );

    expect(result.success).toBe(true);
    // Should not call rpc claim
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("rejects concurrent processing if claim fails", async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: { id: "123e4567-e89b-12d3-a456-426614174000", user_id: "user-1", status: "pending" },
      error: null
    });
    mockRpc.mockResolvedValueOnce({ data: false, error: null });

    const result = await processAccountDeletion(
      "123e4567-e89b-12d3-a456-426614174000",
      "authorized.admin@example.com",
      "123e4567-e89b-12d3-a456-426614174001"
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("Failed to claim request");
  });

  it("rejects merchant account deletion", async () => {
    mockMaybeSingle.mockResolvedValueOnce({
      data: { id: "123e4567-e89b-12d3-a456-426614174000", user_id: "merchant-1", status: "pending" }
    });
    // For profile fetch
    mockMaybeSingle.mockResolvedValueOnce({
      data: { id: "merchant-1", role: "merchant" }
    });

    const result = await processAccountDeletion(
      "123e4567-e89b-12d3-a456-426614174000",
      "authorized.admin@example.com",
      "123e4567-e89b-12d3-a456-426614174001"
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("Merchant account deletion requires manual");
  });

  it("successfully processes pending request and cleans up correctly", async () => {
    const reqId = "123e4567-e89b-12d3-a456-426614174000";
    const targetUserId = "123e4567-e89b-12d3-a456-426614174002";
    
    mockMaybeSingle.mockResolvedValueOnce({
      data: { id: reqId, user_id: targetUserId, status: "pending" }
    });
    mockMaybeSingle.mockResolvedValueOnce({
      data: { id: targetUserId, role: "customer" }
    });

    const result = await processAccountDeletion(
      reqId,
      "authorized.admin@example.com",
      "123e4567-e89b-12d3-a456-426614174001"
    );

    expect(result.success).toBe(true);
    expect(mockDeleteUser).toHaveBeenCalledWith(targetUserId);
    expect(mockGetUserById).toHaveBeenCalledWith(targetUserId);
    expect(mockUpdate).toHaveBeenCalled(); // for analytics and final completion
  });

  it("fails if auth user deletion fails", async () => {
    const reqId = "123e4567-e89b-12d3-a456-426614174000";
    const targetUserId = "123e4567-e89b-12d3-a456-426614174002";
    
    mockMaybeSingle.mockResolvedValueOnce({
      data: { id: reqId, user_id: targetUserId, status: "pending" }
    });
    mockMaybeSingle.mockResolvedValueOnce({
      data: { id: targetUserId, role: "customer" }
    });
    
    mockDeleteUser.mockResolvedValueOnce({ error: new Error("Auth service down") });

    const result = await processAccountDeletion(
      reqId,
      "authorized.admin@example.com",
      "123e4567-e89b-12d3-a456-426614174001"
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("Failed to delete Auth User");
  });
});
