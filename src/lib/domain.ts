import type { AdStatus, UserRole } from "@/lib/types";

export function isAllowedRole(role: UserRole, allowed: UserRole[]) {
  return allowed.includes(role);
}

export function isAdCurrentlyPublic(
  status: AdStatus,
  startsAt: string | null,
  endsAt: string | null,
  now = new Date(),
) {
  if (status !== "active") return false;
  if (startsAt && new Date(startsAt) > now) return false;
  if (endsAt && new Date(endsAt) <= now) return false;
  return true;
}

export function calculateCtr(clicks: number, impressions: number) {
  if (!Number.isFinite(clicks) || !Number.isFinite(impressions) || impressions <= 0) {
    return 0;
  }
  return Math.round((Math.max(clicks, 0) / impressions) * 10_000) / 100;
}

export function formatCtr(clicks: number, impressions: number) {
  return `${calculateCtr(clicks, impressions).toLocaleString("th-TH", {
    maximumFractionDigits: 2,
  })}%`;
}
