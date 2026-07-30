/**
 * purchase-info.ts
 *
 * Validation and normalization for the `purchase_info` free-text field.
 *
 * This field replaces the destination-URL-only merchant experience.
 * It accepts any human-readable Thai/English text describing how to
 * purchase, contact the shop, or any other relevant information.
 *
 * Rules:
 *   - Completely optional; null is valid at all stages (draft / submit).
 *   - Whitespace-only input normalizes to null.
 *   - Null bytes and control characters (0x00–0x1F, 0x7F) are rejected.
 *   - Maximum 500 characters enforced both here and in the DB constraint.
 *   - No URL-format requirement.
 *   - No marketplace allowlist.
 *   - No AI validation service calls.
 *   - Text is NEVER rendered as raw HTML; always escaped React text.
 */

import { z } from "zod";

export const PURCHASE_INFO_MAX_LENGTH = 500;

/**
 * Normalize a raw purchase_info value.
 * Returns null for blank / whitespace-only / null / undefined input.
 * Throws for control characters or values exceeding the length limit.
 */
export function normalizePurchaseInfo(
  value: string | null | undefined,
): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  if (trimmed === "") return null;

  // Reject null bytes and ASCII control characters.
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    throw new Error("ข้อมูลช่องทางสั่งซื้อมีตัวอักษรที่ไม่ปลอดภัย");
  }

  if (trimmed.length > PURCHASE_INFO_MAX_LENGTH) {
    throw new Error(
      `ช่องทางสั่งซื้อต้องไม่เกิน ${PURCHASE_INFO_MAX_LENGTH} ตัวอักษร`,
    );
  }

  return trimmed;
}

/**
 * Zod schema for the purchase_info field.
 * Preprocesses empty strings to null, trims whitespace, and validates.
 */
export const purchaseInfoSchema = z
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
      return normalizePurchaseInfo(value);
    } catch (error) {
      context.addIssue({
        code: "custom",
        message:
          error instanceof Error
            ? error.message
            : "ข้อมูลช่องทางสั่งซื้อไม่ถูกต้อง",
      });
      return z.NEVER;
    }
  });

/**
 * Resolve the reader-facing value without mutating merchant text.
 * New purchase_info wins; legacy destination_url is used only when the new
 * field is blank so existing ads remain useful.
 */
export function resolvePurchaseInfo(
  purchaseInfo: string | null | undefined,
  legacyDestinationUrl: string | null | undefined,
): string | null {
  if (purchaseInfo?.trim()) return purchaseInfo;
  if (legacyDestinationUrl?.trim()) return legacyDestinationUrl;
  return null;
}
