import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/request-security";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSameOrigin(request))) return NextResponse.json({ error: "Origin ไม่ถูกต้อง" }, { status: 403 });
  const { id } = await params;
  const auth = await requireApiRole(["customer"]);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const supabase = await createClient();
  const { error } = await supabase.from("ad_likes").insert({ ad_id: id, user_id: auth.user.id });
  if (error && error.code !== "23505") return NextResponse.json({ error: "กดถูกใจไม่สำเร็จ" }, { status: 400 });
  return NextResponse.json({ liked: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSameOrigin(request))) return NextResponse.json({ error: "Origin ไม่ถูกต้อง" }, { status: 403 });
  const { id } = await params;
  const auth = await requireApiRole(["customer"]);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const supabase = await createClient();
  const { error } = await supabase.from("ad_likes").delete().eq("ad_id", id).eq("user_id", auth.user.id);
  return error ? NextResponse.json({ error: "ยกเลิกถูกใจไม่สำเร็จ" }, { status: 400 }) : NextResponse.json({ liked: false });
}
