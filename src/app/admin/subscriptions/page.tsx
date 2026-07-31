import { requirePageRole } from "@/lib/auth";
import { getAdminClient } from "@/lib/supabase/admin";
import { approveRequest, rejectRequest, revokeSubscription, requestResubmission } from "./actions";
import { formatDate } from "@/lib/format";
import Link from "next/link";
import Image from "next/image";

export const metadata = { title: "Subscriptions | Admin" };

export default async function AdminSubscriptionsPage() {
  await requirePageRole(["admin"], "/login/admin");
  const adminClient = getAdminClient();

  type SubscriptionRequest = { 
    id: string; 
    user_id: string; 
    status: string; 
    payment_status: string;
    created_at: string; 
    profiles?: { display_name: string } 
  };
  type ActiveSubscription = { 
    id: string; 
    user_id: string; 
    status: string; 
    starts_at: string; 
    ends_at: string; 
    profiles?: { display_name: string } 
  };

  let requestsErrorMsg = "";
  let activeSubsErrorMsg = "";
  let requestsWithProfiles: SubscriptionRequest[] = [];
  let activeSubsWithProfiles: ActiveSubscription[] = [];

  try {
    // 1. Fetch requests bypassing RLS
    const { data: requests, error: requestsError } = await adminClient
      .from("customer_subscription_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (requestsError) {
      console.error("Admin subscriptions query error:", requestsError);
      requestsErrorMsg = "ไม่สามารถโหลดข้อมูลคำขอได้ กรุณาลองใหม่อีกครั้ง";
    }

    // 2. Fetch active subscriptions bypassing RLS
    const { data: activeSubs, error: subsError } = await adminClient
      .from("customer_subscriptions")
      .select("*")
      .eq("status", "active")
      .order("updated_at", { ascending: false });

    if (subsError) {
      console.error("Admin active subs query error:", subsError);
      activeSubsErrorMsg = "ไม่สามารถโหลดข้อมูลสมาชิก Pro ได้";
    }

    // 3. Resolve profiles safely using server-side adminClient
    const userIds = new Set<string>();
    requests?.forEach(r => userIds.add(r.user_id));
    activeSubs?.forEach(s => userIds.add(s.user_id));
    
    let profileMap: Record<string, string> = {};
    if (userIds.size > 0) {
      const { data: profiles, error: profileError } = await adminClient
        .from("profiles")
        .select("id, display_name")
        .in("id", Array.from(userIds));
        
      if (profileError) {
        console.error("Admin profile query error:", profileError);
        requestsErrorMsg = "ไม่สามารถโหลดข้อมูลผู้ใช้ได้";
      } else if (profiles) {
        profileMap = profiles.reduce((acc, p) => ({...acc, [p.id]: p.display_name}), {});
      }
    }

    requestsWithProfiles = (requests || []).map(r => ({
      ...r,
      profiles: { display_name: profileMap[r.user_id] || "Unknown User" }
    }));

    activeSubsWithProfiles = (activeSubs || []).map(s => ({
      ...s,
      profiles: { display_name: profileMap[s.user_id] || "Unknown User" }
    }));
  } catch (err) {
    console.error("Unexpected error fetching admin subscriptions:", err);
    requestsErrorMsg = "เกิดข้อผิดพลาดในการโหลดข้อมูล";
  }

  const pendingSlip = requestsWithProfiles.filter(r => r.status === 'pending' && r.payment_status === 'not_submitted');
  const awaitingReview = requestsWithProfiles.filter(r => r.status === 'pending' && r.payment_status === 'submitted');
  const needsResubmission = requestsWithProfiles.filter(r => r.status === 'pending' && r.payment_status === 'needs_resubmission');
  const history = requestsWithProfiles.filter(r => r.status === 'active' || r.status === 'rejected');

  return (
    <div>
      <header className="dashboard-heading mb-8">
        <h1>อนุมัติสมาชิก Pro</h1>
        <p>จัดการคำขอเปิดใช้งานและสิทธิ์สมาชิกของลูกค้า</p>
      </header>

      {(requestsErrorMsg || activeSubsErrorMsg) && (
        <div className="p-4 mb-8 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 text-center">
          <p className="font-bold">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
          <p>{requestsErrorMsg}</p>
          <p>{activeSubsErrorMsg}</p>
          <p className="mt-4 text-sm opacity-80">โปรดลองรีเฟรชหน้าใหม่อีกครั้ง</p>
        </div>
      )}

      {!(requestsErrorMsg || activeSubsErrorMsg) && (
        <>
          <section className="mb-12">
        <h2 className="text-xl font-bold mb-4 text-[var(--accent-color,theme(colors.olive.dark))]">รอตรวจสอบสลิป ({awaitingReview.length})</h2>
        {awaitingReview.length > 0 ? (
          <div className="space-y-4">
            {awaitingReview.map(req => (
              <div key={req.id} className="p-4 border rounded-lg bg-card flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <div className="font-medium text-foreground">{req.profiles?.display_name || "Unknown User"}</div>
                  <div className="text-sm text-muted-foreground">User ID: {req.user_id}</div>
                  <div className="text-sm text-muted-foreground">เวลาขอ: {formatDate(req.created_at)}</div>
                </div>
                <div>
                  <Link href={`/admin/subscriptions/${req.id}`} className="px-4 py-2 bg-primary text-primary-foreground rounded text-sm hover:opacity-90">ตรวจสอบ</Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground border rounded-lg">ไม่มีสลิปที่รอตรวจสอบ</div>
        )}
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4 text-[var(--accent-color,theme(colors.olive.dark))]">รอแนบสลิป ({pendingSlip.length})</h2>
        {pendingSlip.length > 0 ? (
          <div className="space-y-4">
            {pendingSlip.map(req => (
              <div key={req.id} className="p-4 border rounded-lg bg-card flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <div className="font-medium text-foreground">{req.profiles?.display_name || "Unknown User"}</div>
                  <div className="text-sm text-muted-foreground">User ID: {req.user_id}</div>
                  <div className="text-sm text-muted-foreground">เวลาขอ: {formatDate(req.created_at)}</div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">กำลังรอผู้ใช้แนบสลิป</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground border rounded-lg">ไม่มีคำขอที่รอแนบสลิป</div>
        )}
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4 text-[var(--accent-color,theme(colors.olive.dark))]">ต้องส่งใหม่ ({needsResubmission.length})</h2>
        {needsResubmission.length > 0 ? (
          <div className="space-y-4">
            {needsResubmission.map(req => (
              <div key={req.id} className="p-4 border rounded-lg bg-card flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <div className="font-medium text-foreground">{req.profiles?.display_name || "Unknown User"}</div>
                  <div className="text-sm text-muted-foreground">User ID: {req.user_id}</div>
                  <div className="text-sm text-muted-foreground">เวลาขอ: {formatDate(req.created_at)}</div>
                </div>
                <div>
                  <Link href={`/admin/subscriptions/${req.id}`} className="text-sm text-primary hover:underline">ดูรายละเอียด</Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground border rounded-lg">ไม่มีคำขอที่ต้องส่งสลิปใหม่</div>
        )}
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4 text-[var(--accent-color,theme(colors.olive.dark))]">สมาชิก Pro ที่ใช้งานอยู่ ({activeSubsWithProfiles.length})</h2>
        {activeSubsErrorMsg && (
          <div className="p-4 mb-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 text-center">
            {activeSubsErrorMsg}
          </div>
        )}
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted">
              <tr>
                <th className="px-4 py-3">ผู้ใช้</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3">เริ่ม</th>
                <th className="px-4 py-3">สิ้นสุด</th>
                <th className="px-4 py-3">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {activeSubsWithProfiles.map(sub => (
                <tr key={sub.id} className="border-b last:border-0 bg-card">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{sub.profiles?.display_name || "Unknown"}</div>
                    <div className="text-xs text-muted-foreground">{sub.user_id}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-[var(--accent-color,theme(colors.olive.dark))] text-primary-foreground rounded-full text-xs font-medium">
                      Active
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground">{formatDate(sub.starts_at)}</td>
                  <td className="px-4 py-3 text-foreground">{formatDate(sub.ends_at)}</td>
                  <td className="px-4 py-3">
                    <form action={async () => { "use server"; await revokeSubscription(sub.id) }}>
                      <button type="submit" className="text-destructive hover:underline text-xs">ระงับสิทธิ์</button>
                    </form>
                  </td>
                </tr>
              ))}
              {activeSubsWithProfiles.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">ยังไม่มีสมาชิก Pro</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4 text-[var(--accent-color,theme(colors.olive.dark))]">ประวัติการอนุมัติ/ปฏิเสธ</h2>
        <div className="space-y-4">
          {history.slice(0, 10).map(req => (
            <div key={req.id} className="p-4 border rounded-lg bg-card flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <div className="font-medium text-foreground">{req.profiles?.display_name || "Unknown User"}</div>
                <div className="text-sm text-muted-foreground">User ID: {req.user_id}</div>
                <div className="text-sm text-muted-foreground">สถานะ: {req.status === 'active' ? 'อนุมัติ' : 'ปฏิเสธ'}</div>
              </div>
              <div>
                <Link href={`/admin/subscriptions/${req.id}`} className="text-sm text-primary hover:underline">ดูรายละเอียด</Link>
              </div>
            </div>
          ))}
          {history.length === 0 && (
            <div className="p-4 text-center text-muted-foreground border rounded-lg">ไม่มีประวัติ</div>
          )}
        </div>
      </section>
      </>
    )}
    </div>
  );
}
