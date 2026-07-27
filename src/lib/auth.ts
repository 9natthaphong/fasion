import { redirect } from "next/navigation";
import { getAdminEmails, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

export interface CurrentUser {
  id: string;
  email: string | null;
  role: UserRole;
  displayName: string | null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) return null;

  const email = user.email ?? null;
  const role =
    email && getAdminEmails().has(email.toLowerCase())
      ? "admin"
      : (profile.role as UserRole);

  return {
    id: user.id,
    email,
    role,
    displayName: profile.display_name,
  };
}

export async function requirePageRole(
  allowed: UserRole[],
  loginPath = "/login/customer",
) {
  const user = await getCurrentUser();
  if (!user) redirect(loginPath);
  if (!allowed.includes(user.role)) redirect("/");
  return user;
}

export async function requireApiRole(allowed: UserRole[]) {
  const user = await getCurrentUser();
  if (!user) return { user: null, error: "กรุณาเข้าสู่ระบบ", status: 401 as const };
  if (!allowed.includes(user.role)) {
    return { user: null, error: "คุณไม่มีสิทธิ์ดำเนินการนี้", status: 403 as const };
  }
  return { user, error: null, status: 200 as const };
}
