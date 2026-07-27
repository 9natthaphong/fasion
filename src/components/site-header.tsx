import Link from "next/link";

const links = [
  { href: "/ai-stylist", label: "AI Stylist" },
  { href: "/discover", label: "ค้นหาสไตล์" },
  { href: "/login/merchant", label: "สำหรับร้านค้า" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="wordmark" aria-label="FitToday หน้าหลัก">
          FITTODAY
        </Link>
        <nav className="desktop-nav" aria-label="เมนูหลัก">
          {links.map((link) => (
            <Link href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link href="/login/customer" className="button button-ghost hide-mobile">
            เข้าสู่ระบบ
          </Link>
          <Link href="/ai-stylist" className="button button-solid">
            เลือกชุดวันนี้
          </Link>
          <details className="mobile-menu">
            <summary aria-label="เปิดเมนู">เมนู</summary>
            <nav aria-label="เมนูมือถือ">
              {links.map((link) => (
                <Link href={link.href} key={link.href}>
                  {link.label}
                </Link>
              ))}
              <Link href="/login/customer">เข้าสู่ระบบลูกค้า</Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

