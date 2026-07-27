import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth";
import { setAdFashionTags } from "@/lib/taxonomy";
import { requireSameOrigin } from "@/lib/request-security";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  tagIds: z.array(z.string().uuid()).max(20),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireSameOrigin(req))) {
    return NextResponse.json({ error: "Origin ไม่ถูกต้อง" }, { status: 403 });
  }

  const auth = await requireApiRole(["merchant", "admin"]);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id: adId } = await params;
    const body = await req.json();
    const { tagIds } = schema.parse(body);
    const supabase = await createClient();

    // Fetch ad and verify status & ownership
    const { data: ad } = await supabase
      .from("ads")
      .select("id, shop_id, status, shops!inner(owner_id)")
      .eq("id", adId)
      .is("deleted_at", null)
      .maybeSingle();

    if (!ad) {
      return NextResponse.json({ error: "ไม่พบโฆษณาที่ต้องการแก้ไข" }, { status: 404 });
    }

    if (auth.user.role === "merchant") {
      if ((ad.shops as unknown as { owner_id: string })?.owner_id !== auth.user.id) {
        return NextResponse.json({ error: "ไม่มีสิทธิ์จัดการโฆษณานี้" }, { status: 403 });
      }

      // Merchant can ONLY modify ad tags when status is 'draft' or 'rejected'
      if (ad.status !== "draft" && ad.status !== "rejected") {
        return NextResponse.json(
          { error: "สามารถแก้ไขแท็กของโฆษณาได้เฉพาะในสถานะร่าง (draft) หรือถูกปฏิเสธ (rejected) เท่านั้น" },
          { status: 400 },
        );
      }
    }

    await setAdFashionTags(adId, tagIds);
    return NextResponse.json({ message: "อัปเดตแท็กของโฆษณาเรียบร้อยแล้ว" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "อัปเดตแท็กของโฆษณาไม่สำเร็จ" },
      { status: 400 },
    );
  }
}
