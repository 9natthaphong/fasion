import type { Metadata } from "next";
import { Noto_Sans_Thai, Noto_Serif_Thai } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const notoSerifThai = Noto_Serif_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "YourStylist — สไตลิสต์ส่วนตัวที่ยิ่งใช้ ยิ่งรู้จักคุณ",
    template: "%s | YourStylist",
  },
  description:
    "ช่วยเลือกชุดจากเสื้อผ้าที่คุณมี พร้อมจดจำกิจวัตรและสไตล์ในแต่ละวัน",
};

import { getCurrentUser } from "@/lib/auth";

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const currentUser = await getCurrentUser();

  return (
    <html lang="th" className={`${notoSansThai.variable} ${notoSerifThai.variable}`}>
      <body className="bg-background text-foreground antialiased selection:bg-olive-pale selection:text-olive-dark">
        <a className="skip-link" href="#main">
          ข้ามไปเนื้อหาหลัก
        </a>
        <SiteHeader user={currentUser} />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
