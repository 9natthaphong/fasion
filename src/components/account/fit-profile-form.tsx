"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2, AlertCircle, Loader2, Sparkles, ArrowRight, UserCheck, Heart, Sliders, ShieldCheck } from "lucide-react";
import type { CustomerFitProfile, BodyShapeOption, SkinUndertoneOption, SkinDepthOption } from "@/lib/types";

interface Props {
  initialDisplayName: string;
  initialPreferences: {
    clothingPresentation?: string;
    preferredStyles?: string[];
    preferredColors?: string[];
    avoidedColors?: string[];
    preferredFit?: string;
    defaultBudget?: number | null;
  } | null;
  initialProfile: CustomerFitProfile | null;
}

export function FitProfileForm({ initialDisplayName, initialPreferences, initialProfile }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"general" | "styles" | "measurements" | "privacy">("general");

  // General Profile state
  const [displayName, setDisplayName] = useState(initialDisplayName || "");

  // Preferences state
  const [clothingPresentation, setClothingPresentation] = useState(initialPreferences?.clothingPresentation || "unspecified");
  const [preferredStylesText, setPreferredStylesText] = useState((initialPreferences?.preferredStyles || []).join(", "));
  const [preferredColorsText, setPreferredColorsText] = useState((initialPreferences?.preferredColors || []).join(", "));
  const [avoidedColorsText, setAvoidedColorsText] = useState((initialPreferences?.avoidedColors || []).join(", "));
  const [preferredFit, setPreferredFit] = useState(initialPreferences?.preferredFit || "unspecified");
  const [defaultBudget, setDefaultBudget] = useState(initialPreferences?.defaultBudget?.toString() || "");

  // Fit Profile Measurements state
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
  const [enablePersonalizedAds, setEnablePersonalizedAds] = useState(initialProfile?.enable_personalized_ads ?? false);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const parseList = (str: string) =>
      str
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    try {
      // 1. Save Display Name & Customer Preferences via /api/account/profile
      const prefPayload = {
        displayName: displayName.trim() || "ผู้ใช้งาน",
        heightCm: heightCm ? Number(heightCm) : null,
        weightKg: weightKg ? Number(weightKg) : null,
        clothingPresentation,
        preferredStyles: parseList(preferredStylesText),
        preferredColors: parseList(preferredColorsText),
        avoidedColors: parseList(avoidedColorsText),
        preferredFit,
        defaultBudget: defaultBudget ? Number(defaultBudget) : null,
        saveBodyInformation: true,
      };

      const resPref = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefPayload),
      });

      if (!resPref.ok) {
        const d = await resPref.json();
        throw new Error(d.error || "บันทึกโปรไฟล์ทั่วไปไม่สำเร็จ");
      }

      // 2. Save Canonical Fit Profile via /api/account/fit-profile
      const fitPayload = {
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

      const resFit = await fetch("/api/account/fit-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fitPayload),
      });

      if (!resFit.ok) {
        const d = await resFit.json();
        throw new Error(d.error || "บันทึกข้อมูลสัดส่วนไม่สำเร็จ");
      }

      setSuccessMsg("บันทึกข้อมูลโปรไฟล์ สไตล์ และสัดส่วนทั้งหมดเรียบร้อยแล้ว");
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
      {/* 4 Section Tabs */}
      <div className="bg-paper border border-line p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2 text-xs font-mono text-charcoal font-semibold uppercase">
            <Sparkles className="w-4 h-4 text-olive" />
            <span>Customer Profile Settings</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { key: "general", title: "1. โปรไฟล์ทั่วไป", icon: UserCheck },
            { key: "styles", title: "2. สไตล์และสีที่ชอบ", icon: Heart },
            { key: "measurements", title: "3. สัดส่วนและไซซ์", icon: Sliders },
            { key: "privacy", title: "4. การอนุญาตใช้ข้อมูล", icon: ShieldCheck },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setActiveTab(s.key as "general" | "styles" | "measurements" | "privacy")}
                className={`py-3 px-2 text-xs font-medium border text-center transition-colors flex items-center justify-center gap-1.5 ${
                  activeTab === s.key
                    ? "bg-charcoal text-white border-charcoal"
                    : "bg-background text-charcoal border-line hover:border-charcoal"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{s.title}</span>
              </button>
            );
          })}
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

      <form onSubmit={handleSaveAll} className="space-y-8">
        {/* Tab 1: General Profile */}
        {activeTab === "general" && (
          <div className="p-6 sm:p-8 bg-paper border border-line space-y-6">
            <div className="space-y-1 border-b border-line pb-4">
              <h2 className="font-serif text-2xl font-normal text-charcoal">โปรไฟล์ทั่วไป (General Identity)</h2>
              <p className="text-xs text-muted">แก้ไขชื่อที่ต้องการให้แสดงในระบบ</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-charcoal mb-1">ชื่อที่แสดง (Display Name) *</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="เช่น ณัฐพงษ์"
                className="w-full p-3 border border-line bg-background text-sm text-charcoal outline-none focus:border-charcoal"
                required
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setActiveTab("styles")}
                className="px-6 py-3 bg-charcoal text-white text-xs font-medium inline-flex items-center gap-1.5"
              >
                <span>ถัดไป: สไตล์และสีที่ชอบ</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Style & Preferences */}
        {activeTab === "styles" && (
          <div className="p-6 sm:p-8 bg-paper border border-line space-y-6">
            <div className="space-y-1 border-b border-line pb-4">
              <h2 className="font-serif text-2xl font-normal text-charcoal">สไตล์และสีที่ชอบ (Style Preferences)</h2>
              <p className="text-xs text-muted">กำหนดสไตล์ โทนสีโปรด สีที่หลีกเลี่ยง และงบประมาณตั้งต้น</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">การแต่งกายหลัก (Presentation)</label>
                <select
                  value={clothingPresentation}
                  onChange={(e) => setClothingPresentation(e.target.value)}
                  className="w-full p-3 border border-line bg-background text-sm text-charcoal outline-none focus:border-charcoal"
                >
                  <option value="unspecified">ไม่ระบุ</option>
                  <option value="menswear">Menswear (ชาย)</option>
                  <option value="womenswear">Womenswear (หญิง)</option>
                  <option value="unisex">Unisex (เป็นกลาง)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">ความกระชับของชุดที่ชอบ (Preferred Fit)</label>
                <select
                  value={preferredFit}
                  onChange={(e) => setPreferredFit(e.target.value)}
                  className="w-full p-3 border border-line bg-background text-sm text-charcoal outline-none focus:border-charcoal"
                >
                  <option value="unspecified">ไม่ระบุ</option>
                  <option value="fitted">เข้ารูป (Fitted)</option>
                  <option value="relaxed">หลวมสบาย (Relaxed / Oversized)</option>
                </select>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">สไตล์ที่ชอบ (คั่นด้วยเครื่องหมายจุลภาค)</label>
                <input
                  type="text"
                  value={preferredStylesText}
                  onChange={(e) => setPreferredStylesText(e.target.value)}
                  placeholder="เช่น Minimal, Smart Casual, Streetwear, Vintage"
                  className="w-full p-3 border border-line bg-background text-sm text-charcoal outline-none focus:border-charcoal"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">โทนสีที่ชอบ (คั่นด้วยเครื่องหมายจุลภาค)</label>
                <input
                  type="text"
                  value={preferredColorsText}
                  onChange={(e) => setPreferredColorsText(e.target.value)}
                  placeholder="เช่น ครีม, เขียวมะกอก, กรมท่า, ดำ, ขาว"
                  className="w-full p-3 border border-line bg-background text-sm text-charcoal outline-none focus:border-charcoal"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">สีที่ต้องการหลีกเลี่ยง (คั่นด้วยเครื่องหมายจุลภาค)</label>
                <input
                  type="text"
                  value={avoidedColorsText}
                  onChange={(e) => setAvoidedColorsText(e.target.value)}
                  placeholder="เช่น สีนีออน, สีส้มสด"
                  className="w-full p-3 border border-line bg-background text-sm text-charcoal outline-none focus:border-charcoal"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">งบประมาณตั้งต้นต่อชุด (บาท)</label>
                <input
                  type="number"
                  value={defaultBudget}
                  onChange={(e) => setDefaultBudget(e.target.value)}
                  placeholder="เช่น 2500"
                  className="w-full p-3 border border-line bg-background text-sm text-charcoal outline-none focus:border-charcoal"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setActiveTab("general")}
                className="px-6 py-3 border border-line text-charcoal text-xs font-medium hover:bg-background"
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("measurements")}
                className="px-6 py-3 bg-charcoal text-white text-xs font-medium inline-flex items-center gap-1.5"
              >
                <span>ถัดไป: สัดส่วนและไซซ์</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Measurements & Sizes (Canonical customer_fit_profiles) */}
        {activeTab === "measurements" && (
          <div className="p-6 sm:p-8 bg-paper border border-line space-y-6">
            <div className="space-y-1 border-b border-line pb-4">
              <h2 className="font-serif text-2xl font-normal text-charcoal">สัดส่วนและไซซ์ส่วนตัว (ระบุตามความสมัครใจ)</h2>
              <p className="text-xs text-muted">
                ข้อมูลสัดส่วนเป็นเซนติเมตรเป็นข้อมูลส่วนตัว Canonical ที่ช่วยให้ AI ประเมินทรงได้อย่างแม่นยำ
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
                  placeholder="เช่น 76"
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

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setActiveTab("styles")}
                className="px-6 py-3 border border-line text-charcoal text-xs font-medium hover:bg-background"
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("privacy")}
                className="px-6 py-3 bg-charcoal text-white text-xs font-medium inline-flex items-center gap-1.5"
              >
                <span>ถัดไป: การอนุญาตใช้ข้อมูล</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Privacy & Save All */}
        {activeTab === "privacy" && (
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
                  onClick={() => setActiveTab("measurements")}
                  className="px-6 py-3 border border-line text-charcoal text-xs font-medium hover:bg-background"
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
                      <span>บันทึกข้อมูลทั้งหมด</span>
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
