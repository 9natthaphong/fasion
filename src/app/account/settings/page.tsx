import { requirePageRole } from "@/lib/auth";

export default async function AccountSettingsPage() {
  const user = await requirePageRole(["customer"], "/login/customer");
  return (
    <>
      <header className="dashboard-heading">
        <p className="eyebrow">Settings</p>
        <h1>การตั้งค่าบัญชี</h1>
        <p>{user.email}</p>
      </header>
      <section className="content-card danger-zone">
        <h2>ลบบัญชี</h2>
        <p>
          การลบบัญชีจะลบโปรไฟล์ ความชอบ ประวัติคำแนะนำ และรายการถูกใจ
          ขั้นตอนนี้ไม่สามารถย้อนกลับได้
        </p>
        <form action="/api/account/delete-request" method="post">
          <label>
            พิมพ์ DELETE เพื่อยืนยัน
            <input name="confirmation" pattern="DELETE" required />
          </label>
          <button type="submit" className="button button-danger">
            ส่งคำขอลบบัญชี
          </button>
        </form>
      </section>
    </>
  );
}

