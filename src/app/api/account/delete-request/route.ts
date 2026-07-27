import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { requireSameOrigin } from "@/lib/request-security";

export async function POST(request: Request) {
  if (!(await requireSameOrigin(request))) return NextResponse.json({ error: "Origin ไม่ถูกต้อง" }, { status: 403 });
  const auth = await requireApiRole(["customer", "merchant"]);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const formData = await request.formData();
  if (formData.get("confirmation") !== "DELETE") {
    return NextResponse.json({ error: "คำยืนยันไม่ถูกต้อง" }, { status: 400 });
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("account_deletion_requests")
    .insert({ user_id: auth.user.id, status: "pending" });
  if (error) {
    return NextResponse.json({ error: "ส่งคำขอไม่สำเร็จ" }, { status: 400 });
  }
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/?account-deletion=requested", request.url), 303);
}
