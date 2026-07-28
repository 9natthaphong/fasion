import Link from "next/link";
import { Menu, User } from "lucide-react";

const links = [
  { href: "/ai-stylist", label: "เลือกชุดกับ AI" },
  { href: "/discover", label: "ค้นหาสไตล์" },
  { href: "/login/merchant", label: "สำหรับร้านค้า" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-line">
      <div className="container flex items-center justify-between h-16">
        <Link href="/" className="font-serif text-2xl tracking-tight text-charcoal hover:opacity-90 transition-opacity" aria-label="FitToday หน้าหลัก">
          FitToday
        </Link>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted" aria-label="เมนูหลัก">
          {links.map((link) => (
            <Link href={link.href} key={link.href} className="hover:text-charcoal transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/login/customer" className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-charcoal hover:text-black transition-colors">
            <User className="w-4 h-4 text-muted" />
            <span>เข้าสู่ระบบ</span>
          </Link>

          <Link href="/ai-stylist" className="px-4 py-2 bg-charcoal text-white hover:bg-olive font-medium text-xs rounded-none transition-colors">
            เลือกชุดวันนี้
          </Link>

          <details className="md:hidden relative">
            <summary aria-label="เปิดเมนู" className="cursor-pointer p-2 text-charcoal hover:bg-paper list-none">
              <Menu className="w-6 h-6" aria-hidden="true" />
            </summary>
            <nav aria-label="เมนูมือถือ" className="absolute right-0 top-full mt-2 w-56 bg-background border border-line p-4 shadow-xl space-y-3 z-50">
              {links.map((link) => (
                <Link href={link.href} key={link.href} className="block text-sm text-charcoal hover:text-olive">
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-line">
                <Link href="/login/customer" className="block text-xs font-medium text-charcoal">
                  เข้าสู่ระบบลูกค้า
                </Link>
              </div>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
