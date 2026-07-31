import { requirePageRole } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";
import { cancelInvalidRequest, revokeSubscription } from "./actions";
import { formatDate } from "@/lib/format";
import Link from "next/link";
import { getSubscriptionQueueState } from "@/lib/subscription-queue";

export const metadata = { title: "Subscriptions | Admin" };

type SubscriptionRequest = {
  id: string;
  user_id: string;
  status: string;
  payment_status: string;
  created_at: string;
  requested_plan?: string | null;
  admin_note?: string | null;
  displayName: string;
  maskedEmail: string;
  proofAmount: number | null;
  hasProof: boolean;
};

type ActiveSubscription = {
  id: string;
  user_id: string;
  status: string;
  starts_at: string;
  ends_at: string | null;
  displayName: string;
  maskedEmail: string;
};

function maskEmail(email: string | null | undefined) {
  if (!email) return "ไม่พบอีเมล";
  const [local, domain] = email.split("@", 2);
  if (!domain) return "ไม่พบอีเมล";
  const visible = local.slice(0, 2);
  return `${visible}${"•".repeat(Math.max(1, local.length - visible.length))}@${domain}`;
}

function PersonMeta({ displayName, maskedEmail, createdAt }: { displayName: string; maskedEmail: string; createdAt?: string }) {
  return (
    <div>
      <div className="font-medium text-foreground">{displayName}</div>
      <div className="text-sm text-muted-foreground">{maskedEmail}</div>
      {createdAt && <div className="text-sm text-muted-foreground">วันที่ส่งคำขอ: {formatDate(createdAt)}</div>}
    </div>
  );
}

