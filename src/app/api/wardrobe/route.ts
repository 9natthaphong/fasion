import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/request-security";
import { wardrobeItemSchema } from "@/lib/validation";
import { createWardrobeItem, getWardrobeItems } from "@/lib/wardrobe";
import type { WardrobeAvailabilityStatus, WardrobeItemType } from "@/lib/types";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนดำเนินการ" }, { status: 401 });
  }

  const url = new URL(request.url);
  const type = (url.searchParams.get("type") as WardrobeItemType | "all") || "all";
  const status = (url.searchParams.get("status") as WardrobeAvailabilityStatus | "all") || "all";
  const favoriteOnly = url.searchParams.get("favorite") === "true";

  const items = await getWardrobeItems(user.id, { type, status, favoriteOnly });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  if (!(await requireSameOrigin(request))) {
    return NextResponse.json({ error: "Origin ไม่ถูกต้อง" }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนดำเนินการ" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const parsed = wardrobeItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const newItem = await createWardrobeItem(user.id, {
      image_path: parsed.data.imagePath,
      item_type: parsed.data.itemType,
      subcategory: parsed.data.subcategory,
      name: parsed.data.name,
      primary_colors: parsed.data.primaryColors,
      styles: parsed.data.styles,
      material: parsed.data.material,
      preferred_fit: parsed.data.preferredFit,
      formality: parsed.data.formality,
      weather_suitability: parsed.data.weatherSuitability,
      ai_description: parsed.data.aiDescription,
      availability_status: parsed.data.availabilityStatus,
      is_favorite: parsed.data.isFavorite,
      analysis_status: "completed",
    });

    if (!newItem) {
      return NextResponse.json({ error: "บันทึกข้อมูลเสื้อผ้าไม่สำเร็จ" }, { status: 500 });
    }

    return NextResponse.json({ item: newItem });
  } catch (error) {
    console.error("Wardrobe POST exception", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการบันทึกเสื้อผ้า" }, { status: 500 });
  }
}
