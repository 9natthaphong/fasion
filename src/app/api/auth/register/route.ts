import { NextResponse } from "next/server";
import { getSiteUrl, isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validation";
import { requireSameOrigin } from "@/lib/request-security";

export async function POST(request: Request) {
  if (!(await requireSameOrigin(request))) return NextResponse.json({ error: "Origin ไม่ถูกต้อง" }, { status: 403 });
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "ระบบบัญชียังไม่ได้ตั้งค่า Supabase" }, { status: 503 });
  }
  const parsed = registerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const { email, password, displayName, role } = parsed.data;
  const supabase = await createClient();
  const redirectPath = role === "merchant" ? "/merchant/onboarding" : "/account";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(redirectPath)}`,
      data: { requested_role: role, display_name: displayName },
    },
  });
  if (error) {
    return NextResponse.json(
      { error: error.message.includes("already") ? "อีเมลนี้มีบัญชีอยู่แล้ว" : "สร้างบัญชีไม่สำเร็จ" },
      { status: 400 },
    );
  }
  if (!data.session) {
    return NextResponse.json({
      message: "สร้างบัญชีแล้ว กรุณาเปิดอีเมลเพื่อยืนยันก่อนเข้าสู่ระบบ",
    });
  }
  return NextResponse.json({ redirectTo: redirectPath });
}
