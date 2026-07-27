import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export function AuthPage({
  mode,
  role,
}: {
  mode: "login" | "register";
  role: "customer" | "merchant";
}) {
  const customer = role === "customer";
  return (
    <div className="auth-page container">
      <div className="auth-intro">
        <p className="eyebrow">{customer ? "Customer account" : "Merchant account"}</p>
        <h1>
          {mode === "login" ? "ยินดีต้อนรับกลับ" : customer ? "เริ่มแต่งตัวให้วันนี้" : "เปิดร้านบน FitToday"}
        </h1>
        <p>
          {customer
            ? "บันทึกความชอบ ดูประวัติคำแนะนำ และเก็บโฆษณาที่ถูกใจไว้ในบัญชีเดียว"
            : "สร้างร้าน เตรียมโฆษณา ส่งตรวจ และดูผลตอบรับจากหน้าร้านได้อย่างชัดเจน"}
        </p>
      </div>
      <div className="auth-card">
        <h2>{mode === "login" ? "เข้าสู่ระบบ" : "สร้างบัญชี"}</h2>
        <Suspense fallback={<div className="form-skeleton" aria-label="กำลังโหลดฟอร์ม" />}>
          <AuthForm mode={mode} role={role} />
        </Suspense>
      </div>
    </div>
  );
}

