import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verify ownership of outfit_request
    const { data: requestRow } = await supabase
      .from("outfit_requests")
      .select("id, user_id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!requestRow) {
      return NextResponse.json({ error: "ไม่พบประวัติการจัดชุดหรือไม่มีสิทธิ์ลบ" }, { status: 404 });
    }

    const { error } = await supabase
      .from("outfit_requests")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw new Error(error.message);

    return NextResponse.json({ message: "ลบประวัติการจัดชุดเรียบร้อยแล้ว" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "ลบประวัติไม่สำเร็จ" },
      { status: 500 },
    );
  }
}
