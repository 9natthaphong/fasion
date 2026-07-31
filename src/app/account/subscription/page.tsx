import { requireCustomerExperiencePage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCustomerEntitlements } from "@/lib/entitlements";
import Link from "next/link";
import { formatDate } from "@/lib/format";

export const metadata = {
  title: "Subscription | Account",
};

export default async function AccountSubscriptionPage({ searchParams }: { searchParams?: Promise<{ adminMode?: string }> }) {
  const user = await requireCustomerExperiencePage("/login/customer");
  const entitlements = await getCustomerEntitlements(user.id, user.role);
  if (user.role === "admin") {
    const params = searchParams ? await searchParams : {};
    return (
      <div className="max-w-2xl">
        <header className="dashboard-heading mb-8">
          <h1>การเป็นสมาชิก</h1>
          <p>จัดการแพ็กเกจ YourStylist ของคุณ</p>
        </header>
        {params.adminMode === "1" && (
          <div className="mb-6 rounded-lg border border-olive/30 bg-olive-pale/30 p-4 text-sm text-olive-dark">
            มุมมองผู้ดูแลไม่สามารถส่งคำขอชำระเงินหรือแนบสลิปได้ ใช้บัญชีลูกค้าทดสอบสำหรับการทดสอบการชำระเงินจริง
          </div>
        )}
        <div className="content-card rounded-xl border p-6">
          <h2 className="mb-3 text-xl font-bold">แพ็กเกจปัจจุบัน: Pro</h2>
          <p className="text-muted-foreground">บัญชีผู้ดูแลมีสิทธิ์ Pro สำหรับการทดสอบระบบ</p>
        </div>
      </div>
    );
  }
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("customer_subscription_requests")
    .select("status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const { data: sub } = await supabase
    .from("customer_subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const isPending = request?.status === "pending" || sub?.status === "pending";
  const isPro = entitlements.isProActive;

  return (
    <div className="max-w-2xl">
      <header className="dashboard-heading mb-8">
        <h1>การเป็นสมาชิก</h1>
        <p>จัดการแพ็กเกจ YourStylist ของคุณ</p>
      </header>

      <div className="content-card p-6 border rounded-xl mb-8">
        <h2 className="text-xl font-bold mb-4">แพ็กเกจปัจจุบัน: {isPro ? "Pro" : "Free"}</h2>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            {isPro 
              ? "คุณสามารถใช้งานฟีเจอร์ทั้งหมดได้ รวมถึง Weekly Planner และ Style Memory"
              : "คุณกำลังใช้แพ็กเกจฟรี ซึ่งสามารถจัดตู้เสื้อผ้าและขอคำแนะนำ AI พื้นฐานได้"}
          </p>

          {sub?.ends_at && isPro && (
            <p className="text-sm">
              รอบบิลปัจจุบันสิ้นสุดวันที่: <strong>{formatDate(sub.ends_at)}</strong>
            </p>
          )}

          {sub?.status === 'expired' && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
              แพ็กเกจ Pro ของคุณหมดอายุแล้ว หากต้องการต่ออายุ กรุณาติดต่อผู้ดูแลระบบ
            </div>
          )}
          {sub?.status === 'revoked' && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
              สิทธิ์ Pro ของคุณถูกระงับ
            </div>
          )}
        </div>
      </div>

      {!isPro && (
        <div className="content-card p-6 border rounded-xl bg-olive-pale/30">
          <h2 className="text-xl font-bold mb-2 text-olive-dark">อัปเกรดเป็น Pro</h2>
          <p className="mb-4">เข้าถึงฟีเจอร์ช่วยจำและวางแผนลุคล่วงหน้าทั้งสัปดาห์</p>
          
          {isPending ? (
            <div className="inline-block px-4 py-2 bg-secondary text-secondary-foreground rounded-md font-medium">
              คำขอของคุณอยู่ระหว่างการพิจารณา (Pending Review)
            </div>
          ) : (
            <Link href="/pricing" className="inline-block px-4 py-2 bg-olive-dark text-background rounded-md font-medium hover:bg-olive-dark/90 transition-colors">
              ดูรายละเอียดแพ็กเกจ
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
