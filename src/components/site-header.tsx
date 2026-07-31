"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, User, Sparkles, LogOut } from "lucide-react";
import type { CurrentUser } from "@/lib/auth";
import { UserAccountMenu } from "@/components/user-account-menu";

const publicLinks = [
  { href: "/ai-stylist", label: "เลือกชุดกับ AI" },
  { href: "/discover", label: "ค้นหาสไตล์" },
  { href: "/login/merchant", label: "สำหรับร้านค้า" },
];

function isCurrentRoute(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === "/discover") {
    return pathname === href || pathname.startsWith("/categories/");
  }
  if (href === "/login/merchant") {
    return pathname.startsWith("/merchant") || pathname === "/register/merchant";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({ user }: { user?: CurrentUser | null }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-line">
      <div className="container flex items-center justify-between h-16">
        <Link href="/" className="font-serif text-2xl tracking-tight text-charcoal hover:opacity-90 transition-opacity" aria-label="YourStylist หน้าหลัก">
          YourStylist
        </Link>

        {/* Desktop Main Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted" aria-label="เมนูหลัก">
          {publicLinks.map((link) => {
            const current = isCurrentRoute(pathname, link.href);
            return (
              <Link
                href={link.href}
                key={link.href}
                aria-current={current ? "page" : undefined}
                className={`transition-colors ${current ? "text-charcoal font-semibold" : "hover:text-charcoal"}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Header Action Area */}
        <div className="flex items-center gap-3">
          {user ? (
            <UserAccountMenu user={user} />
          ) : (
            <Link
              href="/login/customer"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-charcoal hover:text-olive transition-colors min-h-[44px] px-2"
            >
              <User className="w-4 h-4 text-muted" />
              <span>เข้าสู่ระบบ</span>
            </Link>
          )}

          {/* Primary Stylist CTA */}
          <Link
            href="/ai-stylist"
            className="px-4 py-2 bg-charcoal text-white hover:bg-olive font-medium text-xs rounded-none transition-colors inline-flex items-center gap-1.5 min-h-[44px]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>เลือกชุดวันนี้</span>
          </Link>

          {/* Mobile Menu Drawer */}
          <details className="md:hidden relative">
            <summary aria-label="เปิดเมนู" className="cursor-pointer p-2 text-charcoal hover:bg-paper list-none min-h-[44px] flex items-center justify-center">
              <Menu className="w-6 h-6" aria-hidden="true" />
            </summary>
            <nav aria-label="เมนูมือถือ" className="absolute right-0 top-full mt-2 w-64 bg-background border border-line p-4 shadow-xl space-y-4 z-50">
              {user && (
                <div className="pb-3 border-b border-line">
                  <p className="text-xs font-semibold text-charcoal truncate">{user.displayName || user.email}</p>
                  <p className="text-[11px] text-muted truncate">{user.email}</p>
                  <span className="mt-1 inline-block px-2 py-0.5 bg-paper border border-line text-[10px] text-olive font-mono uppercase">
                    {user.role}
                  </span>
                </div>
              )}

              <div className="space-y-2">
                {publicLinks.map((link) => (
                  <Link
                    href={link.href}
                    key={link.href}
                    className="block text-sm text-charcoal hover:text-olive py-1"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="pt-3 border-t border-line space-y-2">
                {user ? (
                  <>
                    {user.role === "customer" && (
                      <>
                        <Link href="/account" className="block text-xs font-medium text-charcoal hover:text-olive py-1">
                          บัญชีของฉัน
                        </Link>
                        <Link href="/account/wardrobe" className="block text-xs font-medium text-charcoal hover:text-olive py-1">
                          ตู้เสื้อผ้าของฉัน
                        </Link>
                      </>
                    )}
                    {user.role === "merchant" && (
                      <>
                        <Link href="/merchant" className="block text-xs font-medium text-charcoal hover:text-olive py-1">
                          Merchant Studio
                        </Link>
                        <Link href="/merchant/shop" className="block text-xs font-medium text-charcoal hover:text-olive py-1">
                          ร้านค้าของฉัน
                        </Link>
                        <Link href="/merchant/ads" className="block text-xs font-medium text-charcoal hover:text-olive py-1">
                          จัดการโฆษณา
                        </Link>
                      </>
                    )}
                    {user.role === "admin" && (
                      <>
                        <Link href="/admin" className="block text-xs font-medium text-charcoal hover:text-olive py-1">
                          Admin Console
                        </Link>
                        <Link href="/admin/shops" className="block text-xs font-medium text-charcoal hover:text-olive py-1">
                          ตรวจสอบร้านค้า
                        </Link>
                        <Link href="/admin/ads" className="block text-xs font-medium text-charcoal hover:text-olive py-1">
                          ตรวจสอบโฆษณา
                        </Link>
                      </>
                    )}
                    <form action="/api/auth/logout" method="post" className="pt-2">
                      <button type="submit" className="text-xs text-rose-700 hover:underline inline-flex items-center gap-1">
                        <LogOut className="w-3.5 h-3.5" />
                        <span>ออกจากระบบ</span>
                      </button>
                    </form>
                  </>
                ) : (
                  <>
                    <Link href="/login/customer" className="block text-xs font-medium text-charcoal hover:text-olive py-1">
                      เข้าสู่ระบบลูกค้า
                    </Link>
                    <Link href="/login/merchant" className="block text-xs font-medium text-charcoal hover:text-olive py-1">
                      เข้าสู่ระบบร้านค้า
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
