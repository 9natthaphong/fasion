import { MerchantNav } from "@/components/merchant-nav";
import { requirePageRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function MerchantLayout({ children }: { children: React.ReactNode }) {
  await requirePageRole(["merchant"], "/login/merchant");
  return (
    <div className="container dashboard-shell">
      <MerchantNav />
      <div className="dashboard-content">{children}</div>
    </div>
  );
}
