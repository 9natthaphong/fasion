import { requirePageRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getCustomerEntitlements } from "@/lib/entitlements";
import { saveStyleMemory, clearStyleMemory } from "./actions";
import { LockKeyhole } from "lucide-react";

export const metadata = { title: "Style Memory | Account" };

const WEEKDAYS = [
  { id: 1, label: "จันทร์" },
  { id: 2, label: "อังคาร" },
  { id: 3, label: "พุธ" },
  { id: 4, label: "พฤหัสบดี" },
  { id: 5, label: "ศุกร์" },
  { id: 6, label: "เสาร์" },
  { id: 7, label: "อาทิตย์" },
];

export default async function StyleMemoryPage() {
  const user = await requirePageRole(["customer"], "/login/customer");
  const entitlements = await getCustomerEntitlements(user.id);

  if (!entitlements.isProActive) {
    return (
      <div className="max-w-2xl">
        <header className="dashboard-heading mb-8">
          <h1>กิจวัตรและสไตล์</h1>
        </header>
        <div className="content-card p-6 border rounded-xl flex items-center gap-4 bg-muted/50">
          <LockKeyhole className="w-8 h-8 text-muted-foreground" />
          <div>
            <h2 className="font-bold text-lg">ฟีเจอร์สำหรับสมาชิก Pro</h2>
            <p className="text-muted-foreground">บันทึกกิจวัตรประจำวันเพื่อให้ AI Stylist เข้าใจและแนะนำลุคที่ตรงกับกิจกรรมของคุณในแต่ละวัน</p>
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
    <div className="max-w-3xl">
      <header className="dashboard-heading mb-8">
        <h1>กิจวัตรและสไตล์ (Weekly Style Memory)</h1>
        <p>ให้ YourStylist รู้จักกิจวัตรประจำสัปดาห์ของคุณ</p>
      </header>
      
      <div className="mb-6 p-4 border rounded-lg bg-olive-pale/20 text-sm text-muted-foreground">
        ข้อมูลนี้เป็นความลับและเห็นได้เฉพาะคุณเท่านั้น ข้อมูลนี้จะไม่ถูกนำไปใช้โฆษณา และจะถูกส่งไป AI ต่อเมื่อคุณเปิดอนุญาต
      </div>

      <div className="space-y-6">
        {WEEKDAYS.map(day => {
          const mem = memoryMap.get(day.id);
          return (
            <details key={day.id} className="border rounded-xl bg-card overflow-hidden group">
              <summary className="px-6 py-4 cursor-pointer font-bold flex justify-between items-center hover:bg-muted/50">
                <span className="flex items-center gap-4">
                  <span className="w-16">วัน{day.label}</span>
                  <span className="font-normal text-muted-foreground">
                    {mem ? (mem.is_active ? mem.usual_activity : "ปิดใช้งานชั่วคราว") : "ยังไม่ได้ตั้งค่า"}
                  </span>
                </span>
                <span className="text-olive-dark text-sm group-open:hidden">แก้ไข</span>
              </summary>
              <div className="px-6 pb-6 pt-2 border-t">
                <form className="space-y-4">
                  <input type="hidden" name="weekday" value={day.id} />
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">กิจกรรมหลัก (เช่น ไปออฟฟิศ, เที่ยวคาเฟ่)</label>
                      <input type="text" name="usual_activity" defaultValue={mem?.usual_activity || ""} className="w-full border rounded-md px-3 py-2 text-sm" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">ช่วงเวลา (เช่น เช้า-เย็น)</label>
                      <input type="text" name="time_of_day" defaultValue={mem?.time_of_day || ""} className="w-full border rounded-md px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">สถานที่ / บริบท (เช่น ทองหล่อ, สุขุมวิท)</label>
                      <input type="text" name="location_context" defaultValue={mem?.location_context || ""} className="w-full border rounded-md px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">ระดับความทางการ</label>
                      <input type="text" name="formality" defaultValue={mem?.formality || ""} className="w-full border rounded-md px-3 py-2 text-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">สไตล์ที่ชอบ (คั่นด้วยลูกน้ำ)</label>
                    <input type="text" name="preferred_styles" defaultValue={mem?.preferred_styles?.join(", ") || ""} className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Minimal, Smart Casual" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">ชื่อเรียก (Title)</label>
                    <input type="text" name="title" defaultValue={mem?.title || `กิจวัตรวัน${day.label}`} className="w-full border rounded-md px-3 py-2 text-sm" required />
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="hidden" name="is_active" value="false" />
                      <input type="checkbox" name="is_active" value="true" defaultChecked={mem ? mem.is_active : true} />
                      เปิดใช้งานกิจวัตรนี้
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="hidden" name="use_for_ai" value="false" />
                      <input type="checkbox" name="use_for_ai" value="true" defaultChecked={mem ? mem.use_for_ai : true} />
                      ยินยอมให้ส่งข้อมูลนี้ไปวิเคราะห์กับ AI Stylist
                    </label>
                  </div>

                  <div className="flex justify-between pt-4">
                    {mem ? (
                      <button formAction={async () => { "use server"; await clearStyleMemory(day.id); }} className="text-destructive text-sm hover:underline">
                        ลบข้อมูลของวันนี้
                      </button>
                    ) : <div></div>}
                    <button formAction={saveStyleMemory} className="px-4 py-2 bg-olive-dark text-white rounded-md text-sm font-medium">
                      บันทึกข้อมูล
                    </button>
                  </div>
                </form>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
