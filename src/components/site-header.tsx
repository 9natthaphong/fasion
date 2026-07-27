import Link from "next/link";
import { Sparkles, Compass, Store, User } from "lucide-react";

const links = [
  { href: "/ai-stylist", label: "AI Stylist", icon: Sparkles },
  { href: "/discover", label: "ค้นหาสไตล์", icon: Compass },
  { href: "/login/merchant", label: "สำหรับร้านค้า", icon: Store },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="wordmark tracking-widest font-medium" aria-label="FitToday หน้าหลัก">
          FITTODAY
        </Link>
        <nav className="desktop-nav" aria-label="เมนูหลัก">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link href={link.href} key={link.href} className="flex items-center gap-1.5 hover:text-charcoal transition-colors">
                <Icon className="w-4 h-4 text-olive" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="header-actions flex items-center gap-3">
          <Link href="/login/customer" className="button button-ghost hide-mobile flex items-center gap-1.5">
            <User className="w-4 h-4" />
            <span>เข้าสู่ระบบ</span>
          </Link>
          <Link href="/ai-stylist" className="button button-solid flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>เลือกชุดวันนี้</span>
          </Link>
          <details className="mobile-menu relative">
            <summary aria-label="เปิดเมนู" className="cursor-pointer p-2 rounded-md hover:bg-olive-pale">
              <span className="sr-only">เมนู</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </summary>
            <nav aria-label="เมนูมือถือ" className="shadow-lg rounded-lg border border-line p-3">
              {links.map((link) => (
                <Link href={link.href} key={link.href} className="flex items-center gap-2 px-3 py-2 text.sm">
                  {link.label}
                </Link>
              ))}
              <div className="pt-2 border-t border-line mt-2">
                <Link href="/login/customer" className="flex items-center gap-2 px-3 py-2 text-sm font-medium">
                  <User className="w-4 h-4 text-olive" />
                  <span>เข้าสู่ระบบลูกค้า</span>
                </Link>
              </div>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}

