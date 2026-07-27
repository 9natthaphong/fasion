import type { Metadata } from "next";
import { AuthPage } from "@/components/auth-page";
export const metadata: Metadata = { title: "สมัครบัญชีร้านค้า" };
export default function Page() {
  return <AuthPage mode="register" role="merchant" />;
}

