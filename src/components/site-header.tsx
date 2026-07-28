"use client";

import Link from "next/link";
import { Menu, User } from "lucide-react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/ai-stylist", label: "เลือกชุดกับ AI" },
  { href: "/discover", label: "ค้นหาสไตล์" },
  { href: "/login/merchant", label: "สำหรับร้านค้า" },
];

function isCurrentRoute(pathname: string, href: string) {
  if (href === "/discover") {
    return pathname === href || pathname.startsWith("/categories/");
  }
  if (href === "/login/merchant") {
    return pathname.startsWith("/merchant") || pathname === "/register/merchant";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="fit-site-header">
      <div className="container fit-site-header-inner">
        <Link href="/" className="fit-wordmark" aria-label="FitToday หน้าหลัก">
          FitToday
        </Link>

        <nav className="fit-desktop-nav" aria-label="เมนูหลัก">
          {links.map((link) => {
            const current = isCurrentRoute(pathname, link.href);
            return (
              <Link
                href={link.href}
                key={link.href}
                aria-current={current ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="fit-header-actions">
          <Link href="/login/customer" className="fit-login-link">
            <User aria-hidden="true" />
            <span>เข้าสู่ระบบ</span>
          </Link>

          <Link href="/ai-stylist" className="fit-header-cta">
            เลือกชุดวันนี้
          </Link>

          <details className="fit-mobile-menu">
            <summary aria-label="เปิดเมนู" className="fit-mobile-menu-trigger">
              <Menu aria-hidden="true" />
            </summary>
            <nav aria-label="เมนูมือถือ" className="fit-mobile-menu-panel">
              {links.map((link) => {
                const current = isCurrentRoute(pathname, link.href);
                return (
                  <Link
                    href={link.href}
                    key={link.href}
                    aria-current={current ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <Link href="/login/customer">เข้าสู่ระบบลูกค้า</Link>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
