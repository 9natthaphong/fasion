"use client";

import { useState } from "react";
import { Check, ShieldCheck, User, Sliders, Heart } from "lucide-react";

interface ProfileFormProps {
  initial: {
    displayName: string;
    heightCm: number | null;
    weightKg: number | null;
    clothingPresentation: string;
    preferredFit: string;
    defaultBudget: number | null;
    preferredStyles: string[];
    preferredColors: string[];
    avoidedColors: string[];
    saveBodyInformation: boolean;
  };
}

export function ProfileForm({ initial }: ProfileFormProps) {
  const [state, setState] = useState(initial);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);
    const response = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(state),
    });
    const data = (await response.json()) as { error?: string; message?: string };
    setPending(false);
    if (!response.ok) setError(data.error ?? "บันทึกข้อมูลไม่สำเร็จ");
    else setMessage(data.message ?? "บันทึกโปรไฟล์สไตล์เรียบร้อยแล้ว");
  };

  const csv = (values: string[]) => values.join(", ");
  const parseCsv = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 12);

  // Non-judgmental profile completion calculation
  const hasBasic = Boolean(state.displayName);
  const hasStyle = state.preferredStyles.length > 0 || state.preferredColors.length > 0;

  return (
    <form className="space-y-8 max-w-3xl" onSubmit={save}>
      
      {/* Profile Health / Respectful Completion Bar */}
      <div className="p-6 bg-paper border border-line space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-olive" />
            <h3 className="font-serif text-lg font-normal text-charcoal">สถานะโปรไฟล์สไตล์ส่วนตัว</h3>
          </div>
          <span className="text-xs font-mono text-muted">
            {hasBasic && hasStyle ? "พร้อมใช้งานสมบูรณ์" : "สามารถสร้างไอเดียชุดได้ทันที"}
          </span>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          ข้อมูลสไตล์ช่วยให้ AI Stylist คัดสรรทางเลือกที่ตรงใจคุณมากขึ้น ข้อมูลสัดส่วนเป็นเพียงตัวเลือกเสริมและ **ไม่บังคับ**
        </p>
      </div>

      {/* Section 1: ข้อมูลสไตล์ส่วนตัว (หลัก) */}
      <div className="p-6 sm:p-8 bg-paper border border-line space-y-6">
        <div className="flex items-center gap-2 border-b border-line pb-3">
          <User className="w-4 h-4 text-olive" />
          <h2 className="font-serif text-xl text-charcoal">ข้อมูลโปรไฟล์หลัก</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-muted uppercase mb-1">ชื่อที่ใช้แสดง *</label>
            <input
              value={state.displayName}
              onChange={(event) => setState({ ...state, displayName: event.target.value })}
              required
              minLength={2}
              maxLength={100}
              placeholder="เช่น Alex M."
              className="w-full px-4 py-3 border border-line bg-background text-sm text-charcoal focus:border-charcoal outline-none"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-muted uppercase mb-1">หมวดเสื้อผ้าหลัก</label>
              <select
                value={state.clothingPresentation}
                onChange={(event) => setState({ ...state, clothingPresentation: event.target.value })}
                className="w-full px-4 py-3 border border-line bg-background text-sm text-charcoal focus:border-charcoal outline-none"
              >
                <option value="unspecified">ไม่ระบุ / ผสมผสาน</option>
                <option value="menswear">เสื้อผ้าผู้ชาย (Menswear)</option>
                <option value="womenswear">เสื้อผ้าผู้หญิง (Womenswear)</option>
                <option value="unisex">Unisex / ทุกสไตล์</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-muted uppercase mb-1">ทรงเสื้อผ้าที่ชอบ</label>
              <select
                value={state.preferredFit}
                onChange={(event) => setState({ ...state, preferredFit: event.target.value })}
                className="w-full px-4 py-3 border border-line bg-background text-sm text-charcoal focus:border-charcoal outline-none"
              >
                <option value="unspecified">ไม่ระบุ</option>
                <option value="fitted">เข้ารูปพอดีตัว (Fitted)</option>
                <option value="relaxed">ทรงหลวมสบาย (Relaxed / Oversized)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: ความชอบด้านสไตล์และโทนสี */}
      <div className="p-6 sm:p-8 bg-paper border border-line space-y-6">
        <div className="flex items-center gap-2 border-b border-line pb-3">
          <Sliders className="w-4 h-4 text-olive" />
          <h2 className="font-serif text-xl text-charcoal">สไตล์และโทนสีโปรด</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-muted uppercase mb-1">สไตล์ที่ชื่นชอบ (คั่นด้วยจุลภาค)</label>
            <input
              value={csv(state.preferredStyles)}
              onChange={(event) => setState({ ...state, preferredStyles: parseCsv(event.target.value) })}
              placeholder="เช่น Minimal, Workwear, Relaxed, Contemporary"
              className="w-full px-4 py-3 border border-line bg-background text-sm text-charcoal focus:border-charcoal outline-none"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-muted uppercase mb-1">โทนสีที่ชอบ</label>
              <input
                value={csv(state.preferredColors)}
                onChange={(event) => setState({ ...state, preferredColors: parseCsv(event.target.value) })}
                placeholder="เช่น ขาว, ครีม, เขียวมะกอก, กรมท่า"
                className="w-full px-4 py-3 border border-line bg-background text-sm text-charcoal focus:border-charcoal outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-muted uppercase mb-1">สีที่ไม่ต้องการใส่</label>
              <input
                value={csv(state.avoidedColors)}
                onChange={(event) => setState({ ...state, avoidedColors: parseCsv(event.target.value) })}
                placeholder="เช่น นีออน, ส้มสด"
                className="w-full px-4 py-3 border border-line bg-background text-sm text-charcoal focus:border-charcoal outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: ข้อมูลสัดส่วนส่วนบุคคล (Optional with explicit consent) */}
      <div className="p-6 sm:p-8 bg-paper border border-line space-y-6">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-olive" />
            <h2 className="font-serif text-xl text-charcoal">ข้อมูลสัดส่วนส่วนตัว (ทางเลือกเสริม)</h2>
          </div>
          <span className="text-xs text-muted font-mono">การยินยอมบันทึก</span>
        </div>

        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer p-4 border border-line bg-background">
            <input
              type="checkbox"
              checked={state.saveBodyInformation}
              onChange={(event) =>
                setState({
                  ...state,
                  saveBodyInformation: event.target.checked,
                  heightCm: event.target.checked ? state.heightCm : null,
                  weightKg: event.target.checked ? state.weightKg : null,
                })
              }
              className="w-4 h-4 mt-0.5 accent-charcoal cursor-pointer"
            />
            <div className="text-xs text-charcoal space-y-1">
              <strong className="block font-medium">บันทึกส่วนสูงและน้ำหนักเพื่อใช้เป็นค่าเริ่มต้นใน AI Stylist</strong>
              <p className="text-muted">
                ข้อมูลนี้จะไม่ถูกแชร์ให้นักโฆษณา และนำมาใช้เฉพาะการปรับคำแนะนำสัดส่วนของคุณเท่านั้น
              </p>
            </div>
          </label>

          {state.saveBodyInformation && (
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-mono text-muted uppercase mb-1">ส่วนสูง (ซม.)</label>
                <input
                  type="number"
                  min={80}
                  max={260}
                  value={state.heightCm ?? ""}
                  onChange={(event) =>
                    setState({
                      ...state,
                      heightCm: event.target.value ? Number(event.target.value) : null,
                    })
                  }
                  placeholder="เช่น 172"
                  className="w-full px-4 py-3 border border-line bg-background text-sm text-charcoal focus:border-charcoal outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-muted uppercase mb-1">น้ำหนัก (กก.)</label>
                <input
                  type="number"
                  min={20}
                  max={350}
                  value={state.weightKg ?? ""}
                  onChange={(event) =>
                    setState({
                      ...state,
                      weightKg: event.target.value ? Number(event.target.value) : null,
                    })
                  }
                  placeholder="เช่น 64"
                  className="w-full px-4 py-3 border border-line bg-background text-sm text-charcoal focus:border-charcoal outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 border border-danger/30 bg-danger/10 text-danger text-xs font-medium">
          {error}
        </div>
      )}

      {message && (
        <div className="p-4 border border-olive/30 bg-olive-pale/40 text-olive-dark text-xs font-medium flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="px-8 py-4 bg-charcoal text-background hover:bg-olive font-semibold text-xs rounded-none transition-colors disabled:opacity-50 inline-flex items-center gap-2"
        >
          {pending ? "กำลังบันทึก…" : "บันทึกการเปลี่ยนแปลงโปรไฟล์"}
        </button>
      </div>
    </form>
  );
}
