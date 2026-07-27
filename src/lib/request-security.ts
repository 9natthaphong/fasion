import { createHash, randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { getSiteUrl } from "@/lib/env";
import { getAdminClient } from "@/lib/supabase/admin";

export async function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(getSiteUrl()).host || new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export async function getEventIdentity(userId?: string | null) {
  const store = await cookies();
  const existing = store.get("ft_session")?.value;
  const valid = existing && /^[0-9a-f-]{36}$/i.test(existing) ? existing : null;
  return { userId: userId ?? null, sessionId: valid ?? randomUUID(), isNewSession: !valid };
}

export function eventSessionCookie(response: Response, sessionId: string, isNew: boolean) {
  if (isNew && "cookies" in response) {
    (response as import("next/server").NextResponse).cookies.set("ft_session", sessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 180,
      path: "/",
    });
  }
}

export async function isLikelyBot() {
  const userAgent = (await headers()).get("user-agent")?.toLowerCase() ?? "";
  return !userAgent || /(bot|crawler|spider|headless|curl|wget|python-requests)/.test(userAgent);
}

export async function passRateLimit(scope: string, identifier: string, limit: number, seconds: number) {
  const hash = createHash("sha256").update(identifier).digest("hex");
  const { data, error } = await getAdminClient().rpc("consume_rate_limit", {
    p_scope: scope,
    p_identifier_hash: hash,
    p_limit: limit,
    p_window_seconds: seconds,
  });
  return !error && data === true;
}
