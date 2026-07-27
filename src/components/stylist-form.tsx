"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Sparkles, ShieldCheck, Info, Check, AlertCircle, RefreshCw } from "lucide-react";
import type { OutfitResponse } from "@/lib/types";

type StylistFields = {
  heightCm: string;
  weightKg: string;
  clothingPresentation: "menswear" | "womenswear" | "unisex" | "unspecified";
  activity: string;
  formality: "casual" | "smart_casual" | "formal";
  weather: string;
  timeOfDay: "morning" | "afternoon" | "evening" | "all_day";
  preferredStyles: string;
  preferredColors: string;
  avoidedColors: string;
  preferredFit: "fitted" | "relaxed" | "unspecified";
  budget: string;
  anchorItem: string;
  notes: string;
  saveForNextTime: boolean;
};

const activities = ["ไปทำงาน", "ไปมหาวิทยาลัย", "ไปคาเฟ่", "ไปเดต", "ไปงานแต่ง", "ไปวัด", "ไปเที่ยวทะเล", "ออกกำลังกาย", "เดินทาง", "อยู่บ้าน", "อื่นๆ"];

export function StylistForm({ configured }: { configured: boolean }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<StylistFields>({
    defaultValues: { clothingPresentation: "unspecified", formality: "casual", timeOfDay: "all_day", preferredFit: "unspecified", saveForNextTime: false },
  });
  const [result, setResult] = useState<OutfitResponse | null>(null);
  const [error, setError] = useState("");

  async function submit(values: StylistFields) {
    setError("");
    setResult(null);
    const response = await fetch("/api/ai-stylist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...values,
        heightCm: values.heightCm ? Number(values.heightCm) : null,
        weightKg: values.weightKg ? Number(values.weightKg) : null,
        budget: values.budget ? Number(values.budget) : null,
        preferredStyles: splitList(values.preferredStyles),
        preferredColors: splitList(values.preferredColors),
        avoidedColors: splitList(values.avoidedColors),
      }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body.code === "configuration_missing" ? "ยังไม่ได้ตั้งค่า OpenAI API สำหรับ environment นี้" : body.error ?? "สร้างคำแนะนำไม่สำเร็จ กรุณาลองใหม่");
      return;
    }
    setResult(body);
    setTimeout(() => {
      document.querySelector("#stylist-results")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  return (
    <>
      {!configured ? (
        <div className="p-4 mb-8 border border-warning/40 bg-warning/10 rounded-xl flex items-start gap-3 text-sm" role="status">
          <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div>
            <strong className="block font-medium text-warning mb-0.5">Development configuration missing</strong>
            <p className="text-muted">ฟอร์มและ validation พร้อมแล้ว แต่ต้องเพิ่ม OPENAI_API_KEY บน server จึงจะเรียก AI จริงได้ ระบบจะไม่แสดง mock แบบเงียบๆ</p>
          </div>
        </div>
      ) : null}

      <div className="grid lg:grid-cols-[1fr_340px] gap-10 items-start">
        {/* Main 6-Step Guided Form */}
        <form className="space-y-8" onSubmit={handleSubmit(submit)}>
          {/* Step 1: วันนี้ไปไหน */}
          <div className="p-6 md:p-8 bg-paper border border-line rounded-xl space-y-5">
            <div className="flex items-center gap-3 border-b border-line pb-4">
              <span className="w-7 h-7 rounded-full bg-olive text-white font-mono text-xs flex items-center justify-center font-medium">1</span>
              <div>
                <h2 className="font-medium text-lg">วันนี้ไปไหน?</h2>
                <p className="text-xs text-muted">เลือกลักษณะกิจกรรมและระดับความเป็นทางการ</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">กิจกรรมวันนี้ *</label>
                <select className="w-full p-2.5 bg-background border border-line rounded-lg text-sm" {...register("activity", { required: "กรุณาเลือกกิจกรรม" })}>
                  <option value="">เลือกกิจกรรม</option>
                  {activities.map((act) => <option key={act} value={act}>{act}</option>)}
                </select>
                {errors.activity ? <small className="text-xs text-danger mt-1 block">{errors.activity.message}</small> : null}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">ระดับความเป็นทางการ</label>
                <select className="w-full p-2.5 bg-background border border-line rounded-lg text-sm" {...register("formality")}>
                  <option value="casual">ลำลอง (Casual)</option>
                  <option value="smart_casual">Smart Casual</option>
                  <option value="formal">ทางการ (Formal)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Step 2: อากาศและช่วงเวลา */}
          <div className="p-6 md:p-8 bg-paper border border-line rounded-xl space-y-5">
            <div className="flex items-center gap-3 border-b border-line pb-4">
              <span className="w-7 h-7 rounded-full bg-olive text-white font-mono text-xs flex items-center justify-center font-medium">2</span>
              <div>
                <h2 className="font-medium text-lg">อากาศและช่วงเวลา</h2>
                <p className="text-xs text-muted">ระบุอุณหภูมิ สภาพอากาศ และเวลาที่จะไป</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">สภาพอากาศ / อุณหภูมิ *</label>
                <input className="w-full p-2.5 bg-background border border-line rounded-lg text-sm" placeholder="เช่น 32°C ร้อนชื้น มีแดด" {...register("weather", { required: "กรุณาระบุสภาพอากาศ" })} />
                {errors.weather ? <small className="text-xs text-danger mt-1 block">{errors.weather.message}</small> : null}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">ช่วงเวลา</label>
                <select className="w-full p-2.5 bg-background border border-line rounded-lg text-sm" {...register("timeOfDay")}>
                  <option value="all_day">ทั้งวัน (All Day)</option>
                  <option value="morning">ช่วงเช้า</option>
                  <option value="afternoon">ช่วงบ่าย</option>
                  <option value="evening">ช่วงเย็น / ค่ำ</option>
                </select>
              </div>
            </div>
          </div>

          {/* Step 3: สไตล์และสี */}
          <div className="p-6 md:p-8 bg-paper border border-line rounded-xl space-y-5">
            <div className="flex items-center gap-3 border-b border-line pb-4">
              <span className="w-7 h-7 rounded-full bg-olive text-white font-mono text-xs flex items-center justify-center font-medium">3</span>
              <div>
                <h2 className="font-medium text-lg">สไตล์และโทนสี</h2>
                <p className="text-xs text-muted">บอกแนวเสื้อผ้าและสีที่อยากใส่หรืออยากหลีกเลี่ยง</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">สไตล์ที่ชอบ (คั่นด้วยจุลภาค)</label>
                <input className="w-full p-2.5 bg-background border border-line rounded-lg text-sm" placeholder="เช่น Minimal, Streetwear, Workwear" {...register("preferredStyles")} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">สีที่ชอบ</label>
                  <input className="w-full p-2.5 bg-background border border-line rounded-lg text-sm" placeholder="เช่น ขาว, เขียวมะกอก, กรมท่า" {...register("preferredColors")} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">สีที่ไม่อยากใส่</label>
                  <input className="w-full p-2.5 bg-background border border-line rounded-lg text-sm" placeholder="เช่น ส้มสด, นีออน" {...register("avoidedColors")} />
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: รูปร่างและทรงเสื้อผ้า */}
          <div className="p-6 md:p-8 bg-paper border border-line rounded-xl space-y-5">
            <div className="flex items-center gap-3 border-b border-line pb-4">
              <span className="w-7 h-7 rounded-full bg-olive text-white font-mono text-xs flex items-center justify-center font-medium">4</span>
              <div>
                <h2 className="font-medium text-lg">รูปร่างและทรงเสื้อผ้า</h2>
                <p className="text-xs text-muted">ใส่สัดส่วนคร่าวๆ หรือทรงเสื้อผ้าที่ใส่สบาย</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">ส่วนสูง (ซม.)</label>
                <input type="number" min={80} max={260} className="w-full p-2.5 bg-background border border-line rounded-lg text-sm" placeholder="170" {...register("heightCm")} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">น้ำหนัก (กก.)</label>
                <input type="number" min={20} max={350} step="0.1" className="w-full p-2.5 bg-background border border-line rounded-lg text-sm" placeholder="62" {...register("weightKg")} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">ทรงที่ชอบ</label>
                <select className="w-full p-2.5 bg-background border border-line rounded-lg text-sm" {...register("preferredFit")}>
                  <option value="unspecified">ไม่ระบุ</option>
                  <option value="fitted">พอดีตัว (Fitted)</option>
                  <option value="relaxed">ทรงสบาย (Relaxed / Oversized)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">แนวการแต่งตัวที่สนใจ</label>
              <select className="w-full p-2.5 bg-background border border-line rounded-lg text-sm" {...register("clothingPresentation")}>
                <option value="unspecified">ไม่ระบุ (แต่งตามสไตล์ทั่วไป)</option>
                <option value="menswear">เสื้อผ้าผู้ชาย (Menswear)</option>
                <option value="womenswear">เสื้อผ้าผู้หญิง (Womenswear)</option>
                <option value="unisex">ไร้เพศ (Unisex)</option>
              </select>
            </div>
          </div>

          {/* Step 5: งบประมาณและเสื้อผ้าชิ้นหลัก */}
          <div className="p-6 md:p-8 bg-paper border border-line rounded-xl space-y-5">
            <div className="flex items-center gap-3 border-b border-line pb-4">
              <span className="w-7 h-7 rounded-full bg-olive text-white font-mono text-xs flex items-center justify-center font-medium">5</span>
              <div>
                <h2 className="font-medium text-lg">งบประมาณ & ชิ้นหลักที่มีอยู่</h2>
                <p className="text-xs text-muted">งบประมาณและเสื้อผ้าเดิมที่อยากแมตช์</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">งบประมาณโดยประมาณ (บาท)</label>
                <input type="number" min={0} max={1000000} className="w-full p-2.5 bg-background border border-line rounded-lg text-sm" placeholder="เช่น 1500" {...register("budget")} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">ชิ้นที่อยากใช้เป็นหลัก (Anchor Item)</label>
                <textarea rows={2} className="w-full p-2.5 bg-background border border-line rounded-lg text-sm resize-none" placeholder="เช่น กางเกงยีนส์สีเข้มที่มีอยู่แล้ว หรือรองเท้าผ้าใบสีขาว" {...register("anchorItem")} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">หมายเหตุเพิ่มเติม</label>
                <textarea rows={2} className="w-full p-2.5 bg-background border border-line rounded-lg text-sm resize-none" placeholder="ข้อจำกัดหรือบริบทอื่น เช่น ต้องเดินเยอะ อยู่ในห้องแอร์เย็น" {...register("notes")} />
              </div>
            </div>
          </div>

          {/* Step 6: การบันทึกข้อมูล */}
          <div className="p-6 bg-paper border border-line rounded-xl space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" className="mt-1 rounded border-line text-olive focus:ring-olive" {...register("saveForNextTime")} />
              <div>
                <strong className="block text-sm font-medium">บันทึกสัดส่วนและความชอบไว้ใช้ครั้งหน้า</strong>
                <span className="text-xs text-muted block">หากไม่ติ๊ก ระบบจะไม่บันทึกส่วนสูงและน้ำหนักลงใน customer preferences เพื่อความเป็นส่วนตัว</span>
              </div>
            </label>
          </div>

          {error ? (
            <div className="p-4 bg-danger/10 border border-danger/30 rounded-xl text-danger text-sm flex items-center gap-2" role="alert">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <button
            className="w-full button button-solid py-3 text-base flex items-center justify-center gap-2 shadow-sm"
            disabled={isSubmitting || !configured}
            type="submit"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>AI กำลังประมวลผลจัดลุค 3 ทางเลือก…</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>สร้างคำแนะนำ 3 ชุดสำหรับวันนี้</span>
              </>
            )}
          </button>
        </form>

        {/* Desktop Contextual Side Panel */}
        <aside className="space-y-6 sticky top-24">
          <div className="p-6 bg-paper border border-line rounded-xl space-y-4 text-sm">
            <h3 className="font-serif text-xl font-normal border-b border-line pb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-olive" />
              <span>หลักการของ AI Stylist</span>
            </h3>
            <div className="space-y-3 text-xs text-muted leading-relaxed">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-olive shrink-0 mt-0.5" />
                <span><strong>เป็นกลาง 100%:</strong> ไม่มีสินค้าสปอนเซอร์แอบแฝงในคำแนะนำ</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-olive shrink-0 mt-0.5" />
                <span><strong>ไร้การตัดสิน:</strong> ให้เกียรติรูปร่างและสไตล์ของผู้แต่งตัวทุกคน</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-olive shrink-0 mt-0.5" />
                <span><strong>3 ทิศทางชัดเจน:</strong> ใส่ง่าย (Safe), แต่งขึ้น (Elevated), สบาย (Comfortable)</span>
              </div>
            </div>
          </div>

          <div className="p-6 border border-line rounded-xl bg-olive-pale/30 space-y-2 text-xs">
            <strong className="block font-medium text-charcoal flex items-center gap-1.5">
              <Info className="w-4 h-4 text-olive" />
              <span>ข้อแนะนำสำคัญเกี่ยวกับไซซ์</span>
            </strong>
            <p className="text-muted leading-relaxed">
              ไซซ์และสัดส่วนในคำแนะนำเป็นเพียงการประมาณการเชิงสไตล์เท่านั้น กรุณาตรวจสอบตารางไซซ์จริงของร้านค้าก่อนสั่งซื้อ
            </p>
          </div>
        </aside>
      </div>

      {/* Results Section */}
      <section id="stylist-results" className="mt-16 pt-12 border-t border-line scroll-mt-24" aria-live="polite">
        {isSubmitting ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-8 bg-line/40 rounded w-1/3"></div>
            <div className="h-4 bg-line/30 rounded w-2/3"></div>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="h-96 bg-paper border border-line rounded-xl p-6"></div>
              <div className="h-96 bg-paper border border-line rounded-xl p-6"></div>
              <div className="h-96 bg-paper border border-line rounded-xl p-6"></div>
            </div>
          </div>
        ) : null}

        {result ? (
          <div className="space-y-10">
            <div className="bg-paper border border-line p-8 rounded-xl space-y-3">
              <p className="eyebrow">Your Custom Edit</p>
              <h2 className="font-serif text-3xl md:text-4xl font-normal">คำแนะนำชุดสำหรับวันนี้</h2>
              <p className="text-muted leading-relaxed text-base">{result.summary}</p>
              {result.isDemo ? <span className="inline-block text-xs font-mono text-olive bg-olive-pale px-2.5 py-1 rounded">Demo Mode</span> : null}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {result.outfits.map((outfit, index) => {
                const badge = getDirectionBadge(outfit.direction);
                return (
                  <article className="bg-paper border border-line p-6 rounded-xl space-y-5 flex flex-col justify-between" key={outfit.direction}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-line pb-3">
                        <span className="font-mono text-xs text-muted">0{index + 1}</span>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${badge.bg} ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-serif text-2xl font-normal mb-1">{outfit.name}</h3>
                        <p className="text-xs font-mono text-olive">{outfit.style}</p>
                      </div>

                      <div className="space-y-2 text-sm pt-2">
                        <div className="border-b border-line/60 pb-2">
                          <span className="text-xs text-muted block">เสื้อ</span>
                          <span className="font-medium text-charcoal">{outfit.top}</span>
                        </div>
                        <div className="border-b border-line/60 pb-2">
                          <span className="text-xs text-muted block">ท่อนล่าง / เดรส</span>
                          <span className="font-medium text-charcoal">{outfit.bottom}</span>
                        </div>
                        {outfit.outerwear ? (
                          <div className="border-b border-line/60 pb-2">
                            <span className="text-xs text-muted block">เสื้อคลุม / เลเยอร์</span>
                            <span className="font-medium text-charcoal">{outfit.outerwear}</span>
                          </div>
                        ) : null}
                        <div className="border-b border-line/60 pb-2">
                          <span className="text-xs text-muted block">รองเท้า</span>
                          <span className="font-medium text-charcoal">{outfit.shoes}</span>
                        </div>
                        <div className="border-b border-line/60 pb-2">
                          <span className="text-xs text-muted block">เครื่องประดับ</span>
                          <span className="font-medium text-charcoal">{outfit.accessories.join(", ") || "ไม่จำเป็น"}</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <span className="text-xs text-muted block mb-1.5">พาเลตต์สีแนะนำ</span>
                        <div className="flex flex-wrap gap-1.5">
                          {outfit.colorPalette.map((color) => (
                            <span className="text-xs bg-background border border-line px-2 py-0.5 rounded text-charcoal" key={color}>
                              {color}
                            </span>
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-muted leading-relaxed pt-2">{outfit.reason}</p>
                    </div>

                    <div className="pt-4 border-t border-line space-y-2 text-xs">
                      <p className="text-muted">💡 {outfit.comfortNote}</p>
                      <p className="text-muted">📏 {outfit.sizeNote}</p>
                      <strong className="block text-sm text-charcoal font-medium pt-1">{outfit.estimatedBudgetText}</strong>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="p-8 bg-paper border border-line rounded-xl space-y-4">
              <h3 className="font-serif text-2xl font-normal">คำแนะนำเพิ่มเติมในการแต่งตัว</h3>
              <ul className="grid sm:grid-cols-2 gap-3 text-sm text-muted list-disc list-inside">
                {result.generalTips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
              <div className="pt-4 border-t border-line">
                <p className="text-xs font-medium text-olive bg-olive-pale/60 p-3 rounded-lg text-center">
                  คำแนะนำไซซ์เป็นเพียงการประมาณ กรุณาตรวจสอบตารางไซซ์ของร้านก่อนสั่งซื้อ
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}

function splitList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function getDirectionBadge(direction: string) {
  switch (direction) {
    case "safe":
      return { label: "ใส่ง่าย (Safe)", bg: "bg-olive-pale", color: "text-olive-dark" };
    case "elevated":
      return { label: "แต่งขึ้น (Elevated)", bg: "bg-charcoal", color: "text-white" };
    case "comfortable":
    default:
      return { label: "สบาย (Comfortable)", bg: "bg-background border border-line", color: "text-charcoal" };
  }
}

