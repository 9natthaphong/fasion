import { describe, expect, it } from "vitest";
import { normalizeDestinationUrl } from "@/lib/outbound-url";

describe("Legacy outbound URL policy and validation", () => {
  it("normalizes empty string to null", () => {
    expect(normalizeDestinationUrl("")).toBeNull();
    expect(normalizeDestinationUrl(null)).toBeNull();
    expect(normalizeDestinationUrl(undefined)).toBeNull();
  });

  it("normalizes whitespace-only string to null", () => {
    expect(normalizeDestinationUrl("   ")).toBeNull();
    expect(normalizeDestinationUrl("\t \n ")).toBeNull();
  });

  it("accepts valid public HTTPS URLs", () => {
    expect(normalizeDestinationUrl("https://example.com/product/101")).toBe("https://example.com/product/101");
    expect(normalizeDestinationUrl("https://my-store.co.th/item")).toBe("https://my-store.co.th/item");
    expect(normalizeDestinationUrl("https://bit.ly/3abcxyz")).toBe("https://bit.ly/3abcxyz");
  });

  it("rejects HTTP URLs", () => {
    expect(() => normalizeDestinationUrl("http://example.com/product")).toThrow("HTTPS เท่านั้น");
  });

  it("rejects unsafe protocols and malformed URLs", () => {
    expect(() => normalizeDestinationUrl("javascript:alert(1)")).toThrow();
    expect(() => normalizeDestinationUrl("data:text/html,hack")).toThrow();
    expect(() => normalizeDestinationUrl("file:///etc/passwd")).toThrow();
    expect(() => normalizeDestinationUrl("blob:https://example.com/123")).toThrow();
    expect(() => normalizeDestinationUrl("ftp://files.example.com")).toThrow();
    expect(() => normalizeDestinationUrl("not-a-url")).toThrow();
    expect(() => normalizeDestinationUrl("https://")).toThrow();
  });

  it("rejects localhost, loopback, ::1 and private network IP destinations", () => {
    expect(() => normalizeDestinationUrl("https://localhost/item")).toThrow();
    expect(() => normalizeDestinationUrl("https://127.0.0.1/item")).toThrow();
    expect(() => normalizeDestinationUrl("https://[::1]/item")).toThrow();
    expect(() => normalizeDestinationUrl("https://10.0.0.1/admin")).toThrow();
    expect(() => normalizeDestinationUrl("https://192.168.1.1/router")).toThrow();
    expect(() => normalizeDestinationUrl("https://172.16.0.1/private")).toThrow();
    expect(() => normalizeDestinationUrl("https://169.254.1.1/metadata")).toThrow();
    expect(() => normalizeDestinationUrl("https://myhost.local/page")).toThrow();
  });

  it("rejects embedded username and password in URL", () => {
    expect(() => normalizeDestinationUrl("https://user:pass@example.com/page")).toThrow("ข้อมูลเข้าสู่ระบบ");
    expect(() => normalizeDestinationUrl("https://admin@example.com/page")).toThrow("ข้อมูลเข้าสู่ระบบ");
  });

  it("rejects control characters and null bytes", () => {
    expect(() => normalizeDestinationUrl("https://example.com/path\x00test")).toThrow("ไม่ปลอดภัย");
    expect(() => normalizeDestinationUrl("https://example.com/path\r\ntest")).toThrow("ไม่ปลอดภัย");
  });
});
