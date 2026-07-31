import { NextResponse } from "next/server";
import { requireCustomerExperienceApi } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/request-security";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!(await requireSameOrigin(request))) {
    return NextResponse.json({ error: "Origin ไม่ถูกต้อง" }, { status: 403 });
  }

  const user = (await requireCustomerExperienceApi()).user;
  if (!user) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนดำเนินการ" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const itemId = (formData.get("itemId") as string | null) || crypto.randomUUID();

    if (!file) {
      return NextResponse.json({ error: "ไม่พบไฟล์ภาพ" }, { status: 400 });
    }

    const allowedMime = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowedMime.has(file.type)) {
      return NextResponse.json({ error: "รองรับเฉพาะไฟล์ภาพ JPEG, PNG หรือ WebP เท่านั้น" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "ขนาดไฟล์ภาพต้องไม่เกิน 5 MB" }, { status: 400 });
    }

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const fileUuid = crypto.randomUUID();
    const storagePath = `${user.id}/${itemId}/${fileUuid}.${ext}`;

    const supabase = await createClient();
    const fileBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("wardrobe-assets")
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Wardrobe asset upload error", uploadError);
      return NextResponse.json({ error: "อัปโหลดภาพไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" }, { status: 500 });
    }

    const signedUrl = `/api/assets?bucket=wardrobe-assets&path=${encodeURIComponent(storagePath)}`;

    return NextResponse.json({
      itemId,
      storagePath,
      signedUrl,
    });
  } catch (error) {
    console.error("Wardrobe upload exception", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการอัปโหลดไฟล์" }, { status: 500 });
  }
}
