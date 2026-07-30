import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { adSchema } from "@/lib/validation";
import { canSubmit } from "../route";
import { toAdUpdateRow } from "@/lib/merchant-ad-write";
import { requireSameOrigin } from "@/lib/request-security";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSameOrigin(request))) return NextResponse.json({ error: "Origin ไม่ถูกต้อง" }, { status: 403 });
  const { id } = await params;
  const auth = await requireApiRole(["merchant"]);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const parsed = adSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลโฆษณาไม่ถูกต้อง" }, { status: 400 });
  const supabase = await createClient();
  const { data: shop } = await supabase.from("shops").select("id, status, subscription_status, subscription_ends_at").eq("id", parsed.data.shopId).eq("owner_id", auth.user.id).is("deleted_at", null).maybeSingle();
  if (!shop) return NextResponse.json({ error: "ไม่พบร้านหรือคุณไม่มีสิทธิ์" }, { status: 403 });
  if (parsed.data.intent === "submit" && !canSubmit(shop)) return NextResponse.json({ error: "ร้านต้องได้รับอนุมัติและ subscription ต้อง active ก่อนส่งตรวจ" }, { status: 409 });
  if (parsed.data.intent === "submit" && !parsed.data.coverImagePath) return NextResponse.json({ error: "กรุณาอัปโหลดรูปหน้าปกก่อนส่งตรวจ" }, { status: 400 });
  const { data: existing } = await supabase.from("ads").select("id, status").eq("id", id).eq("shop_id", shop.id).maybeSingle();
  if (!existing) return NextResponse.json({ error: "ไม่พบโฆษณา" }, { status: 404 });
  if (!["draft", "rejected", "paused"].includes(existing.status)) return NextResponse.json({ error: "โฆษณาที่กำลังตรวจหรือ active แก้เนื้อหาไม่ได้ กรุณา pause ก่อน" }, { status: 409 });
  const { error } = await supabase.from("ads").update(toAdUpdateRow(parsed.data)).eq("id", id);
  if (error) return NextResponse.json({ error: error.code === "23505" ? "Slug โฆษณานี้ถูกใช้แล้ว" : "บันทึกโฆษณาไม่สำเร็จ" }, { status: 400 });
  await Promise.all([
    supabase.from("ad_categories").delete().eq("ad_id", id),
    supabase.from("ad_images").delete().eq("ad_id", id),
  ]);
  const [categoryResult, imageResult] = await Promise.all([
    supabase.from("ad_categories").insert(parsed.data.categoryIds.map((category_id) => ({ ad_id: id, category_id }))),
    parsed.data.images.length ? supabase.from("ad_images").insert(parsed.data.images.map((image) => ({ ad_id: id, storage_path: image.storagePath, alt_text: image.altText, sort_order: image.sortOrder }))) : Promise.resolve({ error: null }),
  ]);
  if (categoryResult.error || imageResult.error) return NextResponse.json({ error: "บันทึกหมวดหมู่หรือรูปไม่ครบ กรุณาลองอีกครั้ง" }, { status: 500 });
  if (parsed.data.intent === "submit") {
    const { error: submitError } = await supabase
      .from("ads")
      .update({ status: "pending_review" })
      .eq("id", id)
      .eq("status", "draft");
    if (submitError) {
      return NextResponse.json(
        { error: "บันทึกดราฟต์แล้ว แต่ส่งตรวจไม่สำเร็จ กรุณาลองอีกครั้ง" },
        { status: 409 },
      );
    }
  }
  return NextResponse.json({ id });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSameOrigin(request))) return NextResponse.json({ error: "Origin ไม่ถูกต้อง" }, { status: 403 });
  const { id } = await params;
  const auth = await requireApiRole(["merchant"]);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const body = await request.json().catch(() => null);
  if (!body || !["pause", "duplicate"].includes(body.action)) return NextResponse.json({ error: "คำสั่งไม่ถูกต้อง" }, { status: 400 });
  const supabase = await createClient();
  const { data: ad } = await supabase.from("ads").select("*, shops!inner(owner_id), ad_categories(category_id), ad_images(storage_path, alt_text, sort_order)").eq("id", id).eq("shops.owner_id", auth.user.id).maybeSingle();
  if (!ad) return NextResponse.json({ error: "ไม่พบโฆษณา" }, { status: 404 });
  if (body.action === "pause") {
    const { error } = await supabase.from("ads").update({ status: "paused" }).eq("id", id).eq("status", "active");
    return error ? NextResponse.json({ error: "Pause ไม่สำเร็จ" }, { status: 400 }) : NextResponse.json({ ok: true });
  }
  const { id: _id, created_at: _created, updated_at: _updated, deleted_at: _deleted, shops: _shops, ad_categories: relationCategories, ad_images: relationImages, ...copy } = ad;
  void [_id, _created, _updated, _deleted, _shops];
  const { data: duplicated, error } = await supabase.from("ads").insert({ ...copy, slug: `${ad.slug}-copy-${Date.now().toString(36)}`, title: `${ad.title} (สำเนา)`, status: "draft" }).select("id").single();
  if (error) return NextResponse.json({ error: "ทำสำเนาไม่สำเร็จ" }, { status: 400 });
  await Promise.all([
    supabase.from("ad_categories").insert(relationCategories.map((item: { category_id: string }) => ({ ad_id: duplicated.id, category_id: item.category_id }))),
    relationImages.length ? supabase.from("ad_images").insert(relationImages.map((item: { storage_path: string; alt_text: string; sort_order: number }) => ({ ad_id: duplicated.id, ...item }))) : Promise.resolve(),
  ]);
  return NextResponse.json({ id: duplicated.id });
}
