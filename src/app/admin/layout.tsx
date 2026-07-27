import { AdminNav } from "@/components/admin-nav";
import { requirePageRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requirePageRole(["admin"], "/login/customer");
  return <div className="container dashboard-shell"><AdminNav /><div className="dashboard-content">{children}</div></div>;
}
