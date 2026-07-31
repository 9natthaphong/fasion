import { getCurrentUser } from "@/lib/auth";
import { requestProAccess } from "./actions";
import { getCustomerEntitlements } from "@/lib/entitlements";
import Link from "next/link";
import { Check } from "lucide-react";

export const metadata = {
  title: "Pricing",
};

export default async function PricingPage() {
  const user = await getCurrentUser();
  
  let isPro = false;
  if (user) {
    const entitlements = await getCustomerEntitlements(user.id);
    isPro = entitlements.isProActive;
  }

  return (
    <div className="container py-16">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-serif font-bold text-olive-dark mb-4">เลือกรูปแบบที่เหมาะกับคุณ</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          จัดตู้เสื้อผ้าและค้นหาสไตล์ที่ใช่ในแต่ละวัน
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Plan */}
        <div className="border border-border rounded-xl p-8 bg-card shadow-sm flex flex-col">
          <h2 className="text-2xl font-bold mb-2">Free</h2>
          <p className="text-muted-foreground mb-6 h-12">เริ่มจัดตู้เสื้อผ้าและรับคำแนะนำพื้นฐานได้ฟรี</p>
          <div className="text-3xl font-bold mb-8">0 บาท <span className="text-lg font-normal text-muted-foreground">/ เดือน</span></div>
          
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-olive-dark shrink-0" /> <span>ใช้งานตู้เสื้อผ้าส่วนตัว</span></li>
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-olive-dark shrink-0" /> <span>ขอคำแนะนำ AI Stylist แบบพื้นฐาน</span></li>
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-olive-dark shrink-0" /> <span>บันทึกลุคและประวัติการสวมใส่</span></li>
          </ul>
          
          <div className="mt-auto">
            {user ? (
              <Link href="/account" className="block w-full py-3 px-4 bg-secondary text-secondary-foreground text-center rounded-lg font-medium hover:bg-secondary/80 transition-colors">
                บัญชีปัจจุบันของคุณ
              </Link>
            ) : (
              <Link href="/register" className="block w-full py-3 px-4 bg-olive-dark text-white text-center rounded-lg font-medium hover:bg-olive-dark/90 transition-colors">
                สมัครสมาชิกฟรี
              </Link>
            )}
          </div>
        </div>

        {/* Pro Plan */}
        <div className="border-2 border-olive-dark rounded-xl p-8 bg-olive-pale/30 shadow-md flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-olive-dark text-white text-xs font-bold px-3 py-1 rounded-bl-lg">แนะนำ</div>
          <h2 className="text-2xl font-bold mb-2 text-olive-dark">Pro</h2>
          <p className="text-muted-foreground mb-6 h-12">YourStylist ที่จดจำกิจวัตรและช่วยวางแผนชุดให้คุณทั้งสัปดาห์</p>
          
          <div className="mb-2">
            <div className="text-3xl font-bold text-olive-dark">29 บาท <span className="text-lg font-normal text-muted-foreground">/ เดือน</span></div>
            <div className="text-sm font-medium text-destructive mt-1">โปรโมชั่น: เดือนแรก 9 บาท</div>
          </div>
          <div className="text-xs text-muted-foreground mb-8">ขณะนี้ระบบใช้การอนุมัติสมาชิกโดยผู้ดูแล ยังไม่มีการตัดเงินอัตโนมัติ</div>
          
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-olive-dark shrink-0" /> <span><strong>Weekly Style Memory:</strong> จดจำสไตล์และกิจวัตรประจำวัน</span></li>
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-olive-dark shrink-0" /> <span><strong>Weekly Planner:</strong> วางแผนลุคล่วงหน้า 7 วัน</span></li>
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-olive-dark shrink-0" /> <span><strong>Smart Repeat Avoidance:</strong> หลีกเลี่ยงการแนะนำชุดซ้ำเกินไป</span></li>
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-olive-dark shrink-0" /> <span><strong>Advanced Insights:</strong> สรุปข้อมูลการใช้งานตู้เสื้อผ้าเชิงลึก</span></li>
            <li className="flex items-start gap-3"><Check className="w-5 h-5 text-olive-dark shrink-0" /> <span><strong>Appearance Themes:</strong> ปรับแต่งธีมแอปพลิเคชัน (Light/Dark/Accents)</span></li>
          </ul>
          
          <div className="mt-auto">
            {!user ? (
              <Link href="/login" className="block w-full py-3 px-4 bg-olive-dark text-white text-center rounded-lg font-medium hover:bg-olive-dark/90 transition-colors">
                เข้าสู่ระบบเพื่อสมัคร Pro
              </Link>
            ) : isPro ? (
              <Link href="/account/weekly-planner" className="block w-full py-3 px-4 bg-olive-dark text-white text-center rounded-lg font-medium hover:bg-olive-dark/90 transition-colors">
                เข้าสู่ระบบ Pro ของคุณ
              </Link>
            ) : (
              <form action={requestProAccess}>
                <button type="submit" className="block w-full py-3 px-4 bg-olive-dark text-white text-center rounded-lg font-medium hover:bg-olive-dark/90 transition-colors">
                  ขอเปิดใช้งาน Pro
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
