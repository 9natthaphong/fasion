"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { User, LogOut, ChevronDown, Shield, Store, Shirt } from "lucide-react";
import type { CurrentUser } from "@/lib/auth";
import { resolveAvatarUrl } from "@/lib/assets";

function getInitials(displayName: string | null, email: string | null): string {
  if (displayName && displayName.trim()) {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    return email.slice(0, 2).toUpperCase();
  }
  return "FT";
}

export function UserAccountMenu({ user }: { user: CurrentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const initials = getInitials(user.displayName, user.email);
  const resolvedAvatar = resolveAvatarUrl(user.avatarUrl);
  const displayName = user.displayName || user.email || "ผู้ใช้งาน";

  const roleLabel =
    user.role === "admin"
      ? "Admin Console"
      : user.role === "merchant"
      ? "Merchant Studio"
      : "ลูกค้า";

  // Close dropdown on Escape key or click outside
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`เมนูบัญชีผู้ใช้ ${displayName}`}
        className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-charcoal bg-paper hover:bg-paper-hover border border-line rounded-none transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-olive focus:ring-offset-1"
      >
        {resolvedAvatar ? (
          <Image
            src={resolvedAvatar}
            alt={displayName}
            width={24}
            height={24}
            className="w-6 h-6 rounded-full object-cover shrink-0"
          />
        ) : (
          <span className="w-6 h-6 rounded-full bg-olive text-background text-[10px] font-bold inline-flex items-center justify-center shrink-0">
            {initials}
          </span>
        )}
        <span className="max-w-[120px] truncate font-medium">{displayName}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 top-full mt-2 w-64 bg-background border border-line p-2 shadow-xl z-50 space-y-1 text-xs"
        >
          {/* Header Info */}
          <div className="px-3 py-2.5 border-b border-line bg-paper/50">
            <p className="font-medium text-charcoal truncate">{displayName}</p>
            <p className="text-[11px] text-muted truncate">{user.email}</p>
            <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 bg-ivory border border-line text-[10px] font-mono text-olive font-semibold uppercase">
              {user.role === "admin" && <Shield className="w-3 h-3 text-olive" />}
              {user.role === "merchant" && <Store className="w-3 h-3 text-olive" />}
              {user.role === "customer" && <Shirt className="w-3 h-3 text-olive" />}
              <span>{roleLabel}</span>
            </div>
          </div>

          {/* Role-Aware Nav Items */}
          <div className="py-1">
            {user.role === "customer" && (
              <>
                <Link
                  href="/account"
                  onClick={() => setIsOpen(false)}
                  role="menuitem"
                  className="flex items-center gap-2 px-3 py-2.5 text-charcoal hover:bg-paper font-medium min-h-[44px] transition-colors"
                >
                  <User className="w-4 h-4 text-muted" />
                  <span>บัญชีของฉัน</span>
                </Link>
                <Link
                  href="/account/wardrobe"
                  onClick={() => setIsOpen(false)}
                  role="menuitem"
                  className="flex items-center gap-2 px-3 py-2.5 text-charcoal hover:bg-paper font-medium min-h-[44px] transition-colors"
                >
                  <Shirt className="w-4 h-4 text-muted" />
                  <span>ตู้เสื้อผ้าของฉัน</span>
                </Link>
              </>
            )}

            {user.role === "merchant" && (
              <>
                <Link
                  href="/merchant"
                  onClick={() => setIsOpen(false)}
                  role="menuitem"
                  className="flex items-center gap-2 px-3 py-2.5 text-charcoal hover:bg-paper font-medium min-h-[44px] transition-colors"
                >
                  <Store className="w-4 h-4 text-muted" />
                  <span>Merchant Studio</span>
                </Link>
                <Link
                  href="/merchant/shop"
                  onClick={() => setIsOpen(false)}
                  role="menuitem"
                  className="flex items-center gap-2 px-3 py-2.5 text-charcoal hover:bg-paper font-medium min-h-[44px] transition-colors"
                >
                  <span>ร้านค้าของฉัน</span>
                </Link>
                <Link
                  href="/merchant/ads"
                  onClick={() => setIsOpen(false)}
                  role="menuitem"
                  className="flex items-center gap-2 px-3 py-2.5 text-charcoal hover:bg-paper font-medium min-h-[44px] transition-colors"
                >
                  <span>จัดการโฆษณา</span>
                </Link>
              </>
            )}

            {user.role === "admin" && (
              <>
                <Link
                  href="/account"
                  onClick={() => setIsOpen(false)}
                  role="menuitem"
                  className="flex items-center gap-2 px-3 py-2.5 text-charcoal hover:bg-paper font-medium min-h-[44px] transition-colors"
                >
                  <User className="w-4 h-4 text-muted" />
                  <span>มุมมองลูกค้า</span>
                </Link>
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  role="menuitem"
                  className="flex items-center gap-2 px-3 py-2.5 text-charcoal hover:bg-paper font-medium min-h-[44px] transition-colors"
                >
                  <Shield className="w-4 h-4 text-muted" />
                  <span>แผงผู้ดูแล</span>
                </Link>
                <Link
                  href="/admin/shops"
                  onClick={() => setIsOpen(false)}
                  role="menuitem"
                  className="flex items-center gap-2 px-3 py-2.5 text-charcoal hover:bg-paper font-medium min-h-[44px] transition-colors"
                >
                  <span>ตรวจสอบร้านค้า</span>
                </Link>
                <Link
                  href="/admin/ads"
                  onClick={() => setIsOpen(false)}
                  role="menuitem"
                  className="flex items-center gap-2 px-3 py-2.5 text-charcoal hover:bg-paper font-medium min-h-[44px] transition-colors"
                >
                  <span>ตรวจสอบโฆษณา</span>
                </Link>
                <Link
                  href="/admin/users"
                  onClick={() => setIsOpen(false)}
                  role="menuitem"
                  className="flex items-center gap-2 px-3 py-2.5 text-charcoal hover:bg-paper font-medium min-h-[44px] transition-colors"
                >
                  <span>จัดการผู้ใช้</span>
                </Link>
              </>
            )}
          </div>

          {/* Logout Action */}
          <div className="pt-1 border-t border-line">
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                role="menuitem"
                className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-rose-700 hover:bg-rose-50 font-medium min-h-[44px] transition-colors text-left"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>ออกจากระบบ</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
