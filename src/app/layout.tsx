import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "FitToday — วันนี้จะไปไหน ให้ AI ช่วยเลือกชุด",
    template: "%s | FitToday",
  },
  description:
    "AI Stylist ภาษาไทยและพื้นที่ค้นหาแฟชั่นจากร้านค้า โดยแยกคำแนะนำ AI ออกจากโฆษณาอย่างชัดเจน",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>
        <a className="skip-link" href="#main">
          ข้ามไปเนื้อหาหลัก
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
