import { requireCustomerExperiencePage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCustomerEntitlements } from "@/lib/entitlements";
import { LockKeyhole } from "lucide-react";

export const metadata = { title: "Weekly Planner | Account" };

const WEEKDAYS = [
  { id: 1, label: "จันทร์" },
  { id: 2, label: "อังคาร" },
  { id: 3, label: "พุธ" },
  { id: 4, label: "พฤหัสบดี" },
  { id: 5, label: "ศุกร์" },
  { id: 6, label: "เสาร์" },
  { id: 7, label: "อาทิตย์" },
];

export default async function WeeklyPlannerPage() {
  const user = await requireCustomerExperiencePage("/login/customer");
  const entitlements = await getCustomerEntitlements(user.id, user.role);

  if (!entitlements.isProActive) {
    return (
      <div className="max-w-2xl">
        <header className="dashboard-heading mb-8">
          <h1>วางแผนลุค 7 วัน</h1>
        </header>
        <div className="content-card p-6 border rounded-xl flex items-center gap-4 bg-muted/50">
          <LockKeyhole className="w-8 h-8 text-muted-foreground" />
          <div>
            <h2 className="font-bold text-lg">ฟีเจอร์สำหรับสมาชิก Pro</h2>
            <p className="text-muted-foreground">วางแผนลุคทั้งสัปดาห์จากตู้เสื้อผ้าของคุณ พร้อมหลีกเลี่ยงการใส่ซ้ำ และคำนึงถึงกิจวัตรประจำวัน</p>
          </div>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: memories } = await supabase
    .from("weekly_style_memories")
    .select("*")
    .eq("user_id", user.id)
    .order("weekday", { ascending: true });

  const memoryMap = new Map(memories?.map(m => [m.weekday, m]));

  return (
    <div className="max-w-5xl">
      <header className="dashboard-heading mb-8">
        <h1>วางแผนลุค 7 วัน (Weekly Planner)</h1>
        <p>ให้ AI ช่วยจัดชุดล่วงหน้าสำหรับทั้งสัปดาห์ โดยอ้างอิงจากกิจวัตรของคุณ</p>
      </header>

      <div className="flex justify-end mb-6">
        <button className="px-4 py-2 bg-olive-dark text-background rounded-md text-sm font-medium hover:bg-olive-dark/90">
          สร้างแผนสำหรับสัปดาห์นี้
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {WEEKDAYS.map(day => {
          const mem = memoryMap.get(day.id);
          return (
            <div key={day.id} className="border rounded-xl bg-card overflow-hidden flex flex-col">
              <div className="p-4 border-b bg-muted/30">
                <div className="font-bold">วัน{day.label}</div>
                {mem?.is_active && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {mem.usual_activity} • {mem.time_of_day || mem.location_context}
                  </div>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col items-center justify-center text-center min-h-[160px] text-muted-foreground">
                <p className="text-sm">ยังไม่มีลุคสำหรับวันนี้</p>
                <button className="mt-4 px-3 py-1 border rounded text-xs hover:bg-muted">
                  จัดชุดให้เฉพาะวันนี้
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-12 p-6 border rounded-xl bg-olive-pale/20">
        <h2 className="font-bold mb-2">เกี่ยวกับ Weekly Planner</h2>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
          <li>แผนนี้จะใช้เสื้อผ้าที่มีสถานะ &quot;พร้อมใช้&quot; เท่านั้น (ข้ามเสื้อผ้าที่กำลังซัก)</li>
          <li>AI จะดึงข้อมูลจาก กิจวัตร (Style Memory) ของวันที่เปิดอนุญาตเท่านั้น</li>
          <li>ไม่ใช้ข้อมูลสินค้าโฆษณามาปะปนในคำแนะนำนี้</li>
        </ul>
      </div>
    </div>
  );
}
