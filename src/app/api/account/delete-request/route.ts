import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { requireSameOrigin } from "@/lib/request-security";

export async function POST(request: Request) {
  if (!(await requireSameOrigin(request))) {
    return NextResponse.json({ error: "Origin ไม่ถูกต้อง" }, { status: 403 });
  }

  const auth = await requireApiRole(["customer", "merchant"]);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  // Merchant account deletion requires manual admin/business review to prevent orphaned shops
  if (auth.user.role === "merchant") {
    return NextResponse.json(
      { error: "บัญชีร้านค้าไม่สามารถส่งคำขอลบอัตโนมัติได้ กรุณาติดต่อแอดมินเพื่อดำเนินการปิดร้านค้าและย้ายสิทธิ์ข้อมูล" },
      { status: 400 },
    );
  }

  const contentType = request.headers.get("content-type") || "";
  let confirmation = "";

  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null);
    confirmation = body?.confirmation || "";
  } else {
    const formData = await request.formData().catch(() => null);
    confirmation = (formData?.get("confirmation") as string) || "";
  }

  if (confirmation !== "DELETE") {
    return NextResponse.json({ error: "คำยืนยันไม่ถูกต้อง พิมพ์ DELETE เพื่อยืนยัน" }, { status: 400 });
  }

  const supabase = await createClient();

  // Stage 1: Insert pending account deletion request
  const { data: existing, error: selectErr } = await supabase
    .from("account_deletion_requests")
    .select("id")
    .eq("user_id", auth.user.id)
    .in("status", ["pending", "processing", "failed"])
    .maybeSingle();

  if (selectErr) {
    console.error("[ACCOUNT_DELETION_SELECT_ERROR]", selectErr);
  }

  let reqError: { code?: string; message: string } | null = null;
  if (!existing) {
    const { error } = await supabase
      .from("account_deletion_requests")
      .insert({ user_id: auth.user.id, status: "pending" });
    reqError = error;
  }

  if (reqError) {
    console.error("[ACCOUNT_DELETION_INSERT_ERROR]", reqError);
    return NextResponse.json({ error: "ส่งคำขอลบบัญชีไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" }, { status: 500 });
  }

  // Revoke session & sign out
  await supabase.auth.signOut();

  const message = "รับคำขอลบบัญชีเรียบร้อยแล้ว แอดมินจะดำเนินการลบข้อมูลส่วนตัวของคุณอย่างถาวรในขั้นตอนถัดไป";
  const redirectTo = "/?account-deletion=requested";

  if (request.headers.get("accept")?.includes("application/json") || contentType.includes("application/json")) {
    return NextResponse.json({ message, redirectTo });
  }

  return NextResponse.redirect(new URL(redirectTo, request.url), 303);
}
