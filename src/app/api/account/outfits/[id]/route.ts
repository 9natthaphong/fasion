import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { requireSameOrigin } from "@/lib/request-security";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireSameOrigin(request))) return NextResponse.json({ error: "Origin ไม่ถูกต้อง" }, { status: 403 });
  const formData = await request.formData();
  if (formData.get("_method") !== "DELETE") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }
  const auth = await requireApiRole(["customer"]);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const supabase = await createClient();
  const { error } = await supabase
    .from("outfit_requests")
    .delete()
    .eq("id", (await params).id)
    .eq("user_id", auth.user.id);
  if (error) return NextResponse.json({ error: "ลบไม่สำเร็จ" }, { status: 400 });
  return NextResponse.redirect(new URL("/account/outfits", request.url), 303);
}
