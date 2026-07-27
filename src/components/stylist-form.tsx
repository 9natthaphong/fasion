"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
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
    document.querySelector("#stylist-results")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      {!configured ? <div className="config-notice" role="status"><strong>Development configuration missing</strong><p>ฟอร์มและ validation พร้อมแล้ว แต่ต้องเพิ่ม OPENAI_API_KEY บน server จึงจะเรียก AI จริงได้ ระบบจะไม่แสดง mock แบบเงียบๆ</p></div> : null}
      <form className="stack-form stylist-form" onSubmit={handleSubmit(submit)}>
        <div className="form-grid">
          <label>ส่วนสูง (ซม.)<input type="number" min={80} max={260} {...register("heightCm")} /></label>
          <label>น้ำหนัก (กก.)<input type="number" min={20} max={350} step="0.1" {...register("weightKg")} /></label>
        </div>
        <label>แนวเสื้อผ้าที่สนใจ<select {...register("clothingPresentation")}><option value="unspecified">ไม่ระบุ</option><option value="menswear">ผู้ชาย</option><option value="womenswear">ผู้หญิง</option><option value="unisex">Unisex</option></select></label>
        <div className="form-grid">
          <label>กิจกรรมวันนี้<select {...register("activity", { required: "กรุณาเลือกกิจกรรม" })}><option value="">เลือกกิจกรรม</option>{activities.map((activity) => <option key={activity}>{activity}</option>)}</select>{errors.activity ? <small className="field-error">{errors.activity.message}</small> : null}</label>
          <label>ระดับความเป็นทางการ<select {...register("formality")}><option value="casual">ลำลอง</option><option value="smart_casual">Smart casual</option><option value="formal">ทางการ</option></select></label>
        </div>
        <div className="form-grid">
          <label>อุณหภูมิหรือสภาพอากาศ<input placeholder="เช่น 32°C ร้อนชื้น มีโอกาสฝนตก" {...register("weather", { required: "กรุณาระบุสภาพอากาศ" })} />{errors.weather ? <small className="field-error">{errors.weather.message}</small> : null}</label>
          <label>ช่วงเวลา<select {...register("timeOfDay")}><option value="all_day">ทั้งวัน</option><option value="morning">เช้า</option><option value="afternoon">บ่าย</option><option value="evening">เย็น / กลางคืน</option></select></label>
        </div>
        <div className="form-grid">
          <label>สไตล์ที่ชอบ<input placeholder="Minimal, Streetwear (คั่นด้วยจุลภาค)" {...register("preferredStyles")} /></label>
          <label>ทรงที่ชอบ<select {...register("preferredFit")}><option value="unspecified">ไม่ระบุ</option><option value="fitted">พอดีตัว</option><option value="relaxed">หลวม</option></select></label>
        </div>
        <div className="form-grid">
          <label>สีที่ชอบ<input placeholder="มะกอก, ขาว, น้ำเงิน" {...register("preferredColors")} /></label>
          <label>สีที่ไม่ต้องการ<input placeholder="ส้ม, ชมพูนีออน" {...register("avoidedColors")} /></label>
        </div>
        <label>งบประมาณโดยประมาณ (บาท)<input type="number" min={0} max={1_000_000} {...register("budget")} /></label>
        <label>ชิ้นที่อยากใช้เป็นหลัก<textarea rows={2} placeholder="เช่น กางเกงยีนส์สีเข้มที่มีอยู่แล้ว" {...register("anchorItem")} /></label>
        <label>หมายเหตุเพิ่มเติม<textarea rows={3} placeholder="ข้อจำกัดหรือบริบทอื่นที่ช่วยให้แนะนำได้ดีขึ้น" {...register("notes")} /></label>
        <label className="checkbox-line"><input type="checkbox" {...register("saveForNextTime")} /> บันทึกข้อมูลนี้ไว้ใช้ครั้งหน้า</label>
        <p className="privacy-note">ถ้าไม่เลือกบันทึก ระบบจะไม่เก็บส่วนสูงและน้ำหนักใน customer preferences</p>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
        <button className="button button-solid" disabled={isSubmitting || !configured} type="submit">{isSubmitting ? "AI กำลังจัดลุค…" : "สร้างคำแนะนำ 3 ชุด"}</button>
      </form>
      <section id="stylist-results" className="stylist-results" aria-live="polite">
        {result ? <>
          <div className="result-summary"><p className="eyebrow">Your edit</p><h2>คำแนะนำสำหรับวันนี้</h2><p>{result.summary}</p>{result.isDemo ? <strong>ข้อมูลตัวอย่าง</strong> : null}</div>
          <div className="outfit-grid">{result.outfits.map((outfit, index) => <article className="outfit-card" key={outfit.direction}><span>0{index + 1} · {directionLabel(outfit.direction)}</span><h3>{outfit.name}</h3><p className="outfit-style">{outfit.style}</p><dl><div><dt>เสื้อ</dt><dd>{outfit.top}</dd></div><div><dt>ท่อนล่าง / เดรส</dt><dd>{outfit.bottom}</dd></div>{outfit.outerwear ? <div><dt>เลเยอร์</dt><dd>{outfit.outerwear}</dd></div> : null}<div><dt>รองเท้า</dt><dd>{outfit.shoes}</dd></div><div><dt>เครื่องประดับ</dt><dd>{outfit.accessories.join(", ") || "ไม่จำเป็น"}</dd></div><div><dt>พาเลตต์</dt><dd>{outfit.colorPalette.join(" · ")}</dd></div></dl><p>{outfit.reason}</p><small>{outfit.comfortNote}</small><small>{outfit.sizeNote}</small><strong>{outfit.estimatedBudgetText}</strong></article>)}</div>
          <div className="editorial-note"><h3>เคล็ดลับเพิ่มเติม</h3><ul>{result.generalTips.map((tip) => <li key={tip}>{tip}</li>)}</ul><p><strong>คำแนะนำไซซ์เป็นเพียงการประมาณ กรุณาตรวจสอบตารางไซซ์ของร้านก่อนสั่งซื้อ</strong></p></div>
        </> : null}
      </section>
    </>
  );
}

function splitList(value: string) { return value.split(",").map((item) => item.trim()).filter(Boolean); }
function directionLabel(direction: string) { return direction === "safe" ? "ใส่ง่าย" : direction === "elevated" ? "แต่งขึ้น" : "สบาย"; }
