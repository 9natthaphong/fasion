"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Camera, Upload, Sparkles, Check, AlertCircle, Loader2, ArrowLeft, Info } from "lucide-react";
import type { WardrobeAnalysisOutput, WardrobeItemType, WardrobePreferredFit, WardrobeFormality } from "@/lib/types";

export function AddItemForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

    // Auto trigger upload & analysis
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
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-charcoal transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ย้อนกลับไปตู้เสื้อผ้า</span>
        </button>
      </div>

      {/* Photography Tips Banner */}
      <div className="border border-line bg-paper p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-charcoal font-semibold uppercase">
          <Info className="w-4 h-4 text-olive" />
          <span>คำแนะนำการถ่ายภาพเสื้อผ้า</span>
        </div>
        <ul className="grid sm:grid-cols-2 gap-2 text-xs text-muted list-disc list-inside">
          <li>ถ่ายเสื้อผ้าทีละ 1 ชิ้นต่อ 1 ภาพ</li>
          <li>วางบนพื้นหลังสีเรียบสะอาด</li>
          <li>จัดแสงสว่างให้เห็นสีและรายละเอียดชัดเจน</li>
          <li>ถ่ายให้เห็นองค์ประกอบเสื้อผ้าครบทั้งชิ้น</li>
        </ul>
      </div>

      {/* Error / Notice Alert */}
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

      {/* Upload & Image Selector */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-charcoal">รูปถ่ายเสื้อผ้า *</label>

        {previewUrl ? (
          <div className="space-y-3">
            <div className="aspect-[3/4] max-w-xs relative bg-background border border-line overflow-hidden">
              <Image src={previewUrl} alt="ตัวอย่างเสื้อผ้า" fill className="object-cover" />
              {(isUploading || isAnalyzing) && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin text-charcoal" />
                  <span className="text-xs font-medium text-charcoal">
                    {isUploading ? "กำลังอัปโหลดรูปภาพ..." : "AI Vision กำลังวิเคราะห์ลักษณะเสื้อผ้า..."}
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
              เปลี่ยนรูปภาพใหม่
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Camera Input for Mobile */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="p-8 border-2 border-dashed border-line bg-paper hover:border-charcoal hover:bg-background transition-colors text-center flex flex-col items-center justify-center space-y-3"
            >
              <Camera className="w-8 h-8 text-olive" />
              <div>
                <strong className="block text-sm text-charcoal">ถ่ายภาพด้วยกล้อง</strong>
                <span className="text-xs text-muted">สำหรับอุปกรณ์ที่มีกล้อง</span>
              </div>
            </button>

            {/* File Input for Gallery */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-8 border-2 border-dashed border-line bg-paper hover:border-charcoal hover:bg-background transition-colors text-center flex flex-col items-center justify-center space-y-3"
            >
              <Upload className="w-8 h-8 text-charcoal" />
              <div>
                <strong className="block text-sm text-charcoal">เลือกจากคลังภาพ</strong>
                <span className="text-xs text-muted">JPEG, PNG, WebP (สูงสุด 5 MB)</span>
              </div>
            </button>

            {/* Hidden Input Elements */}
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

      {/* Item Metadata Form (User confirmation and manual edit) */}
      <div className="space-y-6 pt-6 border-t border-line">
        <h2 className="font-serif text-2xl font-normal text-charcoal flex items-center gap-2">
          <span>รายละเอียดและข้อมูลเสื้อผ้า</span>
          {isAnalyzing && <Loader2 className="w-4 h-4 animate-spin text-muted" />}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Name */}
          <div className="space-y-2 sm:col-span-2">
            <label className="block text-xs font-medium text-charcoal">ชื่อเรียกเสื้อผ้า *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น เสื้อเชิ้ตผ้าลินินสีขาว, กางเกงสแล็กสีดำ"
              className="w-full px-4 py-3 border border-line bg-background text-sm text-charcoal focus:border-charcoal outline-none"
              required
            />
          </div>

          {/* Item Type */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-charcoal">ประเภทเสื้อผ้า *</label>
            <select
              value={itemType}
              onChange={(e) => setItemType(e.target.value as WardrobeItemType)}
              className="w-full px-4 py-3 border border-line bg-background text-sm text-charcoal focus:border-charcoal outline-none"
            >
              <option value="top">เสื้อ (Top)</option>
              <option value="bottom">กางเกง (Bottom)</option>
              <option value="skirt">กระโปรง (Skirt)</option>
              <option value="dress">ชุดเดรส (Dress)</option>
              <option value="outerwear">เสื้อคลุม / แจ็กเก็ต (Outerwear)</option>
              <option value="shoes">รองเท้า (Shoes)</option>
              <option value="bag">กระเป๋า (Bag)</option>
              <option value="accessory">เครื่องประดับ / หมวก (Accessory)</option>
            </select>
          </div>

          {/* Subcategory */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-charcoal">หมวดย่อย</label>
            <input
              type="text"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              placeholder="เช่น เชิ้ตแขนยาว, กางเกงยีนส์, สนีกเกอร์"
              className="w-full px-4 py-3 border border-line bg-background text-sm text-charcoal focus:border-charcoal outline-none"
            />
          </div>

          {/* Primary Colors */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-charcoal">สีหลัก (คั่นด้วยจุลภาค)</label>
            <input
              type="text"
              value={primaryColorsText}
              onChange={(e) => setPrimaryColorsText(e.target.value)}
              placeholder="เช่น ขาว, ครีม, กรมท่า"
              className="w-full px-4 py-3 border border-line bg-background text-sm text-charcoal focus:border-charcoal outline-none"
            />
          </div>

          {/* Styles */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-charcoal">สไตล์ (คั่นด้วยจุลภาค)</label>
            <input
              type="text"
              value={stylesText}
              onChange={(e) => setStylesText(e.target.value)}
              placeholder="เช่น มินิมอล, ทางการ, ลำลอง"
              className="w-full px-4 py-3 border border-line bg-background text-sm text-charcoal focus:border-charcoal outline-none"
            />
          </div>

          {/* Preferred Fit */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-charcoal">ความกระชับ / ทรงเสื้อผ้า</label>
            <select
              value={preferredFit}
              onChange={(e) => setPreferredFit(e.target.value as WardrobePreferredFit)}
              className="w-full px-4 py-3 border border-line bg-background text-sm text-charcoal focus:border-charcoal outline-none"
            >
              <option value="fitted">เข้ารูป (Fitted)</option>
              <option value="regular">ทรงปกติ (Regular)</option>
              <option value="relaxed">ทรงหลวมสบาย (Relaxed)</option>
              <option value="oversized">โอเวอร์ไซซ์ (Oversized)</option>
              <option value="unknown">ไม่ระบุ</option>
            </select>
          </div>

          {/* Formality */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-charcoal">ระดับความเป็นทางการ</label>
            <select
              value={formality}
              onChange={(e) => setFormality(e.target.value as WardrobeFormality)}
              className="w-full px-4 py-3 border border-line bg-background text-sm text-charcoal focus:border-charcoal outline-none"
            >
              <option value="casual">ลำลองใส่สบาย (Casual)</option>
              <option value="smart_casual">สมาร์ทลำลอง (Smart Casual)</option>
              <option value="business">ทำงาน / ธุรกิจ (Business)</option>
              <option value="formal">ทางการเต็มขั้น (Formal)</option>
              <option value="sport">สปอร์ต / ออกกำลังกาย (Sport)</option>
              <option value="unknown">ทั่วไป</option>
            </select>
          </div>

          {/* Material */}
          <div className="space-y-2 sm:col-span-2">
            <label className="block text-xs font-medium text-charcoal">ชนิดเนื้อผ้า</label>
            <input
              type="text"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="เช่น ผ้าลินิน, ผ้าคอตตอน, ผ้าเดนิม, หนังแท้"
              className="w-full px-4 py-3 border border-line bg-background text-sm text-charcoal focus:border-charcoal outline-none"
            />
          </div>

          {/* Weather Suitability Checkboxes */}
          <div className="space-y-2 sm:col-span-2">
            <label className="block text-xs font-medium text-charcoal">สภาพอากาศที่เหมาะสม</label>
            <div className="flex flex-wrap gap-3 pt-1">
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
                        ? "bg-charcoal text-white border-charcoal"
                        : "bg-background text-charcoal border-line hover:border-charcoal"
                    }`}
                  >
                    {checked && <Check className="w-3.5 h-3.5" />}
                    <span>{w.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Description */}
          <div className="space-y-2 sm:col-span-2">
            <label className="block text-xs font-medium text-charcoal">รายละเอียดจาก AI / โน้ตส่วนตัว</label>
            <textarea
              rows={3}
              value={aiDescription}
              onChange={(e) => setAiDescription(e.target.value)}
              placeholder="อธิบายรายละเอียดการใช้งาน จุดเด่น หรือคำแนะนำส่วนตัว"
              className="w-full p-4 border border-line bg-background text-sm text-charcoal focus:border-charcoal outline-none"
            />
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
            <label htmlFor="isFav" className="text-sm font-medium text-charcoal cursor-pointer select-none">
              ติดดาวรายการโปรดในตู้เสื้อผ้า
            </label>
          </div>
        </div>
      </div>

      {/* Action Submit Button */}
      <div className="pt-6 border-t border-line flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-4 border border-line text-charcoal hover:bg-paper font-medium text-xs rounded-none transition-colors"
        >
          ยกเลิก
        </button>

        <button
          type="submit"
          disabled={isUploading || isAnalyzing || isSaving || !uploadedPath}
          className="px-8 py-4 bg-charcoal text-white hover:bg-black font-medium text-xs rounded-none transition-colors disabled:opacity-50 inline-flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>กำลังบันทึก...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>บันทึกในตู้เสื้อผ้า</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
