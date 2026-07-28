import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { loginSchema } from "@/lib/validation";
import { requireSameOrigin } from "@/lib/request-security";
import { isConfiguredAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  if (!(await requireSameOrigin(request))) return NextResponse.json({ error: "Origin ไม่ถูกต้อง" }, { status: 403 });
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "ระบบบัญชียังไม่ได้ตั้งค่า Supabase" }, { status: 503 });
  }
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const requestedRole =
    body && typeof body === "object" && "role" in body ? String(body.role) : null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    return NextResponse.json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }
  const adminClient = (await import("@/lib/supabase/admin")).getAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();
  const adminLogin =
    requestedRole === "customer" &&
    isConfiguredAdmin(profile?.role, data.user.email);
  if (
    requestedRole &&
    profile?.role !== requestedRole &&
    !adminLogin
  ) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: `บัญชีนี้เป็นประเภท ${profile?.role ?? "อื่น"} กรุณาใช้หน้าเข้าสู่ระบบที่ถูกต้อง` },
      { status: 403 },
    );
  }
  const response = NextResponse.json({
    redirectTo: adminLogin
      ? "/admin"
      : profile?.role === "merchant"
        ? "/merchant"
        : "/account",
  });
  const cookieStore = await cookies();
  for (const c of cookieStore.getAll()) {
    response.cookies.set(c.name, c.value, c);
  }
  return response;
}
