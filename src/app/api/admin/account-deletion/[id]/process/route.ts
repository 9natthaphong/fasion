import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth";
import { processAccountDeletion } from "@/lib/account-deletion-processor";
import { requireSameOrigin } from "@/lib/request-security";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireSameOrigin(req))) {
    return NextResponse.json({ error: "Origin ไม่ถูกต้อง" }, { status: 403 });
  }

  const auth = await requireApiRole(["admin"]);
  if (!auth.user || !auth.user.email) {
    return NextResponse.json({ error: auth.error || "Unauthorized" }, { status: auth.status });
  }

  // Two-condition check: role === 'admin' AND email in ADMIN_EMAILS
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!adminEmails.includes(auth.user.email.toLowerCase())) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์แอดมินตามระบบการตั้งค่า ADMIN_EMAILS" }, { status: 403 });
  }

  try {
    const { id: requestId } = await params;
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(requestId)) {
      return NextResponse.json({ error: "รูปแบบ Request ID ไม่ถูกต้อง" }, { status: 400 });
    }
    
    const result = await processAccountDeletion(requestId, auth.user.email, auth.user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "ดำเนินการไม่สำเร็จ" }, { status: 400 });
    }

    return NextResponse.json({ message: "ดำเนินการลบบัญชีและล้างข้อมูลเรียบร้อยแล้ว", result });
  } catch (err) {
    console.error("[ADMIN_DELETION_ROUTE_ERROR]", err instanceof Error ? err.name : "Unknown");
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการประมวลผลคำขอลบบัญชี" }, { status: 500 });
  }
}
