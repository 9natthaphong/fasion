import { z } from "zod";

const blockedHosts = new Set(["localhost", "0.0.0.0", "127.0.0.1", "::1"]);

function looksLikePrivateIp(hostname: string) {
  if (/^10\./.test(hostname) || /^192\.168\./.test(hostname)) return true;
  const match = hostname.match(/^172\.(\d{1,3})\./);
  return Boolean(match && Number(match[1]) >= 16 && Number(match[1]) <= 31);
}

export function normalizeShopeeUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("ลิงก์ Shopee ไม่ถูกต้อง");
  }

  if (url.protocol !== "https:") throw new Error("ลิงก์ต้องใช้ HTTPS เท่านั้น");
  if (url.username || url.password) throw new Error("ลิงก์ต้องไม่มีข้อมูลเข้าสู่ระบบ");
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (
    blockedHosts.has(hostname) ||
    looksLikePrivateIp(hostname) ||
    hostname.endsWith(".local")
  ) {
    throw new Error("ไม่อนุญาตลิงก์เครือข่ายภายใน");
  }
  if (hostname === "shope.ee") {
    throw new Error("MVP ยังไม่รองรับ short link กรุณาใส่ลิงก์เต็มจาก Shopee");
  }
  if (hostname !== "shopee.co.th" && !hostname.endsWith(".shopee.co.th")) {
    throw new Error("อนุญาตเฉพาะโดเมน shopee.co.th");
  }
  url.hash = "";
  return url.toString();
}

export const shopeeUrlSchema = z
  .string()
  .trim()
  .min(1, "กรุณาใส่ลิงก์ Shopee")
  .transform((value, context) => {
    try {
      return normalizeShopeeUrl(value);
    } catch (error) {
      context.addIssue({
        code: "custom",
        message: error instanceof Error ? error.message : "ลิงก์ไม่ถูกต้อง",
      });
      return z.NEVER;
    }
  });

