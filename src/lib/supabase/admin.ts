import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Generated database types will replace this boundary after the remote project exists.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UncheckedDatabase = any;

let adminClient: SupabaseClient<UncheckedDatabase> | null = null;

export function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    throw new Error("Supabase server credentials are not configured.");
  }
  if (!adminClient) {
    adminClient = createClient<UncheckedDatabase>(url, secret, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (url, options) => fetch(url, { ...options, cache: "no-store" }),
      },
    });
  }
  return adminClient;
}