export default async function AdminSubscriptionsPage() {
  await requirePageRole(["admin"], "/login/admin");
  const adminClient = getAdminClient();
  let requests: Array<{ id: string; user_id: string; status: string; payment_status: string; created_at: string; requested_plan?: string | null; admin_note?: string | null }> = [];
  let activeSubscriptions: Array<{ id: string; user_id: string; status: string; starts_at: string; ends_at: string | null }> = [];
  let errorMessage: string | null = null;

  const requestResult = await adminClient
    .from("customer_subscription_requests")
    .select("id, user_id, status, payment_status, created_at, requested_plan, admin_note")
    .order("created_at", { ascending: false });
  const subscriptionResult = await adminClient
    .from("customer_subscriptions")
    .select("id, user_id, status, starts_at, ends_at")
    .eq("status", "active")
    .order("starts_at", { ascending: false });
  if (requestResult.error || subscriptionResult.error) {
    errorMessage = "ไม่สามารถโหลดข้อมูลสมาชิกได้ กรุณาลองใหม่อีกครั้ง";
  }
  requests = (requestResult.data ?? []) as typeof requests;
  activeSubscriptions = (subscriptionResult.data ?? []) as typeof activeSubscriptions;

  const allRequestIds = requests.map((request) => request.id);
  const proofResult = allRequestIds.length
    ? await adminClient.from("subscription_payment_proofs").select("request_id, expected_amount_thb, status").in("request_id", allRequestIds)
    : { data: [], error: null };
  const proofs = (proofResult.data ?? []) as Array<{ request_id: string; expected_amount_thb: number | null; status: string }>;
  const proofMap = new Map(proofs.map((proof) => [proof.request_id, proof]));
  const userIds = [...new Set([...requests.map((request) => request.user_id), ...activeSubscriptions.map((subscription) => subscription.user_id)])];
  const profileResult = userIds.length
    ? await adminClient.from("profiles").select("id, display_name").in("id", userIds)
    : { data: [], error: null };
  const profileMap = new Map(((profileResult.data ?? []) as Array<{ id: string; display_name: string | null }>).map((profile) => [profile.id, profile.display_name || "ไม่ระบุชื่อ"]));
  const emailEntries = await Promise.all(userIds.map(async (userId) => {
    const result = await adminClient.auth.admin.getUserById(userId);
    return [userId, maskEmail(result.data.user?.email)] as const;
  }));
  const emailMap = new Map(emailEntries);

  const requestsWithMeta: SubscriptionRequest[] = requests.map((request) => {
    const proof = proofMap.get(request.id);
    return {
      ...request,
      displayName: profileMap.get(request.user_id) || "ไม่ระบุชื่อ",
      maskedEmail: emailMap.get(request.user_id) || "ไม่พบอีเมล",
      proofAmount: proof?.expected_amount_thb ?? null,
      hasProof: Boolean(proof),
    };
  });
  const activeWithMeta: ActiveSubscription[] = activeSubscriptions.map((subscription) => ({
    ...subscription,
    displayName: profileMap.get(subscription.user_id) || "ไม่ระบุชื่อ",
    maskedEmail: emailMap.get(subscription.user_id) || "ไม่พบอีเมล",
  }));

  const awaitingSlip = requestsWithMeta.filter((request) => getSubscriptionQueueState(request) === "awaiting_slip");
  const awaitingReview = requestsWithMeta.filter((request) => getSubscriptionQueueState(request) === "awaiting_review");
  const needsResubmission = requestsWithMeta.filter((request) => getSubscriptionQueueState(request) === "needs_resubmission");
  const history = requestsWithMeta.filter((request) => getSubscriptionQueueState(request) === "history");

  return (
    <div>
      <header className="dashboard-heading mb-8">
        <h1>อนุมัติสมาชิก Pro</h1>
        <p>ตรวจสอบคำขอและหลักฐานการชำระเงินของลูกค้า</p>
      </header>
      {errorMessage && <div className="mb-8 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">{errorMessage}</div>}

      <section className="mb-12">
        <h2 className="mb-2 text-xl font-bold text-olive-dark">รอตรวจสอบสลิป ({awaitingReview.length})</h2>
        <p className="mb-4 text-sm text-muted-foreground">ลูกค้าอัปโหลดหลักฐานแล้ว รอผู้ดูแลตรวจสอบ</p>
        <div className="space-y-4">
          {awaitingReview.map((request) => (
            <div key={request.id} className="flex flex-col justify-between gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-center">
              <PersonMeta displayName={request.displayName} maskedEmail={request.maskedEmail} createdAt={request.created_at} />
              <div className="text-sm text-muted-foreground">หลักฐาน: {request.hasProof ? "มีแล้ว" : "ไม่พบ"} · ยอด: {request.proofAmount ? `${request.proofAmount} บาท` : "รอตรวจสอบ"}</div>
              <Link href={`/admin/subscriptions/${request.id}`} className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90">ตรวจสอบ</Link>
            </div>
          ))}
          {awaitingReview.length === 0 && <div className="rounded-lg border p-4 text-center text-muted-foreground">ไม่มีสลิปที่รอตรวจสอบ</div>}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-2 text-xl font-bold text-olive-dark">รอลูกค้าแนบสลิป ({awaitingSlip.length})</h2>
        <p className="mb-4 text-sm text-muted-foreground">ลูกค้าส่งคำขอแล้ว แต่ยังไม่ได้อัปโหลดหลักฐานการชำระเงิน</p>
        <div className="space-y-4">
          {awaitingSlip.map((request) => (
            <div key={request.id} className="flex flex-col justify-between gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-center">
              <PersonMeta displayName={request.displayName} maskedEmail={request.maskedEmail} createdAt={request.created_at} />
              <div className="text-sm text-muted-foreground">สถานะการชำระเงิน: ยังไม่มีหลักฐาน · แผน: {request.requested_plan || "Pro"}</div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">รอลูกค้าแนบสลิป</span>
                <form action={async () => { "use server"; await cancelInvalidRequest(request.id); }}>
                  <button type="submit" className="min-h-11 rounded border border-destructive/40 px-3 text-xs text-destructive hover:bg-destructive/10">ยกเลิกคำขอที่ไม่ถูกต้อง</button>
                </form>
              </div>
            </div>
          ))}
          {awaitingSlip.length === 0 && <div className="rounded-lg border p-4 text-center text-muted-foreground">ไม่มีคำขอที่รอลูกค้าแนบสลิป</div>}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-2 text-xl font-bold text-olive-dark">ต้องส่งสลิปใหม่ ({needsResubmission.length})</h2>
        <p className="mb-4 text-sm text-muted-foreground">ผู้ดูแลขอหลักฐานใหม่จากลูกค้า</p>
        <div className="space-y-4">
          {needsResubmission.map((request) => (
            <div key={request.id} className="flex flex-col justify-between gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-center">
              <PersonMeta displayName={request.displayName} maskedEmail={request.maskedEmail} createdAt={request.created_at} />
              <div className="text-sm text-muted-foreground">สถานะการชำระเงิน: ขอหลักฐานใหม่</div>
              <Link href={`/admin/subscriptions/${request.id}`} className="text-sm text-primary hover:underline">ดูรายละเอียด</Link>
            </div>
          ))}
          {needsResubmission.length === 0 && <div className="rounded-lg border p-4 text-center text-muted-foreground">ไม่มีคำขอที่ต้องส่งสลิปใหม่</div>}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-xl font-bold text-olive-dark">สมาชิก Pro ที่ใช้งานอยู่ ({activeWithMeta.length})</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-xs text-muted-foreground"><tr><th className="px-4 py-3">ลูกค้า</th><th className="px-4 py-3">สถานะ</th><th className="px-4 py-3">เริ่มต้น</th><th className="px-4 py-3">สิ้นสุด</th><th className="px-4 py-3">จัดการ</th></tr></thead>
            <tbody>{activeWithMeta.map((subscription) => <tr key={subscription.id} className="border-b bg-card last:border-0"><td className="px-4 py-3"><div className="font-medium">{subscription.displayName}</div><div className="text-xs text-muted-foreground">{subscription.maskedEmail}</div></td><td className="px-4 py-3">สมาชิก Pro ที่ใช้งานอยู่</td><td className="px-4 py-3">{formatDate(subscription.starts_at)}</td><td className="px-4 py-3">{subscription.ends_at ? formatDate(subscription.ends_at) : "ไม่มีกำหนด"}</td><td className="px-4 py-3"><form action={async () => { "use server"; await revokeSubscription(subscription.id); }}><button type="submit" className="min-h-11 text-xs text-destructive hover:underline">ระงับสิทธิ์</button></form></td></tr>)}</tbody>
          </table>
          {activeWithMeta.length === 0 && <div className="p-8 text-center text-muted-foreground">ยังไม่มีสมาชิก Pro</div>}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold text-olive-dark">ประวัติคำขอ</h2>
        <div className="space-y-4">{history.slice(0, 10).map((request) => <div key={request.id} className="flex flex-col justify-between gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center"><PersonMeta displayName={request.displayName} maskedEmail={request.maskedEmail} createdAt={request.created_at} /><span className="text-sm text-muted-foreground">ปฏิเสธ: {request.admin_note || "ไม่ระบุเหตุผล"}</span><Link href={`/admin/subscriptions/${request.id}`} className="text-sm text-primary hover:underline">ดูรายละเอียด</Link></div>)}{history.length === 0 && <div className="rounded-lg border p-4 text-center text-muted-foreground">ไม่มีประวัติคำขอ</div>}</div>
      </section>
    </div>
  );
}
