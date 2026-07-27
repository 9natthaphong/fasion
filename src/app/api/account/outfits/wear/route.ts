import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth";
import { recordWearLog } from "@/lib/saved-outfits";
import { requireSameOrigin } from "@/lib/request-security";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  if (!(await requireSameOrigin(req))) {
    return NextResponse.json({ error: "Origin ไม่ถูกต้อง" }, { status: 403 });
  }

  const auth = await requireApiRole(["customer"]);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();

    // Verify savedOutfitId ownership if supplied
    if (body.savedOutfitId) {
      const supabase = await createClient();
      const { data: outfitRow } = await supabase
        .from("saved_outfits")
        .select("id, user_id")
        .eq("id", body.savedOutfitId)
        .eq("user_id", auth.user.id)
        .maybeSingle();

      if (!outfitRow) {
        return NextResponse.json({ error: "ไม่พบชุดที่บันทึกไว้หรือไม่มีสิทธิ์อ้างอิง" }, { status: 403 });
      }
    }

    const wearLog = await recordWearLog(auth.user.id, body);
    return NextResponse.json({ wearLog });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "บันทึกประวัติการใส่ไม่สำเร็จ" },
      { status: 400 },
    );
  }
}
