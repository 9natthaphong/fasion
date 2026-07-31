import Link from "next/link";

const links = [
  ["/admin", "ภาพรวม"],
  ["/admin/shops", "ร้านค้า"],
  ["/admin/ads", "โฆษณา"],
  ["/admin/users", "ผู้ใช้"],
  ["/admin/subscriptions", "สมาชิก Pro"],
  ["/admin/analytics", "สถิติระบบ"],
];

export function AdminNav() {
  return (
    <aside className="dashboard-nav admin-nav" aria-label="เมนูผู้ดูแลระบบ">
      <p className="dashboard-nav-title">YourStylist Admin</p>
      {links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
      <form action="/api/auth/logout" method="post"><button type="submit">ออกจากระบบ</button></form>
    </aside>
  );
}
