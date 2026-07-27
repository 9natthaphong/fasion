import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { adSchema } from "@/lib/validation";
import { requireSameOrigin } from "@/lib/request-security";

export async function POST(request: Request) {
  if (!(await requireSameOrigin(request))) return NextResponse.json({ error: "Origin ไม่ถูกต้อง" }, { status: 403 });
  const auth = await requireApiRole(["merchant"]);
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const parsed = adSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลโฆษณาไม่ถูกต้อง" }, { status: 400 });
  const supabase = await createClient();
  const { data: shop } = await supabase.from("shops").select("id, status, subscription_status, subscription_ends_at").eq("id", parsed.data.shopId).eq("owner_id", auth.user.id).is("deleted_at", null).maybeSingle();
  if (!shop) return NextResponse.json({ error: "ไม่พบร้านหรือคุณไม่มีสิทธิ์" }, { status: 403 });
  if (parsed.data.intent === "submit" && !canSubmit(shop)) return NextResponse.json({ error: "ร้านต้องได้รับอนุมัติและ subscription ต้อง active ก่อนส่งตรวจ" }, { status: 409 });
  if (parsed.data.intent === "submit" && !parsed.data.coverImagePath) return NextResponse.json({ error: "กรุณาอัปโหลดรูปหน้าปกก่อนส่งตรวจ" }, { status: 400 });
  const { data: ad, error } = await supabase.from("ads").insert(toAdRow(parsed.data)).select("id").single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "Slug โฆษณานี้ถูกใช้ในร้านแล้ว" : "สร้างโฆษณาไม่สำเร็จ" }, { status: 400 });
  const relationError = await replaceRelations(supabase, ad.id, parsed.data.categoryIds, parsed.data.images);
  if (relationError) return NextResponse.json({ error: "สร้างโฆษณาแล้ว แต่บันทึกหมวดหมู่หรือรูปไม่ครบ กรุณาเปิดแก้ไขอีกครั้ง" }, { status: 500 });
  return NextResponse.json({ id: ad.id });
}

export function canSubmit(shop: { status: string; subscription_status: string; subscription_ends_at: string | null }) {
  return shop.status === "approved" && shop.subscription_status === "active" && (!shop.subscription_ends_at || new Date(shop.subscription_ends_at) > new Date());
}

export function toAdRow(data: ReturnType<typeof adSchema.parse>) {
  return {
    shop_id: data.shopId,
    title: data.title,
    slug: data.slug,
    description: data.description,
    ad_type: data.adType,
    price_text: data.priceText,
    destination_url: data.destinationUrl,
    cover_image_path: data.coverImagePath,
    starts_at: data.startsAt,
    ends_at: data.endsAt,
    status: data.intent === "submit" ? "pending_review" : "draft",
  };
}

export async function replaceRelations(
  supabase: Awaited<ReturnType<typeof createClient>>,
  adId: string,
  categoryIds: string[],
  images: { storagePath: string; altText: string; sortOrder: number }[],
) {
  const [categoriesResult, imagesResult] = await Promise.all([
    supabase.from("ad_categories").insert(categoryIds.map((category_id) => ({ ad_id: adId, category_id }))),
    images.length ? supabase.from("ad_images").insert(images.map((image) => ({ ad_id: adId, storage_path: image.storagePath, alt_text: image.altText, sort_order: image.sortOrder }))) : Promise.resolve({ error: null }),
  ]);
  return categoriesResult.error ?? imagesResult.error;
}
