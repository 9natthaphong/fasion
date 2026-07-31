import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <div className="wordmark">YOURSTYLIST</div>
          <p>วันนี้จะไปไหน ให้ AI ช่วยเลือกชุด</p>
        </div>
        <nav aria-label="ลิงก์ส่วนท้าย">
          <Link href="/ai-stylist">AI Stylist</Link>
          <Link href="/discover">ค้นหาโฆษณาแฟชั่น</Link>
          <Link href="/register/merchant">สมัครร้านค้า</Link>
        </nav>
        <nav aria-label="ข้อมูลทางกฎหมาย">
          <Link href="/privacy">ความเป็นส่วนตัว</Link>
          <Link href="/terms">ข้อกำหนดการใช้งาน</Link>
          <span>© 2026 YourStylist</span>
        </nav>
      </div>
    </footer>
  );
}

