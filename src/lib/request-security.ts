import { createHash, randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { getSiteUrl, isSupabaseAdminConfigured } from "@/lib/env";
import { getAdminClient } from "@/lib/supabase/admin";

export async function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  if (origin === "null") return false;
  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    const headerHost = request.headers.get("host")?.toLowerCase();
    const forwardedHost = request.headers
      .get("x-forwarded-host")
      ?.split(",")[0]
      .trim()
      .toLowerCase();
    const forwardedProtocol = request.headers
      .get("x-forwarded-proto")
      ?.split(",")[0]
      .trim()
      .toLowerCase();
    const publicProtocol =
      forwardedProtocol === "http" || forwardedProtocol === "https"
        ? `${forwardedProtocol}:`
        : requestUrl.protocol;
    const publicHost = forwardedHost ?? headerHost;
    const publicOrigin = publicHost
      ? `${publicProtocol}//${publicHost}`
      : null;
    return (
      originUrl.origin === new URL(getSiteUrl()).origin ||
      originUrl.origin === requestUrl.origin ||
      originUrl.origin === publicOrigin
    );
  } catch {
    return false;
  }
}

export async function getEventIdentity(userId?: string | null) {
  const store = await cookies();
  const existing = store.get("ft_session")?.value;
  const valid =
    existing &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(existing)
      ? existing
      : null;
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
  if (!isSupabaseAdminConfigured()) return true;
  try {
    const hash = createHash("sha256").update(identifier).digest("hex");
    const { data, error } = await getAdminClient().rpc("consume_rate_limit", {
      p_scope: scope,
      p_identifier_hash: hash,
      p_limit: limit,
      p_window_seconds: seconds,
    });
    return !error && data === true;
  } catch {
    return true;
  }
}
