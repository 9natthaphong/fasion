"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, Upload, Sparkles, Check, AlertCircle, Loader2, ArrowLeft, Info, ChevronDown, ChevronUp, Layers } from "lucide-react";
import type { WardrobeAnalysisOutput, WardrobeItemType, WardrobePreferredFit, WardrobeFormality } from "@/lib/types";

const categoryChips: { type: WardrobeItemType; label: string }[] = [
  { type: "top", label: "เสื้อ (Top)" },
  { type: "bottom", label: "กางเกง (Bottom)" },
  { type: "skirt", label: "กระโปรง (Skirt)" },
  { type: "dress", label: "ชุดเดรส (Dress)" },
  { type: "outerwear", label: "เสื้อคลุม / แจ็กเก็ต (Outerwear)" },
  { type: "shoes", label: "รองเท้า (Shoes)" },
  { type: "bag", label: "กระเป๋า (Bag)" },
  { type: "accessory", label: "เครื่องประดับ / หมวก (Accessory)" },
];

const fitChips: { fit: WardrobePreferredFit; label: string }[] = [
  { fit: "fitted", label: "เข้ารูป (Fitted)" },
  { fit: "regular", label: "ทรงปกติ (Regular)" },
  { fit: "relaxed", label: "หลวมสบาย (Relaxed)" },
  { fit: "oversized", label: "โอเวอร์ไซซ์ (Oversized)" },
];

