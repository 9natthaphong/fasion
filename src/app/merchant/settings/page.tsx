import { requirePageRole } from "@/lib/auth";

export default async function MerchantSettingsPage() {
  const user = await requirePageRole(["merchant"], "/login/merchant");
  return <section className="dashboard-section narrow"><p className="eyebrow">Settings</p><h1>ตั้งค่าร้าน</h1><div className="editorial-note"><h2>บัญชีผู้ดูแลร้าน</h2><p>{user.email}</p><p>สมาชิกเพิ่มเติมเตรียม schema ไว้แล้ว แต่ MVP เปิดเฉพาะ owner</p></div></section>;
}
