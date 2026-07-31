import { requirePageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { approveRequest, rejectRequest, revokeSubscription } from "./actions";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Subscriptions | Admin" };

export default async function AdminSubscriptionsPage() {
  await requirePageRole(["admin"], "/login/admin");
  const supabase = await createClient();

  const { data: requests } = await supabase
    .from("customer_subscription_requests")
    .select("*, profiles(display_name)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const { data: activeSubs } = await supabase
    .from("customer_subscriptions")
    .select("*, profiles(display_name)")
    .eq("status", "active")
    .order("updated_at", { ascending: false });

  return (
    <div>
      <header className="dashboard-heading mb-8">
        <h1>อนุมัติสมาชิก Pro</h1>
        <p>จัดการคำขอเปิดใช้งานและสิทธิ์สมาชิกของลูกค้า</p>
      </header>

      <section className="mb-12">
        <h2 className="text-xl font-bold mb-4">คำขอที่รออนุมัติ ({requests?.length || 0})</h2>
        {requests && requests.length > 0 ? (
          <div className="space-y-4">
            {requests.map(req => (
              <div key={req.id} className="p-4 border rounded-lg bg-card flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <div className="font-medium">{req.profiles?.display_name || "Unknown User"}</div>
                  <div className="text-sm text-muted-foreground">User ID: {req.user_id}</div>
                  <div className="text-sm text-muted-foreground">เวลาขอ: {formatDate(req.created_at)}</div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <form action={async () => { "use server"; await approveRequest(req.id, req.user_id, 9, true) }}>
                    <button type="submit" className="px-3 py-1 bg-olive-dark text-white rounded text-sm whitespace-nowrap">อนุมัติ (เดือนแรก 9 บ.)</button>
                  </form>
                  <form action={async () => { "use server"; await approveRequest(req.id, req.user_id, 29, false) }}>
                    <button type="submit" className="px-3 py-1 bg-olive-dark/80 text-white rounded text-sm whitespace-nowrap">อนุมัติ (ปกติ 29 บ.)</button>
                  </form>
                  <form action={async () => { "use server"; await rejectRequest(req.id, "ไม่อนุมัติ") }}>
                    <button type="submit" className="px-3 py-1 bg-destructive text-white rounded text-sm">ปฏิเสธ</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground border rounded-lg">ไม่มีคำขอที่รออนุมัติ</div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">สมาชิก Pro ที่ใช้งานอยู่ ({activeSubs?.length || 0})</h2>
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
              {activeSubs?.map(sub => (
                <tr key={sub.id} className="border-b last:border-0 bg-card">
                  <td className="px-4 py-3">
                    <div className="font-medium">{sub.profiles?.display_name || "Unknown"}</div>
                    <div className="text-xs text-muted-foreground">{sub.user_id}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-olive-pale text-olive-dark rounded-full text-xs font-medium">
                      Active
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatDate(sub.starts_at)}</td>
                  <td className="px-4 py-3">{formatDate(sub.ends_at)}</td>
                  <td className="px-4 py-3">
                    <form action={async () => { "use server"; await revokeSubscription(sub.id) }}>
                      <button type="submit" className="text-destructive hover:underline text-xs">ระงับสิทธิ์</button>
                    </form>
                  </td>
                </tr>
              ))}
              {(!activeSubs || activeSubs.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">ยังไม่มีสมาชิก Pro</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
