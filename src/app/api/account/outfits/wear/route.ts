import { NextResponse } from "next/server";
import { requireCustomerExperienceApi } from "@/lib/auth";
import { recordWearLog } from "@/lib/saved-outfits";
import { requireSameOrigin } from "@/lib/request-security";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  if (!(await requireSameOrigin(req))) {
    return NextResponse.json({ error: "Origin ไม่ถูกต้อง" }, { status: 403 });
  }

  const auth = await requireCustomerExperienceApi();
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    // Verify savedOutfitId ownership if supplied
    if (body.savedOutfitId) {
      const supabase = await createClient();
      const { data: outfitRow, error: outfitErr } = await supabase
        .from("saved_outfits")
        .select("id, user_id")
        .eq("id", body.savedOutfitId)
        .eq("user_id", auth.user.id)
        .maybeSingle();

      if (outfitErr || !outfitRow) {
        return NextResponse.json({ error: "ไม่พบชุดที่บันทึกไว้หรือไม่มีสิทธิ์อ้างอิง" }, { status: 403 });
      }
    }

    const wearLog = await recordWearLog(auth.user.id, body);
    return NextResponse.json({ wearLog });
  } catch (err) {
    console.error("[WEAR_LOG_SAVE_ERROR]", err instanceof Error ? err.name : "UnknownError");
    return NextResponse.json(
      { error: "บันทึกประวัติการใส่ไม่สำเร็จ กรุณาตรวจสอบข้อมูลอีกครั้ง" },
      { status: 400 },
    );
  }
}
