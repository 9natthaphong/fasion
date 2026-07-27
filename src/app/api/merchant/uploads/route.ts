import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { requireSameOrigin } from "@/lib/request-security";

const mimeExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  if (!(await requireSameOrigin(request))) return NextResponse.json({ error: "Origin ไม่ถูกต้อง" }, { status: 403 });
  const auth = await requireApiRole(["merchant"]);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const form = await request.formData();
  const file = form.get("file");
  const shopId = form.get("shopId");
  if (!(file instanceof File) || typeof shopId !== "string") return NextResponse.json({ error: "ข้อมูลอัปโหลดไม่ครบ" }, { status: 400 });
  const extension = mimeExtensions[file.type];
  if (!extension || file.size > 6_000_000 || file.size < 1) return NextResponse.json({ error: "รองรับ JPEG, PNG, WebP ขนาดไม่เกิน 6MB" }, { status: 400 });
  const supabase = await createClient();
  const { data: shop } = await supabase.from("shops").select("id").eq("id", shopId).eq("owner_id", auth.user.id).maybeSingle();
  if (!shop) return NextResponse.json({ error: "คุณไม่มีสิทธิ์อัปโหลดให้ร้านนี้" }, { status: 403 });
  const path = `${shopId}/${randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("ad-assets").upload(path, file, { contentType: file.type, upsert: false, cacheControl: "3600" });
  if (error) return NextResponse.json({ error: "อัปโหลดรูปไม่สำเร็จ" }, { status: 400 });
  return NextResponse.json({ path });
}

export async function DELETE(request: Request) {
  if (!(await requireSameOrigin(request))) return NextResponse.json({ error: "Origin ไม่ถูกต้อง" }, { status: 403 });
  const auth = await requireApiRole(["merchant"]);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await request.json().catch(() => null);
  if (!body || typeof body.shopId !== "string" || typeof body.path !== "string" || !body.path.startsWith(`${body.shopId}/`)) return NextResponse.json({ error: "Path ไม่ถูกต้อง" }, { status: 400 });
  const supabase = await createClient();
  const { data: shop } = await supabase.from("shops").select("id").eq("id", body.shopId).eq("owner_id", auth.user.id).maybeSingle();
  if (!shop) return NextResponse.json({ error: "คุณไม่มีสิทธิ์ลบรูปนี้" }, { status: 403 });
  const { error } = await supabase.storage.from("ad-assets").remove([body.path]);
  return error ? NextResponse.json({ error: "ลบรูปไม่สำเร็จ" }, { status: 400 }) : NextResponse.json({ ok: true });
}