export function AddItemForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  // Editable Form Fields
  const [name, setName] = useState("");
  const [itemType, setItemType] = useState<WardrobeItemType>("top");
  const [subcategory, setSubcategory] = useState("");
  const [primaryColorsText, setPrimaryColorsText] = useState("ขาว");
  const [stylesText, setStylesText] = useState("เรียบง่าย");
  const [material, setMaterial] = useState("");
  const [preferredFit, setPreferredFit] = useState<WardrobePreferredFit>("regular");
  const [formality, setFormality] = useState<WardrobeFormality>("casual");
  const [weatherSuitability, setWeatherSuitability] = useState<string[]>(["warm", "indoor"]);
  const [aiDescription, setAiDescription] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setAiNotice(null);

    const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowed.has(file.type)) {
      setErrorMsg("กรุณาเลือกไฟล์ภาพประเภท JPEG, PNG หรือ WebP เท่านั้น");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("ขนาดไฟล์ต้องไม่เกิน 5 MB");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    uploadAndAnalyze(file);
  };

  const uploadAndAnalyze = async (file: File) => {
    setIsUploading(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/wardrobe/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || uploadData.error) {
        throw new Error(uploadData.error || "อัปโหลดภาพไม่สำเร็จ");
      }

      setUploadedPath(uploadData.storagePath);
      setIsUploading(false);

      // Trigger AI Analysis
      setIsAnalyzing(true);
      const analyzeRes = await fetch("/api/wardrobe/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storagePath: uploadData.storagePath }),
      });

      const analyzeData = await analyzeRes.json();
      setIsAnalyzing(false);

      if (analyzeData.message) {
        setAiNotice(analyzeData.message);
      }

      if (analyzeData.analysis) {
        const a: WardrobeAnalysisOutput = analyzeData.analysis;
        if (a.suggestedName) setName(a.suggestedName);
        if (a.itemType) setItemType(a.itemType);
        if (a.subcategory) setSubcategory(a.subcategory);
        if (a.primaryColors?.length) setPrimaryColorsText(a.primaryColors.join(", "));
        if (a.styles?.length) setStylesText(a.styles.join(", "));
        if (a.material) setMaterial(a.material);
        if (a.preferredFit) setPreferredFit(a.preferredFit);
        if (a.formality) setFormality(a.formality);
        if (a.weatherSuitability?.length) setWeatherSuitability(a.weatherSuitability);
        if (a.description) setAiDescription(a.description);
      }
    } catch (err) {
      setIsUploading(false);
      setIsAnalyzing(false);
      setErrorMsg(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการอัปโหลดภาพ");
    }
  };

  const toggleWeather = (tag: string) => {
    if (weatherSuitability.includes(tag)) {
      setWeatherSuitability(weatherSuitability.filter((w) => w !== tag));
    } else {
      setWeatherSuitability([...weatherSuitability, tag]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedPath) {
      setErrorMsg("กรุณาเลือกและอัปโหลดรูปภาพก่อนบันทึก");
      return;
    }

    if (!name.trim()) {
      setErrorMsg("กรุณาระบุชื่อเสื้อผ้า");
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    const primaryColors = primaryColorsText
      .split(/[,,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const styles = stylesText
      .split(/[,,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/wardrobe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imagePath: uploadedPath,
          itemType,
          subcategory: subcategory.trim() || null,
          name: name.trim(),
          primaryColors: primaryColors.length ? primaryColors : ["ขาว"],
          styles,
          material: material.trim() || null,
          preferredFit,
          formality,
          weatherSuitability,
          aiDescription: aiDescription.trim() || null,
          isFavorite,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "บันทึกเสื้อผ้าไม่สำเร็จ");
      }

      router.push("/account/wardrobe");
      router.refresh();
    } catch (err) {
      setIsSaving(false);
      setErrorMsg(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-3xl">
      {/* Back Link */}
      <div>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-charcoal transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ย้อนกลับไปตู้เสื้อผ้า</span>
        </button>
      </div>

      {/* Guidance Banner */}
      <div className="border border-line bg-paper p-5 grid sm:grid-cols-[1fr_200px] gap-4 items-center">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-charcoal font-semibold uppercase">
            <Info className="w-4 h-4 text-olive" />
            <span>คำแนะนำการถ่ายภาพเพื่อผลลัพธ์ที่ดีที่สุด</span>
          </div>
          <ul className="grid sm:grid-cols-2 gap-1.5 text-xs text-muted list-disc list-inside">
            <li>ถ่าย 1 ชิ้นต่อ 1 รูป บนพื้นสีเรียบ</li>
            <li>จัดแสงธรรมชาติให้เห็นสีเสื้อจริง</li>
          </ul>
        </div>
        <div className="relative aspect-[16/9] hidden sm:block border border-line overflow-hidden bg-background">
          <Image
            src="/images/fittoday/wardrobe-capture-guide.jpg"
            alt="ตัวอย่างการจัดวางเสื้อผ้าถ่ายรูป"
            fill
            className="object-cover"
          />
        </div>
      </div>

      {/* Errors & Notices */}
      {errorMsg && (
        <div className="p-4 border border-danger/30 bg-danger/10 text-danger text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {aiNotice && (
        <div className="p-4 border border-olive/30 bg-olive/10 text-olive text-xs font-medium flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{aiNotice}</span>
        </div>
      )}

      {/* Step 1: Capture / Upload */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <span className="text-xs font-mono text-muted uppercase">Step 1 / Image Selection</span>
          <span className="text-xs text-olive font-medium">กล้องมือถือ / คลังภาพ</span>
        </div>

        {previewUrl ? (
          <div className="space-y-3">
            <div className="aspect-[3/4] max-w-xs relative bg-background border border-line overflow-hidden shadow-sm">
              <Image src={previewUrl} alt="ตัวอย่างเสื้อผ้าที่ถ่าย" fill className="object-cover" />
              {(isUploading || isAnalyzing) && (
                <div className="absolute inset-0 bg-background/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-charcoal" />
                  <span className="text-xs font-medium text-charcoal">
                    {isUploading ? "กำลังอัปโหลดรูปภาพ..." : "AI Vision กำลังวิเคราะห์สีและลักษณะเสื้อผ้า..."}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setPreviewUrl(null);
                setUploadedPath(null);
              }}
              className="text-xs text-muted hover:text-danger underline"
            >
              ถ่ายหรือเลือกรูปภาพใหม่
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Primary Mobile Action: Camera */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="p-8 border-2 border-dashed border-olive/40 bg-olive-pale/20 hover:border-charcoal hover:bg-paper transition-all text-center flex flex-col items-center justify-center space-y-3 cursor-pointer"
            >
              <Camera className="w-8 h-8 text-olive" />
              <div>
                <strong className="block text-sm text-charcoal">ถ่ายรูปด้วยกล้อง</strong>
                <span className="text-xs text-muted">ถ่ายภาพเสื้อผ้าชิ้นใหม่ทันที</span>
              </div>
            </button>

            {/* Secondary: Gallery Upload */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-8 border-2 border-dashed border-line bg-paper hover:border-charcoal hover:bg-background transition-all text-center flex flex-col items-center justify-center space-y-3 cursor-pointer"
            >
              <Upload className="w-8 h-8 text-charcoal" />
              <div>
                <strong className="block text-sm text-charcoal">เลือกจากคลังภาพ</strong>
                <span className="text-xs text-muted">JPEG, PNG, WebP (ไม่เกิน 5 MB)</span>
              </div>
            </button>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        )}
      </div>

      {/* Step 2: AI Detected Summary & Quick Confirm */}
      {uploadedPath && (
        <div className="space-y-6 pt-6 border-t border-line">
          <div className="p-6 bg-paper border border-line space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-olive" />
                <h3 className="font-serif text-xl font-normal text-charcoal">ผลการวิเคราะห์จาก AI</h3>
              </div>
              <span className="text-xs text-muted font-mono">ยืนยันข้อมูลเร็ว</span>
            </div>

            {/* Detected Key Card */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-muted uppercase mb-1">ชื่อเสื้อผ้า *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น เสื้อเชิ้ตผ้าลินินสีขาว"
                  className="w-full px-4 py-3 border border-line bg-background text-sm font-medium text-charcoal focus:border-charcoal outline-none"
                  required
                />
              </div>

              {/* Category Chips */}
              <div>
                <label className="block text-xs font-mono text-muted uppercase mb-2">ประเภทเสื้อผ้า</label>
                <div className="flex flex-wrap gap-2">
                  {categoryChips.map((c) => {
                    const isSelected = itemType === c.type;
                    return (
                      <button
                        key={c.type}
                        type="button"
                        onClick={() => setItemType(c.type)}
                        className={`px-3 py-1.5 text-xs font-medium border transition-all ${
                          isSelected
                            ? "bg-charcoal text-background border-charcoal"
                            : "bg-background text-charcoal border-line hover:border-muted"
                        }`}
                      >
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Submit Button */}
            <div className="pt-4 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-muted">กดบันทึกทันทีหากข้อมูลถูกต้องแล้ว</span>
              <button
                type="submit"
                disabled={isSaving || !name.trim()}
                className="w-full sm:w-auto px-8 py-3.5 bg-charcoal text-background hover:bg-olive font-semibold text-xs rounded-none transition-colors inline-flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-olive" />
                    <span>ยืนยันและบันทึกในตู้เสื้อผ้า</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Advanced Drawer for Metadata */}
          <div className="border border-line bg-paper">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full p-5 text-left flex items-center justify-between hover:bg-background/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-olive" />
                <span className="text-sm font-medium text-charcoal">แก้ไขรายละเอียดเพิ่มเติม (เนื้อผ้า, ทรง, สภาพอากาศ)</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted font-mono">
                <span>{showAdvanced ? "ซ่อน" : "แสดง"}</span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showAdvanced && (
              <div className="p-6 sm:p-8 border-t border-line space-y-6 bg-background">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-medium text-charcoal mb-1">หมวดย่อย</label>
                    <input
                      type="text"
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                      placeholder="เช่น เชิ้ตแขนยาว, กางเกงสแล็ก"
                      className="w-full px-4 py-3 border border-line bg-paper text-sm text-charcoal focus:border-charcoal outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-charcoal mb-1">สีหลัก</label>
                    <input
                      type="text"
                      value={primaryColorsText}
                      onChange={(e) => setPrimaryColorsText(e.target.value)}
                      placeholder="เช่น ขาว, ครีม"
                      className="w-full px-4 py-3 border border-line bg-paper text-sm text-charcoal focus:border-charcoal outline-none"
                    />
                  </div>

                  {/* Fit Chips */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-charcoal mb-2">ทรงเสื้อผ้า</label>
                    <div className="flex flex-wrap gap-2">
                      {fitChips.map((f) => {
                        const isSelected = preferredFit === f.fit;
                        return (
                          <button
                            key={f.fit}
                            type="button"
                            onClick={() => setPreferredFit(f.fit)}
                            className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                              isSelected
                                ? "bg-charcoal text-background border-charcoal"
                                : "bg-paper text-charcoal border-line hover:border-muted"
                            }`}
                          >
                            {f.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Material */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-charcoal mb-1">ชนิดเนื้อผ้า</label>
                    <input
                      type="text"
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                      placeholder="เช่น ผ้าลินิน, ผ้าคอตตอน, ผ้าเดนิม"
                      className="w-full px-4 py-3 border border-line bg-paper text-sm text-charcoal focus:border-charcoal outline-none"
                    />
                  </div>

                  {/* Weather Chips */}
                  <div className="sm:col-span-2 space-y-2">
                    <label className="block text-xs font-medium text-charcoal">สภาพอากาศที่เหมาะสม</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { tag: "hot", label: "อากาศร้อน" },
                        { tag: "warm", label: "อบอุ่น/สบาย" },
                        { tag: "rain", label: "วันฝนตก" },
                        { tag: "cool", label: "อากาศเย็น/ห้องแอร์" },
                        { tag: "indoor", label: "ในร่ม/ในอาคาร" },
                      ].map((w) => {
                        const checked = weatherSuitability.includes(w.tag);
                        return (
                          <button
                            key={w.tag}
                            type="button"
                            onClick={() => toggleWeather(w.tag)}
                            className={`px-3 py-1.5 text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                              checked
                                ? "bg-charcoal text-background border-charcoal"
                                : "bg-paper text-charcoal border-line hover:border-muted"
                            }`}
                          >
                            {checked && <Check className="w-3.5 h-3.5" />}
                            <span>{w.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {/* Favorite Toggle */}
                  <div className="flex items-center gap-3 sm:col-span-2 pt-2">
                    <input
                      type="checkbox"
                      id="isFav"
                      checked={isFavorite}
                      onChange={(e) => setIsFavorite(e.target.checked)}
                      className="w-4 h-4 accent-charcoal cursor-pointer"
                    />
                    <label htmlFor="isFav" className="text-xs font-medium text-charcoal cursor-pointer select-none">
                      ติดดาวรายการโปรดในตู้เสื้อผ้า
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
