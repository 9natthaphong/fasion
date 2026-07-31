import { DashboardNav } from "@/components/dashboard-nav";
import { requirePageRole } from "@/lib/auth";

const links = [
  { href: "/account", label: "ภาพรวม" },
  { href: "/account/wardrobe", label: "ตู้เสื้อผ้าของฉัน" },
  { href: "/account/profile", label: "โปรไฟล์และความชอบ" },
  { href: "/account/style-memory", label: "กิจวัตรและสไตล์" },
  { href: "/account/weekly-planner", label: "วางแผนลุค 7 วัน" },
  { href: "/account/outfits", label: "ประวัติ AI Stylist" },
  { href: "/account/likes", label: "รายการที่ถูกใจ" },
  { href: "/account/subscription", label: "การเป็นสมาชิก" },
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
