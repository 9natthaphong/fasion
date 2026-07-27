"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Check, AlertCircle, Loader2, RotateCcw } from "lucide-react";
import type { CustomerFitProfile } from "@/lib/types";

interface Props {
  initialProfile: CustomerFitProfile | null;
}

export function PrivacySettingsForm({ initialProfile }: Props) {
  const router = useRouter();

  const [enablePersonalizedAds, setEnablePersonalizedAds] = useState(initialProfile?.enable_personalized_ads ?? true);
  const [useWardrobePersonalization, setUseWardrobePersonalization] = useState(initialProfile?.use_wardrobe_for_personalization ?? false);
  const [useForAiStyling, setUseForAiStyling] = useState(initialProfile?.use_for_ai_styling ?? false);

  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/account/fit-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...initialProfile,
          useForAiStyling,
          useWardrobeForPersonalization: useWardrobePersonalization,
          enablePersonalizedAds,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "บันทึกการตั้งค่าไม่สำเร็จ");

      setMsg("บันทึกการตั้งค่าความเป็นส่วนตัวเรียบร้อยแล้ว");
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSignals = async () => {
    setIsResetting(true);
    setMsg(null);
    setErrorMsg(null);

    try {
      // Toggle off and save
      setEnablePersonalizedAds(false);
      setUseWardrobePersonalization(false);

      const res = await fetch("/api/account/fit-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...initialProfile,
          useWardrobeForPersonalization: false,
          enablePersonalizedAds: false,
        }),
      });

      if (!res.ok) throw new Error("ล้างค่าสัญญาณไม่สำเร็จ");

      setMsg("ล้างค่าสัญญาณความสนใจ (Personalization Signals) เรียบร้อยแล้ว");
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {msg && (
        <div className="p-4 border border-success/30 bg-success/10 text-success text-xs font-medium flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 border border-danger/30 bg-danger/10 text-danger text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="p-6 bg-paper border border-line space-y-4">
        <h2 className="font-serif text-xl font-normal text-charcoal flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-olive" />
          <span>การตั้งค่าโฆษณาแนะนำและการประมวลผลข้อมูล</span>
        </h2>

        <div className="space-y-4 text-xs">
          <label className="flex items-start gap-3 p-4 border border-line bg-background cursor-pointer">
            <input
              type="checkbox"
              checked={enablePersonalizedAds}
              onChange={(e) => setEnablePersonalizedAds(e.target.checked)}
              className="mt-0.5 accent-charcoal cursor-pointer"
            />
            <div>
              <strong className="block text-sm text-charcoal">เปิดใช้งานโฆษณาแนะนำตามสไตล์ที่ชอบ (Personalized Ads)</strong>
              <span className="text-muted block mt-0.5">
                หากปิด ระบบจะแสดงโฆษณาล่าสุดตามลำดับปกติโดยไม่วิเคราะห์ความสนใจ
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
              <strong className="block text-sm text-charcoal">ยินยอมใช้ประเภทสไตล์ในตู้เสื้อผ้าในการปรับความเกี่ยวข้องโฆษณา</strong>
              <span className="text-muted block mt-0.5">
                ใช้เฉพาะประเภทและโทนสีของเสื้อผ้าในตู้ส่วนตัว ข้อมูลรูปภาพและสัดส่วนจะไม่ถูกนำมาใช้
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 border border-line bg-background cursor-pointer">
            <input
              type="checkbox"
              checked={useForAiStyling}
              onChange={(e) => setUseForAiStyling(e.target.checked)}
              className="mt-0.5 accent-charcoal cursor-pointer"
            />
            <div>
              <strong className="block text-sm text-charcoal">ยินยอมให้ AI Stylist นำสัดส่วนส่วนตัวไปปรับแต่งชุด</strong>
              <span className="text-muted block mt-0.5">
                ส่งสัดส่วนและไซซ์เสื้อผ้าให้ OpenAI ช่วยประเมินทรงและความกระชับของชุด
              </span>
            </div>
          </label>
        </div>

        <div className="pt-4 border-t border-line flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleResetSignals}
            disabled={isResetting}
            className="px-4 py-2 border border-line text-xs text-muted hover:text-charcoal hover:bg-background inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isResetting ? "กำลังล้างค่า..." : "ล้างค่าสัญญาณความสนใจ (Reset Signals)"}</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-charcoal text-white hover:bg-black text-xs font-medium inline-flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>กำลังบันทึก...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>บันทึกการตั้งค่า</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
