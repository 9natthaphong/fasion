/* eslint-disable react-hooks/incompatible-library */
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  Info,
  Check,
  AlertCircle,
  RefreshCw,
  Shirt,
  Sparkles,
  Plus,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sun,
  CloudRain,
  Snowflake,
  Compass,
  SlidersHorizontal,
} from "lucide-react";
import { SponsoredAdSection } from "@/components/sponsored-ad-section";
import type { OutfitResponse, WardrobeItem, WardrobeOutfitResponse } from "@/lib/types";

type StylistFields = {
  mode: "general" | "wardrobe";
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

const quickActivities = [
  { id: "ไปทำงาน", label: "ไปทำงาน", icon: "💼" },
  { id: "ไปคาเฟ่", label: "ไปคาเฟ่", icon: "☕" },
  { id: "ไปเดต", label: "ไปเดต", icon: "✨" },
  { id: "ไปเที่ยวทะเล", label: "ไปเที่ยวทะเล", icon: "🏖️" },
  { id: "ไปมหาวิทยาลัย", label: "ไปเรียน/มหาลัย", icon: "🎓" },
  { id: "อยู่บ้าน / ชิลล์", label: "อยู่บ้าน / ชิลล์", icon: "🌿" },
  { id: "ออกงาน / ปาร์ตี้", label: "ออกงาน / ปาร์ตี้", icon: "🥂" },
  { id: "เดินทาง / ท่องเที่ยว", label: "เดินทางท่องเที่ยว", icon: "✈️" },
];

const quickWeathers = [
  { label: "32°C ร้อนชื้น / แดดจัด", value: "32°C ร้อนชื้น มีแดดจัด", icon: Sun },
  { label: "วันฝนตก / ตกชุ่มฉ่ำ", value: "28°C ฝนตก ชื้น", icon: CloudRain },
  { label: "ห้องแอร์เย็น / ในอาคาร", value: "24°C ห้องแอร์เย็น", icon: Snowflake },
  { label: "ช่วงเย็น / ลมพัดสบาย", value: "27°C ช่วงเย็น อากาศสบาย", icon: Compass },
];

const moodOptions = [
  { id: "casual", label: "ใส่ง่าย (Safe)", desc: "เพลย์เซฟด้วยโทนสีนิวทรัล เข้าได้กับทุกสถานการณ์" },
  { id: "smart_casual", label: "แต่งขึ้น (Elevated)", desc: "คัตติ้งเนี้ยบ เพิ่มความมั่นใจและดูมีระดับ" },
  { id: "formal", label: "สบาย (Comfortable)", desc: "ผ้าระบายอากาศได้ดี เน้นคล่องตัวตลอดวัน" },
];

export function StylistForm({
  configured,
  initialMode = "general",
}: {
  configured: boolean;
  initialMode?: "general" | "wardrobe";
}) {
  const [mode, setMode] = useState<"general" | "wardrobe">(initialMode);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [isLoadingWardrobe, setIsLoadingWardrobe] = useState(false);
  const [wardrobeFetchError, setWardrobeFetchError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StylistFields>({
    defaultValues: {
      mode: initialMode,
      heightCm: "",
      weightKg: "",
      clothingPresentation: "unspecified",
      activity: "ไปคาเฟ่",
      formality: "casual",
      weather: "32°C ร้อนชื้น มีแดดจัด",
      timeOfDay: "all_day",
      preferredStyles: "",
      preferredColors: "",
      avoidedColors: "",
      preferredFit: "unspecified",
      budget: "",
      anchorItem: "",
      notes: "",
      saveForNextTime: false,
    },
  });

  const selectedActivity = watch("activity");
  const selectedWeather = watch("weather");
  const selectedFormality = watch("formality");

  const [generalResult, setGeneralResult] = useState<OutfitResponse | null>(null);
  const [wardrobeResult, setWardrobeResult] = useState<WardrobeOutfitResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let isSubscribed = true;
    let timer: NodeJS.Timeout;

    if (mode === "wardrobe") {
      timer = setTimeout(() => {
        if (!isSubscribed) return;
        setIsLoadingWardrobe(true);
        setWardrobeFetchError(null);

        fetch("/api/wardrobe?status=available")
          .then((res) => {
            if (res.status === 401) {
              if (isSubscribed) {
                setWardrobeFetchError("กรุณาเข้าสู่ระบบก่อนใช้งานโหมดตู้เสื้อผ้าส่วนตัว");
                setWardrobeItems([]);
              }
              return null;
            }
            return res.json();
          })
          .then((data) => {
            if (data && isSubscribed) {
              setWardrobeItems(data.items || []);
            }
          })
          .catch((err) => {
            if (isSubscribed) {
              setWardrobeFetchError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
            }
          })
          .finally(() => {
            if (isSubscribed) {
              setIsLoadingWardrobe(false);
            }
          });
      }, 0);
    }

    return () => {
      isSubscribed = false;
      if (timer) clearTimeout(timer);
    };
  }, [mode]);

  const toggleExcludeItem = (id: string) => {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  async function submit(values: StylistFields) {
    setError("");
    setGeneralResult(null);
    setWardrobeResult(null);

    const payload = {
      ...values,
      mode,
      excludedItemIds: Array.from(excludedIds),
      heightCm: values.heightCm && String(values.heightCm).trim() !== "" ? Number(values.heightCm) : null,
      weightKg: values.weightKg && String(values.weightKg).trim() !== "" ? Number(values.weightKg) : null,
      budget: values.budget && String(values.budget).trim() !== "" ? Number(values.budget) : null,
      anchorItem: values.anchorItem ?? "",
      notes: values.notes ?? "",
      preferredStyles: splitList(values.preferredStyles ?? ""),
      preferredColors: splitList(values.preferredColors ?? ""),
      avoidedColors: splitList(values.avoidedColors ?? ""),
    };

    const response = await fetch("/api/ai-stylist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = await response.json();
    if (!response.ok) {
      setError(
        body.code === "configuration_missing"
          ? "ยังไม่ได้ตั้งค่า OPENAI_API_KEY บน environment นี้"
          : body.error ?? "สร้างคำแนะนำไม่สำเร็จ กรุณาลองใหม่",
      );
      return;
    }

    if (mode === "wardrobe") {
      setWardrobeResult(body);
    } else {
      setGeneralResult(body);
    }

    setTimeout(() => {
      document.querySelector("#stylist-results")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }

  return (
    <>
      {/* Mode Switcher */}
      <div className="flex border border-line bg-paper p-1 max-w-md mb-8">
        <button
          type="button"
          onClick={() => setMode("general")}
          className={`flex-1 py-3 px-4 text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            mode === "general"
              ? "bg-charcoal text-background shadow-sm"
              : "text-muted hover:text-charcoal"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>ไอเดียชุดทั่วไป</span>
        </button>

        <button
          type="button"
          onClick={() => setMode("wardrobe")}
          className={`flex-1 py-3 px-4 text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2 ${
            mode === "wardrobe"
              ? "bg-charcoal text-background shadow-sm"
              : "text-muted hover:text-charcoal"
          }`}
        >
          <Shirt className="w-4 h-4 text-olive" />
          <span>จากตู้เสื้อผ้าของฉัน</span>
        </button>
      </div>

      {!configured && (
        <div className="p-4 mb-8 border border-warning/40 bg-warning/10 text-sm flex items-start gap-3" role="status">
          <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div>
            <strong className="block font-medium text-warning mb-0.5">Development Configuration Notice</strong>
            <p className="text-muted text-xs">ระบบคำแนะนำเปิดทำงานแล้ว แต่อาจใช้ผลลัพธ์ fallback หากยังไม่ได้เชื่อมต่อ OpenAI key บน server</p>
          </div>
        </div>
      )}

      {/* Wardrobe Item Selection Banner */}
      {mode === "wardrobe" && (
        <div className="p-6 mb-8 border border-olive/30 bg-olive-pale/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shirt className="w-5 h-5 text-olive" />
              <h3 className="font-serif text-xl font-normal text-charcoal">เสื้อผ้าพร้อมใส่ในตู้ส่วนตัว</h3>
            </div>
            <Link
              href="/account/wardrobe/new"
              className="text-xs font-semibold px-3 py-1.5 bg-charcoal text-background hover:bg-olive inline-flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มเสื้อผ้าชิ้นใหม่</span>
            </Link>
          </div>

          {isLoadingWardrobe ? (
            <div className="flex items-center gap-2 text-xs text-muted">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>กำลังดึงข้อมูลตู้เสื้อผ้า...</span>
            </div>
          ) : wardrobeFetchError ? (
            <div className="text-xs text-danger font-medium flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>{wardrobeFetchError}</span>
            </div>
          ) : wardrobeItems.length === 0 ? (
            <div className="text-xs text-muted space-y-2">
              <p>ยังไม่มีเสื้อผ้าในตู้ส่วนตัว กรุณาเพิ่มรายการเสื้อผ้าก่อนจัดลุค</p>
              <Link href="/account/wardrobe/new" className="inline-block px-4 py-2 bg-charcoal text-background text-xs font-medium">
                + ถ่ายรูปเพิ่มเสื้อผ้าชิ้นแรก
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted">
                พบเสื้อผ้าในตู้ {wardrobeItems.length} ชิ้น (คลิกเพื่อเลือกชิ้นที่ต้องการเว้นใส่ในวันนี้):
              </p>
              <div className="flex flex-wrap gap-2">
                {wardrobeItems.map((item) => {
                  const isExcluded = excludedIds.has(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleExcludeItem(item.id)}
                      className={`px-3 py-1.5 text-xs border transition-all flex items-center gap-2 ${
                        isExcluded
                          ? "bg-background text-muted border-line line-through opacity-50"
                          : "bg-paper text-charcoal border-olive/50 font-medium hover:border-charcoal shadow-2xs"
                      }`}
                    >
                      <span>{item.name || item.item_type}</span>
                      {isExcluded ? <span className="text-[10px] text-danger">(เว้น)</span> : <Check className="w-3.5 h-3.5 text-olive" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Quick-Stylist Form Layout */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-10 items-start">
        <form onSubmit={handleSubmit(submit)} className="space-y-8">
          
          {/* Section 1: กิจกรรมวันนี้ (Selectable Visual Chips) */}
          <div className="p-6 sm:p-8 bg-paper border border-line space-y-5">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <span className="font-mono text-xs text-muted tracking-wider">01 / OCCASION</span>
              <span className="text-xs text-olive font-semibold uppercase tracking-wider">ขั้นตอนหลัก</span>
            </div>
            <div>
              <h2 className="font-serif text-2xl text-charcoal mb-1">วันนี้จะไปทำอะไร?</h2>
              <p className="text-xs text-muted">เลือกกิจกรรมที่ใกล้เคียงที่สุด เพื่อให้ AI ช่วยคัดกาลเทศะที่เหมาะสม</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickActivities.map((act) => {
                const isSelected = selectedActivity === act.id;
                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => setValue("activity", act.id)}
                    className={`p-3.5 text-left border transition-all min-h-[72px] flex flex-col justify-between ${
                      isSelected
                        ? "border-charcoal bg-charcoal text-background font-medium shadow-sm"
                        : "border-line bg-background text-charcoal hover:border-muted"
                    }`}
                  >
                    <span className="text-lg">{act.icon}</span>
                    <span className="text-xs font-medium truncate">{act.label}</span>
                  </button>
                );
              })}
            </div>
            {errors.activity && <small className="text-xs text-danger block">{errors.activity.message}</small>}
          </div>

          {/* Section 2: อากาศและอุณหภูมิ (Selectable Chips) */}
          <div className="p-6 sm:p-8 bg-paper border border-line space-y-5">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <span className="font-mono text-xs text-muted tracking-wider">02 / ENVIRONMENT</span>
              <span className="text-xs text-muted">คำนวณจากอากาศเมืองไทย</span>
            </div>
            <div>
              <h2 className="font-serif text-2xl text-charcoal mb-1">สภาพอากาศในวันนี้</h2>
              <p className="text-xs text-muted">เลือกสภาพอากาศเพื่อคำนวณเนื้อผ้าและการเลเยอร์เสื้อผ้า</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {quickWeathers.map((w) => {
                const isSelected = selectedWeather === w.value;
                const IconComponent = w.icon;
                return (
                  <button
                    key={w.label}
                    type="button"
                    onClick={() => setValue("weather", w.value)}
                    className={`p-4 border text-left transition-all flex items-center gap-3 ${
                      isSelected
                        ? "border-charcoal bg-charcoal text-background font-medium"
                        : "border-line bg-background text-charcoal hover:border-muted"
                    }`}
                  >
                    <IconComponent className={`w-5 h-5 shrink-0 ${isSelected ? "text-white" : "text-olive"}`} />
                    <span className="text-xs font-medium">{w.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: ทิศทางลุคที่ต้องการ (Selectable Cards) */}
          <div className="p-6 sm:p-8 bg-paper border border-line space-y-5">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <span className="font-mono text-xs text-muted tracking-wider">03 / MOOD & DIRECTION</span>
              <span className="text-xs text-muted">3 สไตล์เด่น</span>
            </div>
            <div>
              <h2 className="font-serif text-2xl text-charcoal mb-1">อารมณ์การแต่งตัวที่ชอบ</h2>
              <p className="text-xs text-muted">ระบุทิศทางหลักที่อยากเน้นเป็นพิเศษสำหรับวันวันนี้</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              {moodOptions.map((m) => {
                const isSelected = selectedFormality === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setValue("formality", m.id as "casual" | "smart_casual" | "formal")}
                    className={`p-4 text-left border transition-all flex flex-col justify-between space-y-2 min-h-[96px] ${
                      isSelected
                        ? "border-charcoal bg-charcoal text-background"
                        : "border-line bg-background text-charcoal hover:border-muted"
                    }`}
                  >
                    <strong className="text-xs font-semibold block">{m.label}</strong>
                    <span className={`text-[11px] leading-tight ${isSelected ? "text-paper/80" : "text-muted"}`}>{m.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Progressive Disclosure / Advanced Preference Drawer */}
          <div className="border border-line bg-paper">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full p-6 text-left flex items-center justify-between hover:bg-background/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <SlidersHorizontal className="w-4 h-4 text-olive" />
                <span className="text-sm font-medium text-charcoal">ปรับรายละเอียดเพิ่มเติม (สัดส่วน, โทนสีเฉพาะ, งบประมาณ)</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted font-mono">
                <span>{showAdvanced ? "ย่อ" : "ขยาย"}</span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showAdvanced && (
              <div className="p-6 sm:p-8 border-t border-line space-y-6 bg-background">
                <div className="p-4 border border-olive/30 bg-olive-pale/30 text-xs text-muted space-y-1">
                  <strong className="block text-charcoal font-medium">ความเป็นส่วนตัวของสัดส่วน:</strong>
                  <p>การกรอกส่วนสูง น้ำหนัก หรือทรงเสื้อผ้าเป็น **ทางเลือกเสริม** ระบบสามารถสร้างคำแนะนำลุคที่มีคุณภาพได้แม้ไม่ระบุสัดส่วน</p>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1">ส่วนสูง (ซม.) (ไม่บังคับ)</label>
                    <input
                      type="number"
                      min={80}
                      max={260}
                      placeholder="เช่น 170"
                      className="w-full p-3 bg-paper border border-line text-sm focus:border-charcoal outline-none"
                      {...register("heightCm")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1">น้ำหนัก (กก.) (ไม่บังคับ)</label>
                    <input
                      type="number"
                      min={20}
                      max={350}
                      step="0.1"
                      placeholder="เช่น 62"
                      className="w-full p-3 bg-paper border border-line text-sm focus:border-charcoal outline-none"
                      {...register("weightKg")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1">ทรงเสื้อผ้าที่ชอบ</label>
                    <select className="w-full p-3 bg-paper border border-line text-sm focus:border-charcoal outline-none" {...register("preferredFit")}>
                      <option value="unspecified">ไม่ระบุ</option>
                      <option value="fitted">เข้ารูปพอดีตัว (Fitted)</option>
                      <option value="relaxed">หลวมใส่สบาย (Relaxed / Oversized)</option>
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1">โทนสีที่ชอบ</label>
                    <input
                      placeholder="เช่น ขาว, เขียวมะกอก, กรมท่า"
                      className="w-full p-3 bg-paper border border-line text-sm focus:border-charcoal outline-none"
                      {...register("preferredColors")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1">สีที่ไม่ต้องการใส่</label>
                    <input
                      placeholder="เช่น ส้มสด, สีสะท้อนแสง"
                      className="w-full p-3 bg-paper border border-line text-sm focus:border-charcoal outline-none"
                      {...register("avoidedColors")}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1">ชิ้นหลักที่มีอยู่แล้ว (Anchor Item)</label>
                  <input
                    placeholder="เช่น อยากใส่กางเกงยีนส์ขากว้างตัวโปรดเป็นชิ้นหลัก"
                    className="w-full p-3 bg-paper border border-line text-sm focus:border-charcoal outline-none"
                    {...register("anchorItem")}
                  />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-danger/10 border border-danger/30 text-danger text-sm flex items-center gap-2" role="alert">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isSubmitting || (mode === "wardrobe" && wardrobeItems.length < 1)}
            className="w-full py-5 bg-charcoal text-background hover:bg-olive font-semibold text-sm rounded-none transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>AI Stylist กำลังประมวลผลคำแนะนำ 3 ทิศทาง...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>
                  {mode === "wardrobe" ? "จัดชุดจากตู้เสื้อผ้าส่วนตัว" : "สร้างคำแนะนำ 3 ชุดสำหรับวันนี้"}
                </span>
              </>
            )}
          </button>
        </form>

        {/* Side Panel Guidance */}
        <aside className="space-y-6 sticky top-24">
          <div className="p-6 bg-paper border border-line space-y-4 text-sm">
            <h3 className="font-serif text-xl font-normal border-b border-line pb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-olive" />
              <span>มาตรฐานความน่าเชื่อถือ</span>
            </h3>
            <div className="space-y-3 text-xs text-muted leading-relaxed">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-olive shrink-0 mt-0.5" />
                <span><strong>คำแนะนำเป็นกลาง:</strong> ระบบจัดชุดจากความเหมาะสมของโอกาสและสภาพอากาศ 100%</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-olive shrink-0 mt-0.5" />
                <span><strong>แยกโฆษณาชัดเจน:</strong> โฆษณาร้านค้าแสดงในส่วน Sponsored แยกต่างหาก ไม่ปะปนกับ AI</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-olive shrink-0 mt-0.5" />
                <span><strong>ไม่บังคับส่วนสูง/น้ำหนัก:</strong> คุณสามารถสร้างลุคได้ทันทีโดยไม่ต้องกรอกสัดส่วน</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Results Rendering Section */}
      <section id="stylist-results" className="mt-16 pt-12 border-t border-line scroll-mt-24" aria-live="polite">
        {isSubmitting && (
          <div className="space-y-6 animate-pulse">
            <div className="h-8 bg-line/40 rounded w-1/3"></div>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="h-96 bg-paper border border-line p-6"></div>
              <div className="h-96 bg-paper border border-line p-6"></div>
              <div className="h-96 bg-paper border border-line p-6"></div>
            </div>
          </div>
        )}

        {generalResult && (
          <div className="space-y-10">
            <div className="bg-paper border border-line p-8 space-y-3">
              <p className="eyebrow">Your Custom Edit</p>
              <h2 className="font-serif text-3xl md:text-4xl font-normal">คำแนะนำชุดสำหรับวันนี้</h2>
              <p className="text-muted leading-relaxed text-base">{generalResult.summary}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {generalResult.outfits.map((outfit, index) => {
                const badge = getDirectionBadge(outfit.direction);
                return (
                  <article className="bg-paper border border-line p-6 space-y-5 flex flex-col justify-between" key={outfit.direction}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-line pb-3">
                        <span className="font-mono text-xs text-muted">0{index + 1}</span>
                        <span className={`text-xs px-2.5 py-1 font-medium ${badge.bg} ${badge.color}`}>
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
                        <div className="border-b border-line/60 pb-2">
                          <span className="text-xs text-muted block">รองเท้า</span>
                          <span className="font-medium text-charcoal">{outfit.shoes}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {generalResult.generalTips?.length > 0 && (
              <div className="p-8 bg-paper border border-line space-y-4">
                <h3 className="font-serif text-2xl font-normal">คำแนะนำเพิ่มเติมในการแต่งตัว</h3>
                <ul className="grid sm:grid-cols-2 gap-3 text-sm text-muted list-disc list-inside">
                  {generalResult.generalTips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {generalResult.sponsoredAds && generalResult.sponsoredAds.length > 0 && (
              <SponsoredAdSection ads={generalResult.sponsoredAds} />
            )}
          </div>
        )}

        {wardrobeResult && (
          <div className="space-y-10">
            <div className="bg-paper border border-line p-8 space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-mono text-olive uppercase">
                <Shirt className="w-4 h-4" />
                <span>My Wardrobe Edit</span>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-normal">ชุดแนะนำจากตู้เสื้อผ้าของคุณ</h2>
              <p className="text-muted leading-relaxed text-base">{wardrobeResult.summary}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {wardrobeResult.outfits.map((outfit, index) => {
                const badge = getDirectionBadge(outfit.direction);
                return (
                  <article className="bg-paper border border-line p-6 space-y-5 flex flex-col justify-between" key={outfit.direction}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-line pb-3">
                        <span className="font-mono text-xs text-muted">0{index + 1}</span>
                        <span className={`text-xs px-2.5 py-1 font-medium ${badge.bg} ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-serif text-2xl font-normal mb-1">{outfit.name}</h3>
                        <p className="text-xs font-mono text-olive">{outfit.style}</p>
                      </div>

                      <div className="space-y-3 pt-2">
                        <span className="text-xs font-mono text-muted uppercase block">ชิ้นที่เลือกใช้จากตู้เสื้อผ้า:</span>
                        <div className="grid grid-cols-2 gap-3">
                          {outfit.items.map((itemRef) => {
                            const details = itemRef.itemDetails;
                            const imageSrc = details?.signed_image_url || "/demo-assets/ad-linen-shirt.jpg";
                            return (
                              <div key={itemRef.wardrobeItemId} className="border border-line bg-background p-2 space-y-1">
                                <div className="aspect-square relative bg-paper border border-line overflow-hidden">
                                  <Image
                                    src={imageSrc}
                                    alt={details?.name || itemRef.role}
                                    fill
                                    unoptimized
                                    onError={(e) => {
                                      const target = e.currentTarget as HTMLImageElement;
                                      target.src = "/demo-assets/ad-linen-shirt.jpg";
                                    }}
                                    className="object-cover"
                                  />
                                </div>
                                <span className="text-[10px] font-mono text-muted uppercase block truncate">{itemRef.role}</span>
                                <strong className="text-xs font-medium text-charcoal block truncate">
                                  {details?.name || "เสื้อผ้าส่วนตัว"}
                                </strong>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-line space-y-2 text-xs">
                      <p className="text-muted flex items-start gap-2">
                        <Info className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{outfit.comfortNote}</span>
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </>
  );
}

function splitList(value: string) {
  if (!value) return [];
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function getDirectionBadge(direction: string) {
  switch (direction) {
    case "safe":
      return { label: "ใส่ง่าย (Safe)", bg: "bg-paper", color: "text-charcoal" };
    case "elevated":
      return { label: "แต่งขึ้น (Elevated)", bg: "bg-charcoal", color: "text-background" };
    case "comfortable":
    default:
      return { label: "สบาย (Comfortable)", bg: "bg-background border border-line", color: "text-charcoal" };
  }
}
