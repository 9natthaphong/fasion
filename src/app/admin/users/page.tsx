import { StatusBadge } from "@/components/ui";
import { isSupabaseAdminConfigured } from "@/lib/env";
import { getAdminClient } from "@/lib/supabase/admin";

export default async function AdminUsersPage() {
  if (!isSupabaseAdminConfigured()) {
    return <section className="dashboard-section"><p className="eyebrow">Accounts</p><h1>ผู้ใช้</h1><div className="config-notice" role="status"><strong>Configuration missing</strong><p>ต้องตั้งค่า SUPABASE_SECRET_KEY บน server เพื่อดูบัญชีผู้ใช้ในระบบ</p></div></section>;
  }
  const { data: users } = await getAdminClient().from("profiles").select("id, display_name, role, created_at, deleted_at").order("created_at", { ascending: false }).limit(200);
  return <section className="dashboard-section"><p className="eyebrow">Accounts</p><h1>ผู้ใช้</h1><div className="data-list">{users?.map((user) => <article className="data-row" key={user.id}><div><h2>{user.display_name || "ยังไม่ตั้งชื่อ"}</h2><p>{user.id.slice(0, 8)}… · {new Date(user.created_at).toLocaleDateString("th-TH")}</p></div><StatusBadge tone={user.deleted_at ? "danger" : "neutral"}>{user.deleted_at ? "deleted" : user.role}</StatusBadge></article>)}</div></section>;
}
