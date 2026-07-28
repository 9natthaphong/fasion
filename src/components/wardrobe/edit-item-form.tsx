"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Check, Trash2, Heart, AlertCircle, Loader2 } from "lucide-react";
import type { WardrobeItem, WardrobeItemType, WardrobeAvailabilityStatus, WardrobePreferredFit, WardrobeFormality } from "@/lib/types";

interface Props {
  item: WardrobeItem;
}

export function EditItemForm({ item }: Props) {
  const router = useRouter();

  const [name, setName] = useState(item.name || "");
  const [itemType, setItemType] = useState<WardrobeItemType>(item.item_type);
  const [subcategory, setSubcategory] = useState(item.subcategory || "");
  const [primaryColorsText, setPrimaryColorsText] = useState((item.primary_colors || []).join(", "));
  const [stylesText, setStylesText] = useState((item.styles || []).join(", "));
  const [material, setMaterial] = useState(item.material || "");
  const [preferredFit, setPreferredFit] = useState<WardrobePreferredFit>(item.preferred_fit || "regular");
  const [formality, setFormality] = useState<WardrobeFormality>(item.formality || "casual");
  const [weatherSuitability, setWeatherSuitability] = useState<string[]>(item.weather_suitability || ["warm"]);
  const [aiDescription, setAiDescription] = useState(item.ai_description || "");
  const [availabilityStatus, setAvailabilityStatus] = useState<WardrobeAvailabilityStatus>(item.availability_status);
  const [isFavorite, setIsFavorite] = useState(item.is_favorite);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const toggleWeather = (tag: string) => {
    if (weatherSuitability.includes(tag)) {
      setWeatherSuitability(weatherSuitability.filter((w) => w !== tag));
    } else {
      setWeatherSuitability([...weatherSuitability, tag]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("กรุณาระบุชื่อเสื้อผ้า");
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const primaryColors = primaryColorsText
      .split(/[,,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const styles = stylesText
      .split(/[,,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch(`/api/wardrobe/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          itemType,
          subcategory: subcategory.trim() || null,
          primaryColors: primaryColors.length ? primaryColors : ["ขาว"],
          styles,
          material: material.trim() || null,
          preferredFit,
          formality,
          weatherSuitability,
          aiDescription: aiDescription.trim() || null,
          availabilityStatus,
          isFavorite,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "บันทึกข้อมูลไม่สำเร็จ");
      }

      setSuccessMsg("บันทึกการแก้ไขเรียบร้อยแล้ว");
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (permanent = false) => {
    setIsDeleting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/wardrobe/${item.id}?permanent=${permanent}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "ลบเสื้อผ้าไม่สำเร็จ");
      }

      router.push("/account/wardrobe");
      router.refresh();
    } catch (err) {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setErrorMsg(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการลบเสื้อผ้า");
    }
  };

  const imageSrc = item.signed_image_url || "/demo-assets/ad-linen-shirt.jpg";

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={() => router.push("/account/wardrobe")}
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-charcoal transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับไปยังตู้เสื้อผ้า</span>
        </button>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Image View */}
        <div className="lg:col-span-5 space-y-4">
          <div className="aspect-[3/4] relative bg-background border border-line overflow-hidden">
            <Image src={imageSrc} alt={name || "เสื้อผ้าส่วนตัว"} fill className="object-cover" priority />
          </div>

          {/* Quick Actions */}
          <div className="p-4 border border-line bg-paper space-y-3">
            <span className="text-xs font-mono text-muted block uppercase">สถานะปัจจุบัน</span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { status: "available", label: "พร้อมใส่" },
                { status: "laundry", label: "ส่งซัก" },
                { status: "archived", label: "เก็บไว้" },
              ].map((s) => {
                const isActive = availabilityStatus === s.status;
                return (
                  <button
                    key={s.status}
                    type="button"
                    onClick={() => setAvailabilityStatus(s.status as WardrobeAvailabilityStatus)}
                    className={`px-2 py-2 text-xs font-medium border text-center transition-colors ${
                      isActive
                        ? "bg-charcoal text-white border-charcoal"
                        : "bg-background text-charcoal border-line hover:border-charcoal"
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-line flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsFavorite(!isFavorite)}
                className="inline-flex items-center gap-2 text-xs font-medium text-charcoal hover:text-danger transition-colors"
              >
                <Heart className={`w-4 h-4 ${isFavorite ? "fill-danger text-danger" : "text-muted"}`} />
                <span>{isFavorite ? "รายการโปรด" : "เพิ่มในรายการโปรด"}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-1.5 text-xs text-danger hover:underline"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบรายการนี้</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Form Fields */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2 sm:col-span-2">
              <label className="block text-xs font-medium text-charcoal">ชื่อเรียกเสื้อผ้า *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-line bg-background text-sm text-charcoal focus:border-charcoal outline-none"
                required
              />
            </div>

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
                <option value="accessory">เครื่องประดับ (Accessory)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-charcoal">หมวดย่อย</label>
              <input
                type="text"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full px-4 py-3 border border-line bg-background text-sm text-charcoal focus:border-charcoal outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-charcoal">สีหลัก</label>
              <input
                type="text"
                value={primaryColorsText}
                onChange={(e) => setPrimaryColorsText(e.target.value)}
                className="w-full px-4 py-3 border border-line bg-background text-sm text-charcoal focus:border-charcoal outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-charcoal">สไตล์</label>
              <input
                type="text"
                value={stylesText}
                onChange={(e) => setStylesText(e.target.value)}
                className="w-full px-4 py-3 border border-line bg-background text-sm text-charcoal focus:border-charcoal outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-charcoal">ความกระชับ / ทรง</label>
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

            <div className="space-y-2">
              <label className="block text-xs font-medium text-charcoal">ความเป็นทางการ</label>
              <select
                value={formality}
                onChange={(e) => setFormality(e.target.value as WardrobeFormality)}
                className="w-full px-4 py-3 border border-line bg-background text-sm text-charcoal focus:border-charcoal outline-none"
              >
                <option value="casual">ลำลองใส่สบาย (Casual)</option>
                <option value="smart_casual">สมาร์ทลำลอง (Smart Casual)</option>
                <option value="business">ทำงาน / ธุรกิจ (Business)</option>
                <option value="formal">ทางการเต็มขั้น (Formal)</option>
                <option value="sport">สปอร์ต (Sport)</option>
                <option value="unknown">ทั่วไป</option>
              </select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="block text-xs font-medium text-charcoal">ชนิดเนื้อผ้า</label>
              <input
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className="w-full px-4 py-3 border border-line bg-background text-sm text-charcoal focus:border-charcoal outline-none"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="block text-xs font-medium text-charcoal">สภาพอากาศที่เหมาะสม</label>
              <div className="flex flex-wrap gap-2 pt-1">
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
                      className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                        checked
                          ? "bg-charcoal text-white border-charcoal"
                          : "bg-background text-charcoal border-line hover:border-charcoal"
                      }`}
                    >
                      {w.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="block text-xs font-medium text-charcoal">รายละเอียดและโน้ตส่วนตัว</label>
              <textarea
                rows={3}
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
                className="w-full p-4 border border-line bg-background text-sm text-charcoal focus:border-charcoal outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-line flex items-center justify-end gap-4">
            <button
              type="submit"
              disabled={isSaving}
              className="px-8 py-4 bg-charcoal text-white hover:bg-olive font-medium text-xs rounded-none transition-colors disabled:opacity-50 inline-flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>บันทึกการแก้ไข</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-background border border-line p-6 max-w-md w-full space-y-4">
            <h3 className="font-serif text-2xl font-normal text-charcoal">ยืนยันการลบเสื้อผ้า</h3>
            <p className="text-sm text-muted">
              คุณต้องการลบรายการ &quot;{name}&quot; ออกจากตู้เสื้อผ้าหรือไม่?
            </p>

            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-line text-charcoal text-xs font-medium hover:bg-paper"
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={() => handleDelete(false)}
                disabled={isDeleting}
                className="px-4 py-2 bg-danger text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? "กำลังลบ..." : "ซ่อนรายการนี้"}
              </button>

              <button
                type="button"
                onClick={() => handleDelete(true)}
                disabled={isDeleting}
                className="px-4 py-2 bg-black text-white text-xs font-medium hover:bg-neutral-800 disabled:opacity-50"
              >
                {isDeleting ? "กำลังลบ..." : "ลบถาวร"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
