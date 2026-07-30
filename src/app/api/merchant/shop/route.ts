import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { shopSchema } from "@/lib/validation";
import { requireSameOrigin } from "@/lib/request-security";

export async function POST(request: Request) {
  if (!(await requireSameOrigin(request))) return NextResponse.json({ error: "Origin ไม่ถูกต้อง" }, { status: 403 });
  const auth = await requireApiRole(["merchant"]);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const parsed = shopSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลร้านไม่ถูกต้อง" }, { status: 400 });
  const supabase = await createClient();
  const { data: existing } = await supabase.from("shops").select("id").eq("owner_id", auth.user.id).is("deleted_at", null).maybeSingle();
  const values = {
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description,
    // The database column name is retained for legacy compatibility.
    shopee_url: parsed.data.websiteUrl || null,
    instagram_url: parsed.data.instagramUrl || null,
  };
  const shopId = existing?.id ?? randomUUID();
  const { error } = existing
    ? await supabase.from("shops").update(values).eq("id", shopId)
    : await supabase.from("shops").insert({
        id: shopId,
        ...values,
        owner_id: auth.user.id,
        status: "pending",
        subscription_status: "inactive",
      });
  if (error) return NextResponse.json({ error: error.code === "23505" ? "Slug ร้านนี้ถูกใช้แล้ว" : "บันทึกร้านไม่สำเร็จ" }, { status: 400 });
  return NextResponse.json({ shopId });
}
