import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth";
import { setShopFashionTags } from "@/lib/taxonomy";
import { requireSameOrigin } from "@/lib/request-security";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  shopId: z.string().uuid(),
  tagIds: z.array(z.string().uuid()).max(20),
});

export async function POST(req: Request) {
  if (!(await requireSameOrigin(req))) {
    return NextResponse.json({ error: "Origin ไม่ถูกต้อง" }, { status: 403 });
  }

  const auth = await requireApiRole(["merchant", "admin"]);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { shopId, tagIds } = schema.parse(body);

    // Verify shop ownership for merchant
    if (auth.user.role === "merchant") {
      const supabase = await createClient();
      const { data: shop } = await supabase
        .from("shops")
        .select("id, owner_id")
        .eq("id", shopId)
        .eq("owner_id", auth.user.id)
        .is("deleted_at", null)
        .maybeSingle();

      if (!shop) {
        return NextResponse.json({ error: "ไม่พบร้านค้าหรือไม่มีสิทธิ์แก้ไข" }, { status: 403 });
      }
    }

    await setShopFashionTags(shopId, tagIds);
    return NextResponse.json({ message: "อัปเดตแท็กของร้านเรียบร้อยแล้ว" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "อัปเดตแท็กของร้านไม่สำเร็จ" },
      { status: 400 },
    );
  }
}
