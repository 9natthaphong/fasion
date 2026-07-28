import { requirePageRole } from "@/lib/auth";
import { isSupabaseAdminConfigured } from "@/lib/env";
import { getAdminClient } from "@/lib/supabase/admin";
import { AdminDeletionRequestCard } from "@/components/admin/admin-deletion-request-card";
import { StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requirePageRole(["admin"], "/login/customer");

  if (!isSupabaseAdminConfigured()) {
    return (
      <section className="dashboard-section space-y-4">
        <p className="eyebrow">Accounts</p>
        <h1 className="font-serif text-3xl">ผู้ใช้งานและการลบบัญชี</h1>
        <div className="config-notice" role="status">
          <strong>Configuration Missing</strong>
          <p>ต้องตั้งค่า SUPABASE_SECRET_KEY บน server เพื่อดูและจัดการผู้ใช้งานในระบบ</p>
        </div>
      </section>
    );
  }

  const supabaseAdmin = getAdminClient();

  let users: { id: string; display_name: string | null; role: string; created_at: string; deleted_at: string | null }[] = [];
  let deletionRequests: { id: string; user_id: string | null; target_user_id: string | null; status: string; created_at: string; display_name?: string | null }[] = [];

  try {
    const { data: usersData } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name, role, created_at, deleted_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (usersData) users = usersData;

    const { data: requestsData } = await supabaseAdmin
      .from("account_deletion_requests")
      .select("id, user_id, target_user_id, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (requestsData && requestsData.length > 0) {
      // Map display names from users array
      const userMap = new Map(users.map((u) => [u.id, u.display_name]));
      deletionRequests = requestsData.map((req) => ({
        ...req,
        display_name: userMap.get(req.target_user_id || req.user_id || "") || "ผู้ใช้งานในระบบ",
      }));
    }
  } catch (err) {
    console.error("[ADMIN_USERS_FETCH_ERROR]", err);
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Accounts & Governance</p>
        <h1 className="font-serif text-3xl font-normal text-charcoal">ผู้ใช้งานและการลบบัญชี (Stage 2)</h1>
      </div>

      {/* Pending Account Deletion Requests */}
      {deletionRequests.length > 0 && (
        <div className="border border-danger/30 bg-paper p-6 space-y-4">
          <div className="border-b border-line pb-3">
            <h2 className="font-serif text-2xl font-normal text-charcoal text-danger">
              คำขอลบบัญชีที่รอดำเนินการ ({deletionRequests.length})
            </h2>
            <p className="text-xs text-muted">
              เมื่อกดอนุมัติ ระบบจะทำลายข้อมูลส่วนตัว สัดส่วน ตู้เสื้อผ้า และไฟล์ Storage ของผู้ใช้รายนั้นอย่างถาวร
            </p>
          </div>

          <div className="space-y-3">
            {deletionRequests.map((req) => (
              <AdminDeletionRequestCard
                key={req.id}
                requestId={req.id}
                userId={req.target_user_id || req.user_id || ""}
                createdAt={req.created_at}
                userDisplayName={req.display_name}
              />
            ))}
          </div>
        </div>
      )}

      {/* User Accounts List */}
      <div className="space-y-4">
        <h2 className="font-serif text-xl font-normal text-charcoal">รายชื่อผู้ใช้ทั้งหมด ({users.length})</h2>
        <div className="data-list">
          {users.map((u) => (
            <article className="data-row" key={u.id}>
              <div>
                <h2>{u.display_name || "ยังไม่ตั้งชื่อ"}</h2>
                <p className="text-xs text-muted">
                  {u.id} · {new Date(u.created_at).toLocaleDateString("th-TH")}
                </p>
              </div>
              <StatusBadge tone={u.deleted_at ? "danger" : "neutral"}>
                {u.deleted_at ? "deleted" : u.role}
              </StatusBadge>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
