import { NextResponse } from "next/server";
import { requireCustomerExperienceApi } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/request-security";
import { getWardrobeItem, updateWardrobeItem, deleteWardrobeItem } from "@/lib/wardrobe";
import { wardrobeItemSchema } from "@/lib/validation";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = (await requireCustomerExperienceApi()).user;
  if (!user) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนดำเนินการ" }, { status: 401 });
  }

  const { id } = await params;
  const item = await getWardrobeItem(id, user.id);
  if (!item) {
    return NextResponse.json({ error: "ไม่พบเสื้อผ้ารายการนี้" }, { status: 404 });
  }

  return NextResponse.json({ item });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireSameOrigin(request))) {
    return NextResponse.json({ error: "Origin ไม่ถูกต้อง" }, { status: 403 });
  }

  const user = (await requireCustomerExperienceApi()).user;
  if (!user) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนดำเนินการ" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getWardrobeItem(id, user.id);
  if (!existing) {
    return NextResponse.json({ error: "ไม่พบเสื้อผ้ารายการนี้หรือไม่มีสิทธิ์แก้ไข" }, { status: 404 });
  }

  try {
    const body = await request.json().catch(() => null);
    const partialSchema = wardrobeItemSchema.partial();
    const parsed = partialSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const updated = await updateWardrobeItem(id, user.id, {
      name: parsed.data.name ?? existing.name,
      item_type: parsed.data.itemType ?? existing.item_type,
      subcategory: parsed.data.subcategory ?? existing.subcategory,
      primary_colors: parsed.data.primaryColors ?? existing.primary_colors,
      styles: parsed.data.styles ?? existing.styles,
      material: parsed.data.material ?? existing.material,
      preferred_fit: parsed.data.preferredFit ?? existing.preferred_fit,
      formality: parsed.data.formality ?? existing.formality,
      weather_suitability: parsed.data.weatherSuitability ?? existing.weather_suitability,
      ai_description: parsed.data.aiDescription ?? existing.ai_description,
      availability_status: parsed.data.availabilityStatus ?? existing.availability_status,
      is_favorite: parsed.data.isFavorite ?? existing.is_favorite,
    });

    if (!updated) {
      return NextResponse.json({ error: "อัปเดตข้อมูลเสื้อผ้าไม่สำเร็จ" }, { status: 500 });
    }

    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error("Wardrobe PATCH exception", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireSameOrigin(request))) {
    return NextResponse.json({ error: "Origin ไม่ถูกต้อง" }, { status: 403 });
  }

  const user = (await requireCustomerExperienceApi()).user;
  if (!user) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนดำเนินการ" }, { status: 401 });
  }

  const { id } = await params;
  const url = new URL(request.url);
  const permanent = url.searchParams.get("permanent") === "true";

  const success = await deleteWardrobeItem(id, user.id, permanent);
  if (!success) {
    return NextResponse.json({ error: "ลบเสื้อผ้าไม่สำเร็จ" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
