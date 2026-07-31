import { requirePageRole } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";
import { formatDate } from "@/lib/format";
import Link from "next/link";
import { approveRequest, rejectRequest, requestResubmission } from "../actions";

export const metadata = { title: "Request Details | Admin" };

export default async function RequestDetailPage({ params }: { params: { id: string } }) {
  await requirePageRole(["admin"], "/login/admin");
  const adminClient = getAdminClient();

  // Fetch the request
  const { data: request, error: reqError } = await adminClient
    .from("customer_subscription_requests")
    .select("*")
    .eq("id", params.id)
    .single();

  if (reqError || !request) {
    return <div className="p-8 text-center text-destructive">ไม่พบคำขอ</div>;
  }

  // Fetch profile
  const { data: profile } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", request.user_id)
    .single();

  // Fetch active submitted proof
  const { data: currentProof } = await adminClient
    .from("subscription_payment_proofs")
    .select("*")
    .eq("request_id", params.id)
    .eq("status", "submitted")
    .single();

  // Fetch historical proofs (for audit, not displayed in list view)
  await adminClient
    .from("subscription_payment_proofs")
    .select("id")
    .eq("request_id", params.id)
    .neq("status", "submitted")
    .order("created_at", { ascending: false });

  // Fetch subscription history
  const { data: subHistory } = await adminClient
    .from("customer_subscriptions")
    .select("*")
    .eq("user_id", request.user_id)
    .order("created_at", { ascending: false });

  const hasPastPro = subHistory && subHistory.some(s => s.plan === "pro" && s.status !== "pending");
  const expectedAmount = hasPastPro ? 29 : 9;

  // Create signed URL for current proof preview
  let signedUrl = "";
  if (currentProof) {
    const { data } = await adminClient.storage
      .from("payment-slips")
      .createSignedUrl(currentProof.storage_path, 60 * 60); // 1 hour
    if (data?.signedUrl) signedUrl = data.signedUrl;
  }


  return (
    <div>
      <div className="mb-4">
        <Link href="/admin/subscriptions" className="text-primary hover:underline">&larr; กลับไปหน้ารวมคำขอ</Link>
      </div>
      
      <header className="dashboard-heading mb-8">
        <h1>รายละเอียดคำขอ</h1>
        <p>ตรวจสอบสลิปและข้อมูลก่อนอนุมัติ</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Details */}
        <div className="space-y-8">
          <section className="p-6 border rounded-lg bg-card">
            <h2 className="text-lg font-bold mb-4">ข้อมูลลูกค้า</h2>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">ชื่อ:</span> {profile?.display_name || "Unknown"}</p>
              <p><span className="font-medium">User ID:</span> {request.user_id}</p>
            </div>
          </section>

          <section className="p-6 border rounded-lg bg-card">
            <h2 className="text-lg font-bold mb-4">ข้อมูลคำขอ</h2>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">สถานะคำขอ:</span> {request.status}</p>
              <p><span className="font-medium">สถานะการชำระเงิน:</span> {request.payment_status}</p>
              <p><span className="font-medium">เวลาขอ:</span> {formatDate(request.created_at)}</p>
              <p><span className="font-medium">ยอดที่คาดหวัง:</span> {expectedAmount} บาท</p>
            </div>
          </section>

          {/* Action Form */}
          {request.status === "pending" && (
            <section className="p-6 border rounded-lg bg-card space-y-4">
              <h2 className="text-lg font-bold mb-4">การตัดสินใจ</h2>
              {request.payment_status === "submitted" && currentProof ? (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground mb-2">กรุณาตรวจสอบสลิปว่ายอดเงินตรงกับ {expectedAmount} บาท ก่อนอนุมัติ</p>
                  <form action={async () => { "use server"; await approveRequest(request.id, request.user_id, !hasPastPro); }}>
                    <button type="submit" className="w-full px-4 py-2 bg-[var(--accent-color,theme(colors.olive.dark))] text-primary-foreground rounded hover:opacity-90">
                      ยืนยันสลิปและอนุมัติ Pro
                    </button>
                  </form>
                  <form action={async () => { "use server"; await requestResubmission(request.id, "สลิปไม่ถูกต้อง โปรดแนบใหม่"); }}>
                    <button type="submit" className="w-full px-4 py-2 border border-destructive text-destructive rounded hover:bg-destructive/5">
                      ให้ส่งสลิปใหม่
                    </button>
                  </form>
                  <form action={async () => { "use server"; await rejectRequest(request.id, "ไม่อนุมัติ"); }}>
                    <button type="submit" className="w-full px-4 py-2 bg-destructive text-destructive-foreground rounded hover:opacity-90">
                      ปฏิเสธคำขอ
                    </button>
                  </form>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">ยังไม่มีสลิปที่รอตรวจสอบ ไม่สามารถอนุมัติได้</div>
              )}
            </section>
          )}

          <section className="p-6 border rounded-lg bg-card">
            <h2 className="text-lg font-bold mb-4">ประวัติการเป็น Pro</h2>
            {subHistory && subHistory.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {subHistory.map((sh) => (
                  <li key={sh.id} className="pb-2 border-b last:border-0">
                    <div>สถานะ: {sh.status}</div>
                    <div>เริ่ม: {formatDate(sh.starts_at)}</div>
                    <div>สิ้นสุด: {formatDate(sh.ends_at)}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">ไม่เคยเป็นสมาชิก Pro</p>
            )}
          </section>
        </div>

        {/* Right Column: Slip */}
        <div>
          <section className="p-6 border rounded-lg bg-card h-full flex flex-col">
            <h2 className="text-lg font-bold mb-4">สลิปล่าสุด</h2>
            {currentProof && signedUrl ? (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>อัปโหลดเมื่อ: {formatDate(currentProof.created_at)}</p>
                  <p>ขนาด: {(currentProof.file_size_bytes / 1024).toFixed(2)} KB</p>
                </div>
                <div className="relative w-full border rounded bg-muted flex items-center justify-center overflow-hidden" style={{ minHeight: "400px" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={signedUrl} alt="Payment Proof" className="max-w-full max-h-[800px] object-contain cursor-pointer" onClick={(e) => { e.currentTarget.requestFullscreen?.() }} />
                </div>
                <p className="text-xs text-center text-muted-foreground">คลิกที่รูปเพื่อขยายใหญ่</p>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground bg-muted rounded">
                ไม่มีสลิปล่าสุด
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
