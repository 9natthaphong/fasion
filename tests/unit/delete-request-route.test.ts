/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/account/delete-request/route";

vi.mock("server-only", () => ({}));

let mockUser: any = { id: "user-1", role: "customer" };
let requireSameOriginResult = true;
let insertError: any = null;
let existingData: any = null;
const mockSignOut = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/lib/request-security", () => ({
  requireSameOrigin: vi.fn(async () => requireSameOriginResult)
}));

vi.mock("@/lib/auth", () => ({
  requireApiRole: vi.fn(async () => ({ user: mockUser, error: mockUser ? null : "Unauthorized", status: mockUser ? 200 : 401 }))
}));

const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        in: vi.fn(() => ({
          maybeSingle: vi.fn(async () => ({ data: existingData, error: null }))
        }))
      }))
    })),
    insert: vi.fn(async () => ({ error: insertError }))
  })),
  auth: {
    signOut: (...args: any) => mockSignOut(...args)
  }
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => mockSupabase)
}));

function createRequest(body: any, contentType: string = "application/json") {
  return new Request("http://localhost/api/account/delete-request", {
    method: "POST",
    headers: { "content-type": contentType },
    body: contentType === "application/json" ? JSON.stringify(body) : body
  });
}

describe("Delete Request Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: "user-1", role: "customer" };
    requireSameOriginResult = true;
    insertError = null;
    existingData = null;
    mockSignOut.mockResolvedValue({ error: null });
  });

  it("valid JSON request", async () => {
    const req = createRequest({ confirmation: "DELETE" });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("valid FormData request", async () => {
    const fd = new FormData();
    fd.append("confirmation", "DELETE");
    // Do not set Content-Type so Request sets it with boundary
    const req = new Request("http://localhost/api/account/delete-request", {
      method: "POST",
      body: fd
    });
    const res = await POST(req);
    expect(res.status).toBe(303);
  });

  it("invalid JSON does not throw", async () => {
    const req = new Request("http://localhost/api/account/delete-request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{ bad json"
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("รูปแบบคำขอไม่ถูกต้อง");
  });

  it("missing confirmation", async () => {
    const req = createRequest({});
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("คำยืนยันไม่ถูกต้อง พิมพ์ DELETE เพื่อยืนยัน");
  });

  it("wrong confirmation", async () => {
    const req = createRequest({ confirmation: "YES" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("คำยืนยันไม่ถูกต้อง พิมพ์ DELETE เพื่อยืนยัน");
  });

  it("concurrent unique violation 23505", async () => {
    insertError = { code: "23505" };
    const req = createRequest({ confirmation: "DELETE" });
    const res = await POST(req);
    expect(res.status).toBe(200); // JSON request returns 200
  });

  it("non-unique database error", async () => {
    insertError = { code: "50000" };
    const req = createRequest({ confirmation: "DELETE" });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it("existing outstanding request", async () => {
    existingData = { id: "req-1" };
    const req = createRequest({ confirmation: "DELETE" });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
