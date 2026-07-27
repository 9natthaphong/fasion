import Link from "next/link";

const links = [
  ["/merchant", "ภาพรวม"],
  ["/merchant/shop", "ร้านค้า"],
  ["/merchant/ads", "โฆษณา"],
  ["/merchant/analytics", "สถิติ"],
  ["/merchant/settings", "ตั้งค่า"],
];

export function MerchantNav() {
  return (
    <aside className="dashboard-nav" aria-label="เมนูร้านค้า">
      <p className="dashboard-nav-title">Merchant Studio</p>
      {links.map(([href, label]) => (
        <Link key={href} href={href}>
          {label}
        </Link>
      ))}
      <form action="/api/auth/logout" method="post">
        <button type="submit">ออกจากระบบ</button>
      </form>
    </aside>
  );
}
