import { DashboardNav } from "@/components/dashboard-nav";
import { requireCustomerExperiencePage } from "@/lib/auth";

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
  const user = await requireCustomerExperiencePage("/login/customer");
  return (
    <div className="dashboard-shell container">
      <DashboardNav title="บัญชีลูกค้า" links={links} />
      {user.role === "admin" && (
        <div className="mb-4 inline-flex min-h-9 items-center rounded-full border border-olive/30 bg-olive-pale/30 px-3 text-xs font-medium text-olive-dark">
          โหมดทดสอบผู้ดูแล
        </div>
      )}
      <div className="dashboard-content">{children}</div>
    </div>
  );
}
