import { z } from "zod";

const blockedHosts = new Set(["localhost", "0.0.0.0", "127.0.0.1", "::1", "::"]);

export function isBlockedOrPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase().trim().replace(/\.$/, "");
  if (!host || host === "localhost" || host.endsWith(".local")) return true;
  if (blockedHosts.has(host)) return true;

  const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, a, b, c, d] = ipv4Match.map(Number);
    if (a > 255 || b > 255 || c > 255 || d > 255) return true;
    if (a === 0) return true;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
  }

  const cleanIpv6 = host.replace(/^\[|\]$/g, "");
  if (
    cleanIpv6 === "::" ||
    cleanIpv6 === "::1" ||
    cleanIpv6.startsWith("fe80:") ||
    cleanIpv6.startsWith("fc00:") ||
    cleanIpv6.startsWith("fd00:") ||
    cleanIpv6.startsWith("fec0:") ||
    cleanIpv6.startsWith("::ffff:127.") ||
    cleanIpv6.startsWith("::ffff:10.") ||
    cleanIpv6.startsWith("::ffff:192.168.") ||
    cleanIpv6.startsWith("::ffff:172.")
  ) {
    return true;
  }

  return false;
}

export function normalizeDestinationUrl(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  if (trimmed === "") return null;

  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    throw new Error("ลิงก์ปลายทางมีตัวอักษรที่ไม่ปลอดภัย");
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("ลิงก์ปลายทางไม่ถูกต้อง");
  }

  if (url.protocol !== "https:") {
    throw new Error("ลิงก์ปลายทางต้องใช้ HTTPS เท่านั้น");
  }

  if (url.username || url.password) {
    throw new Error("ลิงก์ปลายทางต้องไม่มีข้อมูลเข้าสู่ระบบ");
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!hostname || hostname.includes(" ")) {
    throw new Error("ชื่อโฮสต์ไม่ถูกต้อง");
  }

  if (isBlockedOrPrivateHost(hostname)) {
    throw new Error("ไม่อนุญาตลิงก์เครือข่ายภายในหรือ Localhost");
  }

  url.hash = "";
  return url.toString();
}

export function normalizeShopeeUrl(value: string | null | undefined): string | null {
  return normalizeDestinationUrl(value);
}

export const destinationUrlSchema = z
  .preprocess((val) => {
    if (val === null || val === undefined) return null;
    if (typeof val === "string") {
      const trimmed = val.trim();
      return trimmed === "" ? null : trimmed;
    }
    return val;
  }, z.string().nullable())
  .transform((value, context) => {
    if (value === null) return null;
    try {
      return normalizeDestinationUrl(value);
    } catch (error) {
      context.addIssue({
        code: "custom",
        message: error instanceof Error ? error.message : "ลิงก์ปลายทางไม่ถูกต้อง",
      });
      return z.NEVER;
    }
  });

export const shopeeUrlSchema = destinationUrlSchema;
