import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth";
import { getFitProfile, upsertFitProfile, deleteFitProfile } from "@/lib/fit-profile";
import { requireSameOrigin } from "@/lib/request-security";

export async function GET() {
  const auth = await requireApiRole(["customer"]);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const profile = await getFitProfile(auth.user.id);
  return NextResponse.json({ profile });
}

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
    const profile = await upsertFitProfile(auth.user.id, body);
    return NextResponse.json({ profile });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "บันทึกโปรไฟล์สัดส่วนไม่สำเร็จ" },
      { status: 400 },
    );
  }
}

export async function DELETE(req: Request) {
  if (!(await requireSameOrigin(req))) {
    return NextResponse.json({ error: "Origin ไม่ถูกต้อง" }, { status: 403 });
  }

  const auth = await requireApiRole(["customer"]);
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    await deleteFitProfile(auth.user.id);
    return NextResponse.json({ message: "ลบโปรไฟล์สัดส่วนสำเร็จ" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "ลบข้อมูลสัดส่วนไม่สำเร็จ" },
      { status: 500 },
    );
  }
}
