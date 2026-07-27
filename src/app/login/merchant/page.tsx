import type { Metadata } from "next";
import { AuthPage } from "@/components/auth-page";
export const metadata: Metadata = { title: "เข้าสู่ระบบร้านค้า" };
export default function Page() {
  return <AuthPage mode="login" role="merchant" />;
}

