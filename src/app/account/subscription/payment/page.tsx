import { requirePageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCustomerEntitlements } from "@/lib/entitlements";
import Link from "next/link";
import { redirect } from "next/navigation";
import PaymentForm from "./PaymentForm";

export const metadata = { title: "Payment | YourStylist" };

export default async function PaymentPage() {
  const user = await requirePageRole(["customer"], "/login/customer");
  const entitlements = await getCustomerEntitlements(user.id);
  
  if (entitlements.isProActive) {
    redirect("/account/subscription");
  }

  const supabase = await createClient();

  const { data: request } = await supabase
    .from("customer_subscription_requests")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!request) {
    redirect("/pricing");
  }

  // Determine expected amount
  const { data: subHistory } = await supabase
    .from("customer_subscriptions")
    .select("plan")
    .eq("user_id", user.id);
    
  const hasPastPro = subHistory && subHistory.some(s => s.plan === "pro");
  const expectedAmount = hasPastPro ? 29 : 9;

  // Retrieve existing proof
  const { data: currentProof } = await supabase
    .from("subscription_payment_proofs")
    .select("*")
    .eq("request_id", request.id)
    .eq("status", "submitted")
    .single();

  return (
    <div className="max-w-xl mx-auto py-8">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-serif font-bold text-olive-dark mb-2">ชำระเงินค่าบริการ Pro</h1>
        <p className="text-muted-foreground">ตรวจสอบข้อมูลและแนบสลิปการโอนเงินเพื่อเปิดใช้งาน</p>
      </header>

      <div className="border border-border rounded-xl p-6 bg-card shadow-sm mb-6">
        <h2 className="text-xl font-bold mb-4">สรุปยอดชำระ</h2>
        <div className="flex justify-between items-center mb-2 pb-2 border-b">
          <span className="text-muted-foreground">แพ็กเกจ</span>
          <span className="font-medium">YourStylist Pro (1 เดือน)</span>
        </div>
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <span className="text-muted-foreground">สถานะโปรโมชั่น</span>
          <span className="font-medium text-olive-dark">{hasPastPro ? "ราคาปกติ" : "ทดลองเดือนแรก"}</span>
        </div>
        <div className="flex justify-between items-center text-lg font-bold text-olive-dark">
          <span>ยอดรวมที่ต้องชำระ</span>
          <span>{expectedAmount} บาท</span>
        </div>
      </div>

      <div className="border border-border rounded-xl p-6 bg-card shadow-sm mb-6 text-center">
        <h2 className="text-xl font-bold mb-2">สแกนเพื่อชำระเงิน</h2>
        <p className="text-sm text-muted-foreground mb-4">
          ชำระด้วยการโอนและตรวจสอบโดยผู้ดูแล<br />
          ระบบยังไม่มีการตัดเงินอัตโนมัติ
        </p>
        
        <div className="bg-white p-4 rounded-lg inline-block mx-auto mb-4 border shadow-sm">
          <a href="/images/fittoday/forpayment.jpg" target="_blank" rel="noopener noreferrer">
            <img src="/images/fittoday/forpayment.jpg" alt="Payment QR Code" className="w-64 h-auto mx-auto object-contain" />
          </a>
        </div>
        
        <div className="mb-4">
          <a href="/images/fittoday/forpayment.jpg" download="fittoday-payment-qr.jpg" className="inline-block px-4 py-2 bg-secondary text-secondary-foreground text-sm rounded hover:opacity-90">
            บันทึก QR สำหรับชำระเงิน
          </a>
        </div>
      </div>

      <div className="border border-border rounded-xl p-6 bg-card shadow-sm">
        <h2 className="text-xl font-bold mb-4">แจ้งหลักฐานการโอนเงิน</h2>
        {request.payment_status === 'submitted' && currentProof ? (
          <div className="p-4 bg-olive-pale/30 border border-olive-dark/20 rounded-lg text-center">
            <p className="font-medium text-olive-dark mb-2">ส่งสลิปแล้ว รอตรวจสอบ</p>
            <p className="text-sm text-muted-foreground">
              ผู้ดูแลกำลังตรวจสอบรายการของคุณ หากมีปัญหาจะแจ้งให้ทราบ
            </p>
          </div>
        ) : request.payment_status === 'needs_resubmission' ? (
          <div className="mb-4">
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-center mb-4">
              <p className="font-medium text-destructive mb-2">ต้องส่งสลิปใหม่</p>
              <p className="text-sm text-destructive/80 mb-2">{request.admin_note}</p>
            </div>
            <PaymentForm requestId={request.id} expectedAmount={expectedAmount} userId={user.id} />
          </div>
        ) : (
          <PaymentForm requestId={request.id} expectedAmount={expectedAmount} userId={user.id} />
        )}
      </div>
    </div>
  );
}
