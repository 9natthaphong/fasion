import { DashboardNav } from "@/components/dashboard-nav";
import { requirePageRole } from "@/lib/auth";

const links = [
  { href: "/account", label: "ภาพรวม" },
  { href: "/account/profile", label: "โปรไฟล์และความชอบ" },
  { href: "/account/outfits", label: "ประวัติ AI Stylist" },
  { href: "/account/likes", label: "รายการที่ถูกใจ" },
  { href: "/account/settings", label: "การตั้งค่า" },
];

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requirePageRole(["customer"], "/login/customer");
  return (
    <div className="dashboard-shell container">
      <DashboardNav title="บัญชีลูกค้า" links={links} />
      <div className="dashboard-content">{children}</div>
    </div>
  );
}
