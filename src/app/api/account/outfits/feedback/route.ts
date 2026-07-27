import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth";
import { saveOutfitFeedback } from "@/lib/saved-outfits";
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

    // Verify outfitResultId ownership if supplied
    if (body.outfitResultId) {
      const supabase = await createClient();
      const { data: resRow } = await supabase
        .from("outfit_results")
        .select("id, request_id, outfit_requests!inner(user_id)")
        .eq("id", body.outfitResultId)
        .maybeSingle();

      if (!resRow || (resRow.outfit_requests as unknown as { user_id: string })?.user_id !== auth.user.id) {
        return NextResponse.json({ error: "ไม่พบผลลัพธ์คำแนะนำหรือไม่มีสิทธิ์อ้างอิง" }, { status: 403 });
      }
    }

    const feedback = await saveOutfitFeedback(auth.user.id, body);
    return NextResponse.json({ feedback });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "ส่งข้อเสนอแนะไม่สำเร็จ" },
      { status: 400 },
    );
  }
}
