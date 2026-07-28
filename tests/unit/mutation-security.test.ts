import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("Mutation Endpoints Security & Authorization", () => {
  it("rejects cross-origin mutations when SameOrigin header is invalid", async () => {
    const { requireSameOrigin } = await import("@/lib/request-security");
    const fakeRequest = new Request("http://localhost:3000/api/account/outfits/save", {
      method: "POST",
      headers: {
        host: "localhost:3000",
        origin: "https://malicious-attacker.com",
      },
    });

    const isAllowed = await requireSameOrigin(fakeRequest);
    expect(isAllowed).toBe(false);
  });

  it("permits same-origin mutation requests", async () => {
    const { requireSameOrigin } = await import("@/lib/request-security");
    const fakeRequest = new Request("http://localhost:3000/api/account/outfits/save", {
      method: "POST",
      headers: {
        host: "localhost:3000",
        origin: "http://localhost:3000",
      },
    });

    const isAllowed = await requireSameOrigin(fakeRequest);
    expect(isAllowed).toBe(true);
  });
});
