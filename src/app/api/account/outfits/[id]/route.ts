import { NextResponse } from "next/server";
import { requireCustomerExperienceApi } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { requireSameOrigin } from "@/lib/request-security";
import { z } from "zod";

const paramsSchema = z.object({
  id: z.string().uuid("รหัสประวัติการจัดชุดไม่ถูกต้อง"),
});

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireSameOrigin(req))) {
    return NextResponse.json({ error: "Origin ไม่ถูกต้อง" }, { status: 403 });
  }

  const auth = await requireCustomerExperienceApi();
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const rawParams = await params;
    const parseResult = paramsSchema.safeParse(rawParams);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0]?.message || "รหัสอ้างอิงไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const { id } = parseResult.data;
    const supabase = await createClient();

    // Verify ownership of outfit_request
    const { data: requestRow, error: fetchErr } = await supabase
      .from("outfit_requests")
      .select("id, user_id")
      .eq("id", id)
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (fetchErr || !requestRow) {
      return NextResponse.json(
        { error: "ไม่พบประวัติการจัดชุดหรือไม่มีสิทธิ์ดำเนินการ" },
        { status: 404 },
      );
    }

    const { error: deleteErr } = await supabase
      .from("outfit_requests")
      .delete()
      .eq("id", id)
      .eq("user_id", auth.user.id);

    if (deleteErr) {
      console.error("[OUTFIT_HISTORY_DELETE_ERROR]", deleteErr.code);
      return NextResponse.json(
        { error: "ไม่สามารถลบประวัติการจัดชุดได้ กรุณาลองใหม่อีกครั้ง" },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "ลบประวัติการจัดชุดเรียบร้อยแล้ว" });
  } catch (err) {
    console.error("[OUTFIT_HISTORY_DELETE_EXCEPTION]", err instanceof Error ? err.name : "Unknown");
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการประมวลผลคำขอ" },
      { status: 500 },
    );
  }
}
