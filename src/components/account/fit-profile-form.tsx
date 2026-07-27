"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2, AlertCircle, Info, Loader2, Sparkles, ArrowRight } from "lucide-react";
import type { CustomerFitProfile, BodyShapeOption, SkinUndertoneOption, SkinDepthOption } from "@/lib/types";

interface Props {
  initialProfile: CustomerFitProfile | null;
}

export function FitProfileForm({ initialProfile }: Props) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState<number>(1);

  // Form states
  const [heightCm, setHeightCm] = useState(initialProfile?.height_cm?.toString() || "");
  const [weightKg, setWeightKg] = useState(initialProfile?.weight_kg?.toString() || "");
  const [chestCm, setChestCm] = useState(initialProfile?.chest_cm?.toString() || "");
  const [bustCm, setBustCm] = useState(initialProfile?.bust_cm?.toString() || "");
  const [waistCm, setWaistCm] = useState(initialProfile?.waist_cm?.toString() || "");
  const [hipsCm, setHipsCm] = useState(initialProfile?.hips_cm?.toString() || "");
  const [shoulderWidthCm, setShoulderWidthCm] = useState(initialProfile?.shoulder_width_cm?.toString() || "");
  const [inseamCm, setInseamCm] = useState(initialProfile?.inseam_cm?.toString() || "");
  const [sleeveLengthCm, setSleeveLengthCm] = useState(initialProfile?.sleeve_length_cm?.toString() || "");
  const [shoeLengthCm, setShoeLengthCm] = useState(initialProfile?.shoe_length_cm?.toString() || "");

  const [usualTopSize, setUsualTopSize] = useState(initialProfile?.usual_top_size || "");
  const [usualBottomSize, setUsualBottomSize] = useState(initialProfile?.usual_bottom_size || "");
  const [usualShoeSize, setUsualShoeSize] = useState(initialProfile?.usual_shoe_size || "");

  const [bodyShape, setBodyShape] = useState<BodyShapeOption>(initialProfile?.self_described_body_shape || "unsure");
  const [skinUndertone, setSkinUndertone] = useState<SkinUndertoneOption>(initialProfile?.skin_undertone || "unsure");
  const [skinDepth, setSkinDepth] = useState<SkinDepthOption>(initialProfile?.skin_depth || "prefer_not_to_say");
  const [colorContrast, setColorContrast] = useState(initialProfile?.color_contrast_preference || "");
  const [fitNotes, setFitNotes] = useState(initialProfile?.fit_notes || "");

  const [useForAiStyling, setUseForAiStyling] = useState(initialProfile?.use_for_ai_styling ?? false);
  const [useWardrobePersonalization, setUseWardrobePersonalization] = useState(initialProfile?.use_wardrobe_for_personalization ?? false);
  const [enablePersonalizedAds, setEnablePersonalizedAds] = useState(initialProfile?.enable_personalized_ads ?? true);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = {
      heightCm: heightCm ? Number(heightCm) : null,
      weightKg: weightKg ? Number(weightKg) : null,
      chestCm: chestCm ? Number(chestCm) : null,
      bustCm: bustCm ? Number(bustCm) : null,
      waistCm: waistCm ? Number(waistCm) : null,
      hipsCm: hipsCm ? Number(hipsCm) : null,
      shoulderWidthCm: shoulderWidthCm ? Number(shoulderWidthCm) : null,
      inseamCm: inseamCm ? Number(inseamCm) : null,
      sleeveLengthCm: sleeveLengthCm ? Number(sleeveLengthCm) : null,
      shoeLengthCm: shoeLengthCm ? Number(shoeLengthCm) : null,
      usualTopSize: usualTopSize.trim() || null,
      usualBottomSize: usualBottomSize.trim() || null,
      usualShoeSize: usualShoeSize.trim() || null,
      selfDescribedBodyShape: bodyShape,
      skinUndertone,
      skinDepth,
      colorContrastPreference: colorContrast.trim() || null,
      fitNotes: fitNotes.trim() || null,
      useForAiStyling,
      useWardrobeForPersonalization: useWardrobePersonalization,
      enablePersonalizedAds,
    };

    try {
      const res = await fetch("/api/account/fit-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "บันทึกโปรไฟล์ไม่สำเร็จ");
      }

      setSuccessMsg("บันทึกข้อมูลโปรไฟล์และความชอบเรียบร้อยแล้ว");
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลสัดส่วนและความชอบทั้งหมด? การดำเนินการนี้ไม่สามารถย้อนกลับได้")) {
      return;
    }

    setIsDeleting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/account/fit-profile", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "ลบข้อมูลไม่สำเร็จ");
      }

      setHeightCm("");
      setWeightKg("");
      setChestCm("");
      setBustCm("");
      setWaistCm("");
      setHipsCm("");
      setShoulderWidthCm("");
      setInseamCm("");
      setSleeveLengthCm("");
      setShoeLengthCm("");
      setUsualTopSize("");
      setUsualBottomSize("");
      setUsualShoeSize("");
      setBodyShape("unsure");
      setSkinUndertone("unsure");
      setSkinDepth("prefer_not_to_say");
      setColorContrast("");
      setFitNotes("");
      setUseForAiStyling(false);
      setUseWardrobePersonalization(false);

      setSuccessMsg("ลบข้อมูลสัดส่วนทั้งหมดเรียบร้อยแล้ว");
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Onboarding Step Tracker */}
      <div className="bg-paper border border-line p-4 sm:p-6">
        <div className="flex items-center justify-between border-b border-line pb-4 mb-4">
          <div className="flex items-center gap-2 text-xs font-mono text-charcoal font-semibold uppercase">
            <Sparkles className="w-4 h-4 text-olive" />
            <span>Guided Profile Onboarding (ขั้นตอนที่ {activeStep}/4)</span>
          </div>
          <button
            type="button"
            onClick={() => router.push("/account")}
            className="text-xs text-muted hover:text-charcoal underline"
          >
            ทำทีหลัง (Skip for now)
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { step: 1, title: "1. สัดส่วนและไซซ์" },
            { step: 2, title: "2. ทรงและสไตล์" },
            { step: 3, title: "3. โทนสีและผิว" },
            { step: 4, title: "4. ความเป็นส่วนตัว" },
          ].map((s) => (
            <button
              key={s.step}
              type="button"
              onClick={() => setActiveStep(s.step)}
              className={`py-2 px-1 text-[11px] sm:text-xs text-center border font-medium transition-colors ${
                activeStep === s.step
                  ? "bg-charcoal text-white border-charcoal"
                  : "bg-background text-muted border-line hover:border-charcoal"
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 border border-danger/30 bg-danger/10 text-danger text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 border border-success/30 bg-success/10 text-success text-xs font-medium flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Step 1: Optional Measurements & Usual Sizes */}
        {activeStep === 1 && (
          <div className="p-6 sm:p-8 bg-paper border border-line space-y-6">
            <div className="space-y-1 border-b border-line pb-4">
              <h2 className="font-serif text-2xl font-normal text-charcoal">สัดส่วนและขนาดเสื้อผ้า (ระบุตามความสมัครใจ)</h2>
              <p className="text-xs text-muted">
                กรอกเฉพาะช่องที่ต้องการ ข้อมูลสัดส่วนเป็นเซนติเมตรช่วยให้ AI คำนวณความกระชับของชุดได้ดียิ่งขึ้น
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">ส่วนสูง (ซม.)</label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  placeholder="เช่น 170"
                  className="w-full p-3 border border-line bg-background text-sm text-charcoal outline-none focus:border-charcoal"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">น้ำหนัก (กก.)</label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="เช่น 62"
                  className="w-full p-3 border border-line bg-background text-sm text-charcoal outline-none focus:border-charcoal"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">ความกว้างไหล่ (ซม.)</label>
                <input
                  type="number"
                  value={shoulderWidthCm}
                  onChange={(e) => setShoulderWidthCm(e.target.value)}
                  placeholder="เช่น 42"
                  className="w-full p-3 border border-line bg-background text-sm text-charcoal outline-none focus:border-charcoal"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">รอบอก (ซม.)</label>
                <input
                  type="number"
                  value={chestCm || bustCm}
                  onChange={(e) => {
                    setChestCm(e.target.value);
                    setBustCm(e.target.value);
                  }}
                  placeholder="เช่น 92"
                  className="w-full p-3 border border-line bg-background text-sm text-charcoal outline-none focus:border-charcoal"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">รอบเอว (ซม.)</label>
                <input
                  type="number"
                  value={waistCm}
                  onChange={(e) => setWaistCm(e.target.value)}
                  placeholder="<ctrl42>เช่น 76"
                  className="w-full p-3 border border-line bg-background text-sm text-charcoal outline-none focus:border-charcoal"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">รอบสะโพก (ซม.)</label>
                <input
                  type="number"
                  value={hipsCm}
                  onChange={(e) => setHipsCm(e.target.value)}
                  placeholder="เช่น 96"
                  className="w-full p-3 border border-line bg-background text-sm text-charcoal outline-none focus:border-charcoal"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">ความยาวช่วงขา (Inseam ซม.)</label>
                <input
                  type="number"
                  value={inseamCm}
                  onChange={(e) => setInseamCm(e.target.value)}
                  placeholder="เช่น 75"
                  className="w-full p-3 border border-line bg-background text-sm text-charcoal outline-none focus:border-charcoal"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">ความยาวแขน (ซม.)</label>
                <input
                  type="number"
                  value={sleeveLengthCm}
                  onChange={(e) => setSleeveLengthCm(e.target.value)}
                  placeholder="เช่น 60"
                  className="w-full p-3 border border-line bg-background text-sm text-charcoal outline-none focus:border-charcoal"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">ความยาวเท้า (ซม.)</label>
                <input
                  type="number"
                  value={shoeLengthCm}
                  onChange={(e) => setShoeLengthCm(e.target.value)}
                  placeholder="เช่น 26.5"
                  className="w-full p-3 border border-line bg-background text-sm text-charcoal outline-none focus:border-charcoal"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-line grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">ไซซ์เสื้อที่ใส่ปกติ</label>
                <input
                  type="text"
                  value={usualTopSize}
                  onChange={(e) => setUsualTopSize(e.target.value)}
                  placeholder="เช่น M, 40, EU 38"
                  className="w-full p-3 border border-line bg-background text-sm text-charcoal outline-none focus:border-charcoal"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">ไซซ์กางเกงที่ใส่ปกติ</label>
                <input
                  type="text"
                  value={usualBottomSize}
                  onChange={(e) => setUsualBottomSize(e.target.value)}
                  placeholder="เช่น 31, L, W30/L32"
                  className="w-full p-3 border border-line bg-background text-sm text-charcoal outline-none focus:border-charcoal"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">ไซซ์รองเท้าที่ใส่ปกติ</label>
                <input
                  type="text"
                  value={usualShoeSize}
                  onChange={(e) => setUsualShoeSize(e.target.value)}
                  placeholder="เช่น EU 42, US 9.5"
                  className="w-full p-3 border border-line bg-background text-sm text-charcoal outline-none focus:border-charcoal"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="px-6 py-3 bg-charcoal text-white text-xs font-medium inline-flex items-center gap-1.5"
              >
                <span>ถัดไป: ทรงและสไตล์</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Body Shape & Fit Preferences */}
        {activeStep === 2 && (
          <div className="p-6 sm:p-8 bg-paper border border-line space-y-6">
            <div className="space-y-1 border-b border-line pb-4">
              <h2 className="font-serif text-2xl font-normal text-charcoal">ทรงและสไตล์การแต่งตัว</h2>
              <p className="text-xs text-muted">
                เลือกคำอธิบายทรงที่ตรงกับสไตล์ที่คุณชอบ การเลือกนี้เป็นเพียงแนวทางประมาณการณ์ความสมส่วนของชุด
              </p>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-medium text-charcoal">รูปทรงสัดส่วนที่อธิบายตัวเอง</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { value: "straight", label: "ทรงตรง (Straight)" },
                  { value: "triangle", label: "สามเหลี่ยม (Triangle)" },
                  { value: "inverted_triangle", label: "สามเหลี่ยมคว่ำ (Inverted)" },
                  { value: "oval", label: "ทรงกลม/รี (Oval)" },
                  { value: "hourglass", label: "นาฬิกาทราย (Hourglass)" },
                  { value: "unsure", label: "ไม่แน่ใจ" },
                  { value: "prefer_not_to_say", label: "ไม่ระบุ" },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setBodyShape(item.value as BodyShapeOption)}
                    className={`p-3 text-xs font-medium border text-center transition-colors ${
                      bodyShape === item.value
                        ? "bg-charcoal text-white border-charcoal"
                        : "bg-background text-charcoal border-line hover:border-charcoal"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-line">
              <label className="block text-xs font-medium text-charcoal">โน้ตเฉพาะตัวเรื่องทรงเสื้อผ้า</label>
              <textarea
                rows={3}
                value={fitNotes}
                onChange={(e) => setFitNotes(e.target.value)}
                placeholder="เช่น ชอบเสื้อเชิ้ตไหล่ตกเล็กน้อย, ไม่ชอบกางเกงที่รัดต้นขา"
                className="w-full p-4 border border-line bg-background text-sm text-charcoal outline-none focus:border-charcoal"
              />
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="px-6 py-3 border border-line text-charcoal text-xs font-medium hover:bg-background"
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(3)}
                className="px-6 py-3 bg-charcoal text-white text-xs font-medium inline-flex items-center gap-1.5"
              >
                <span>ถัดไป: โทนสีและผิว</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Skin Undertone & Color Guidance */}
        {activeStep === 3 && (
          <div className="p-6 sm:p-8 bg-paper border border-line space-y-6">
            <div className="space-y-1 border-b border-line pb-4">
              <h2 className="font-serif text-2xl font-normal text-charcoal">โทนสีและอันเดอร์โทนผิว (คำแนะนำคู่สี)</h2>
              <p className="text-xs text-muted">
                ช่วยให้ AI แมตช์พาเลตต์สีเสื้อผ้าที่ขับผิวและสร้างความกลมกลืนกับโทนสีธรรมชาติของคุณ
              </p>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-medium text-charcoal">อันเดอร์โทนผิว (Skin Undertone)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { value: "warm", label: "Warm Tone (อุ่น/ทอง/เหลือง)" },
                  { value: "cool", label: "Cool Tone (เย็น/ชมพู/อมฟ้า)" },
                  { value: "neutral", label: "Neutral Tone (เป็นกลาง)" },
                  { value: "olive", label: "Olive Tone (อมเขียวมะกอก)" },
                  { value: "unsure", label: "ไม่แน่ใจ" },
                  { value: "prefer_not_to_say", label: "ไม่ระบุ" },
                ].map((u) => (
                  <button
                    key={u.value}
                    type="button"
                    onClick={() => setSkinUndertone(u.value as SkinUndertoneOption)}
                    className={`p-3 text-xs font-medium border text-center transition-colors ${
                      skinUndertone === u.value
                        ? "bg-charcoal text-white border-charcoal"
                        : "bg-background text-charcoal border-line hover:border-charcoal"
                    }`}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-line">
              <label className="block text-xs font-medium text-charcoal">ความชอบเกี่ยวกับความจัดจ้าน/ความต่างของสี</label>
              <input
                type="text"
                value={colorContrast}
                onChange={(e) => setColorContrast(e.target.value)}
                placeholder="เช่น ชอบสีคอนทราสต์ตัดกันชัดเจน, ชอบคุมโทนพาสเทลนุ่มนวล"
                className="w-full p-4 border border-line bg-background text-sm text-charcoal outline-none focus:border-charcoal"
              />
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setActiveStep(2)}
                className="px-6 py-4 border border-line text-charcoal text-xs font-medium hover:bg-background"
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                onClick={() => setActiveStep(4)}
                className="px-6 py-4 bg-charcoal text-white text-xs font-medium inline-flex items-center gap-1.5"
              >
                <span>ถัดไป: ความเป็นส่วนตัว</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Privacy, Consent Review & Save */}
        {activeStep === 4 && (
          <div className="p-6 sm:p-8 bg-paper border border-line space-y-6">
            <div className="space-y-1 border-b border-line pb-4">
              <h2 className="font-serif text-2xl font-normal text-charcoal">การยินยอมและสิทธิ์ความเป็นส่วนตัว</h2>
              <p className="text-xs text-muted">
                เราเคารพความเป็นส่วนตัวของคุณ ข้อมูลสัดส่วนทั้งหมดจะไม่ถูกนำไปใช้โฆษณาหรือแชร์กับร้านค้า
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <label className="flex items-start gap-3 p-4 border border-line bg-background cursor-pointer">
                <input
                  type="checkbox"
                  checked={useForAiStyling}
                  onChange={(e) => setUseForAiStyling(e.target.checked)}
                  className="mt-0.5 accent-charcoal cursor-pointer"
                />
                <div>
                  <strong className="block text-sm text-charcoal">ยินยอมให้ส่งสัดส่วนเฉพาะตัวให้ AI Stylist จัดชุด</strong>
                  <span className="text-muted block mt-0.5">
                    หากไม่ติ๊ก ข้อมูลสัดส่วนและขนาดเสื้อผ้าจะไม่ถูกส่งไปประมวลผลกับ OpenAI ในการแนะนำชุด
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border border-line bg-background cursor-pointer">
                <input
                  type="checkbox"
                  checked={useWardrobePersonalization}
                  onChange={(e) => setUseWardrobePersonalization(e.target.checked)}
                  className="mt-0.5 accent-charcoal cursor-pointer"
                />
                <div>
                  <strong className="block text-sm text-charcoal">ยินยอมใช้ประเภทสไตล์ในตู้เสื้อผ้าเพื่อปรับปรุงคำแนะนำโฆษณา</strong>
                  <span className="text-muted block mt-0.5">
                    นำเฉพาะสไตล์และโทนสีของตู้เสื้อผ้ามาปรับความเกี่ยวข้องของโฆษณา (ข้อมูลรูปถ่ายและสัดส่วนจะไม่ถูกใช้)
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 border border-line bg-background cursor-pointer">
                <input
                  type="checkbox"
                  checked={enablePersonalizedAds}
                  onChange={(e) => setEnablePersonalizedAds(e.target.checked)}
                  className="mt-0.5 accent-charcoal cursor-pointer"
                />
                <div>
                  <strong className="block text-sm text-charcoal">เปิดใช้งานโฆษณาแนะนำตามสไตล์ที่สนใจ (Personalized Ads)</strong>
                  <span className="text-muted block mt-0.5">
                    หากปิด ระบบจะแสดงเฉพาะโฆษณาล่าสุดทั่วไปโดยไม่จัดอันดับความเกี่ยวข้อง
                  </span>
                </div>
              </label>
            </div>

            {/* Size Disclaimer Banner */}
            <div className="p-4 border border-olive/30 bg-olive-pale/30 text-xs space-y-1">
              <strong className="font-medium text-charcoal flex items-center gap-1.5">
                <Info className="w-4 h-4 text-olive" />
                <span>ข้อแนะนำเรื่องตารางไซซ์</span>
              </strong>
              <p className="text-muted">
                ไซซ์ที่ AI แนะนำเป็นเพียงการประเมินเบื้องต้นเชิงสไตล์เท่านั้น กรุณาตรวจสอบตารางไซซ์จริงของแต่ละร้านก่อนสั่งซื้อ
              </p>
            </div>

            <div className="pt-4 border-t border-line flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleDeleteAll}
                disabled={isDeleting}
                className="px-4 py-3 border border-danger/30 text-danger text-xs font-medium hover:bg-danger/10 inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? "กำลังลบ..." : "ลบข้อมูลสัดส่วนทั้งหมด"}</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="px-6 py-4 border border-line text-charcoal text-xs font-medium hover:bg-background"
                >
                  ย้อนกลับ
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-4 bg-charcoal text-white hover:bg-black text-xs font-medium transition-colors inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>บันทึกโปรไฟล์และความชอบ</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
