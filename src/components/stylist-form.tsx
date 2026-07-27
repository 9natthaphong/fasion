"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Info, Check, AlertCircle, RefreshCw, Shirt, Sparkles, Plus, AlertTriangle } from "lucide-react";
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

const activities = ["ไปทำงาน", "ไปมหาวิทยาลัย", "ไปคาเฟ่", "ไปเดต", "ไปงานแต่ง", "ไปวัด", "ไปเที่ยวทะเล", "ออกกำลังกาย", "เดินทาง", "อยู่บ้าน", "อื่นๆ"];

export function StylistForm({ configured, initialMode = "general" }: { configured: boolean; initialMode?: "general" | "wardrobe" }) {
  const [mode, setMode] = useState<"general" | "wardrobe">(initialMode);
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [isLoadingWardrobe, setIsLoadingWardrobe] = useState(false);
  const [wardrobeFetchError, setWardrobeFetchError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<StylistFields>({
    defaultValues: {
      mode: initialMode,
      clothingPresentation: "unspecified",
      formality: "casual",
      timeOfDay: "all_day",
      preferredFit: "unspecified",
      saveForNextTime: false,
    },
  });

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
      heightCm: values.heightCm ? Number(values.heightCm) : null,
      weightKg: values.weightKg ? Number(values.weightKg) : null,
      budget: values.budget ? Number(values.budget) : null,
      preferredStyles: splitList(values.preferredStyles),
      preferredColors: splitList(values.preferredColors),
      avoidedColors: splitList(values.avoidedColors),
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
          ? "ยังไม่ได้ตั้งค่า OpenAI API สำหรับ environment นี้"
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
      {/* Mode Switcher Tabs */}
      <div className="flex border border-line bg-paper p-1 max-w-xl mb-8">
        <button
          type="button"
          onClick={() => setMode("general")}
          className={`flex-1 py-3 px-4 text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            mode === "general"
              ? "bg-charcoal text-white shadow-sm"
              : "text-muted hover:text-charcoal"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>ไอเดียชุดทั่วไป</span>
        </button>

        <button
          type="button"
          onClick={() => setMode("wardrobe")}
          className={`flex-1 py-3 px-4 text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            mode === "wardrobe"
              ? "bg-charcoal text-white shadow-sm"
              : "text-muted hover:text-charcoal"
          }`}
        >
          <Shirt className="w-4 h-4 text-olive" />
          <span>จากตู้เสื้อผ้าของฉัน</span>
        </button>
      </div>

      {!configured ? (
        <div className="p-4 mb-8 border border-warning/40 bg-warning/10 text-sm flex items-start gap-3" role="status">
          <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div>
            <strong className="block font-medium text-warning mb-0.5">Development configuration missing</strong>
            <p className="text-muted">ฟอร์มพร้อมใช้งานแล้ว แต่ต้องตั้งค่า OPENAI_API_KEY บน server เพื่อเรียก AI จริง</p>
          </div>
        </div>
      ) : null}

      {/* Wardrobe Mode Active Banner */}
      {mode === "wardrobe" && (
        <div className="p-5 mb-8 border border-olive/30 bg-olive-pale/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shirt className="w-5 h-5 text-olive" />
              <h3 className="font-serif text-lg font-normal text-charcoal">ตู้เสื้อผ้าส่วนตัวของคุณ</h3>
            </div>
            <Link href="/account/wardrobe/new" className="text-xs text-olive font-medium hover:underline inline-flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มเสื้อผ้า</span>
            </Link>
          </div>

          {isLoadingWardrobe ? (
            <div className="flex items-center gap-2 text-xs text-muted">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>กำลังโหลดข้อมูลตู้เสื้อผ้า...</span>
            </div>
          ) : wardrobeFetchError ? (
            <div className="text-xs text-danger font-medium flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>{wardrobeFetchError}</span>
            </div>
          ) : wardrobeItems.length === 0 ? (
            <div className="text-xs text-muted space-y-2">
              <p>ยังไม่มีรายการเสื้อผ้าในตู้ส่วนตัว หรือเสื้อผ้าทั้งหมดถูกส่งซัก/เก็บไว้</p>
              <Link href="/account/wardrobe/new" className="inline-block px-4 py-2 bg-charcoal text-white text-xs font-medium">
                + เพิ่มเสื้อผ้าชิ้นแรก
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted">
                พบเสื้อผ้าพร้อมใส่ {wardrobeItems.length} ชิ้น (คลิกเพื่อยกเว้นชิ้นที่ไม่ต้องการใส่ในวันนี้):
              </p>
              <div className="flex flex-wrap gap-2">
                {wardrobeItems.map((item) => {
                  const isExcluded = excludedIds.has(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleExcludeItem(item.id)}
                      className={`px-2.5 py-1 text-xs border transition-colors flex items-center gap-1.5 ${
                        isExcluded
                          ? "bg-background text-muted border-line line-through opacity-60"
                          : "bg-paper text-charcoal border-olive/40 hover:border-charcoal"
                      }`}
                    >
                      <span>{item.name || item.item_type}</span>
                      {isExcluded ? <span className="text-[10px] text-danger">(เว้น)</span> : <Check className="w-3 h-3 text-olive" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_340px] gap-10 items-start">
        {/* Main 6-Step Guided Form */}
        <form className="space-y-6" onSubmit={handleSubmit(submit)}>
          {/* Step 1: วันนี้ไปไหน */}
          <div className="p-6 sm:p-8 bg-paper border border-line space-y-4">
            <div className="flex items-center gap-3 border-b border-line pb-3">
              <span className="font-mono text-xs text-muted">01 / OCCASION</span>
              <h2 className="font-serif text-xl text-charcoal">วันนี้ไปไหน?</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1">กิจกรรมวันนี้ *</label>
                <select className="w-full p-3 bg-background border border-line text-sm focus:border-charcoal focus:outline-none" {...register("activity", { required: "กรุณาเลือกกิจกรรม" })}>
                  <option value="">เลือกกิจกรรม</option>
                  {activities.map((act) => <option key={act} value={act}>{act}</option>)}
                </select>
                {errors.activity ? <small className="text-xs text-danger mt-1 block">{errors.activity.message}</small> : null}
              </div>
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1">ระดับความเป็นทางการ</label>
                <select className="w-full p-3 bg-background border border-line text-sm focus:border-charcoal focus:outline-none" {...register("formality")}>
                  <option value="casual">ลำลอง (Casual)</option>
                  <option value="smart_casual">Smart Casual</option>
                  <option value="formal">ทางการ (Formal)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Step 2: อากาศและช่วงเวลา */}
          <div className="p-6 sm:p-8 bg-paper border border-line space-y-4">
            <div className="flex items-center gap-3 border-b border-line pb-3">
              <span className="font-mono text-xs text-muted">02 / ENVIRONMENT</span>
              <h2 className="font-serif text-xl text-charcoal">อากาศและช่วงเวลา</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1">สภาพอากาศ / อุณหภูมิ *</label>
                <input className="w-full p-3 bg-background border border-line text-sm focus:border-charcoal focus:outline-none" placeholder="เช่น 32°C ร้อนชื้น มีแดด" {...register("weather", { required: "กรุณาระบุสภาพอากาศ" })} />
                {errors.weather ? <small className="text-xs text-danger mt-1 block">{errors.weather.message}</small> : null}
              </div>
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1">ช่วงเวลา</label>
                <select className="w-full p-3 bg-background border border-line text-sm focus:border-charcoal focus:outline-none" {...register("timeOfDay")}>
                  <option value="all_day">ทั้งวัน (All Day)</option>
                  <option value="morning">ช่วงเช้า</option>
                  <option value="afternoon">ช่วงบ่าย</option>
                  <option value="evening">ช่วงเย็น / ค่ำ</option>
                </select>
              </div>
            </div>
          </div>

          {/* Step 3: สไตล์และสี */}
          <div className="p-6 sm:p-8 bg-paper border border-line space-y-4">
            <div className="flex items-center gap-3 border-b border-line pb-3">
              <span className="font-mono text-xs text-muted">03 / PALETTE & STYLE</span>
              <h2 className="font-serif text-xl text-charcoal">สไตล์และโทนสี</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1">สไตล์ที่ชอบ (คั่นด้วยจุลภาค)</label>
                <input className="w-full p-3 bg-background border border-line text-sm focus:border-charcoal focus:outline-none" placeholder="เช่น Minimal, Workwear, Relaxed" {...register("preferredStyles")} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1">สีที่ชอบ</label>
                  <input className="w-full p-3 bg-background border border-line text-sm focus:border-charcoal focus:outline-none" placeholder="เช่น ขาว, เขียวมะกอก, กรมท่า" {...register("preferredColors")} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1">สีที่ไม่อยากใส่</label>
                  <input className="w-full p-3 bg-background border border-line text-sm focus:border-charcoal focus:outline-none" placeholder="เช่น ส้มสด, นีออน" {...register("avoidedColors")} />
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: รูปร่างและทรงเสื้อผ้า */}
          <div className="p-6 sm:p-8 bg-paper border border-line space-y-4">
            <div className="flex items-center gap-3 border-b border-line pb-3">
              <span className="font-mono text-xs text-muted">04 / PROPORTION & FIT</span>
              <h2 className="font-serif text-xl text-charcoal">รูปร่างและทรงเสื้อผ้า</h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1">ส่วนสูง (ซม.)</label>
                <input type="number" min={80} max={260} className="w-full p-3 bg-background border border-line text-sm focus:border-charcoal focus:outline-none" placeholder="170" {...register("heightCm")} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1">น้ำหนัก (กก.)</label>
                <input type="number" min={20} max={350} step="0.1" className="w-full p-3 bg-background border border-line text-sm focus:border-charcoal focus:outline-none" placeholder="62" {...register("weightKg")} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1">ทรงที่ชอบ</label>
                <select className="w-full p-3 bg-background border border-line text-sm focus:border-charcoal focus:outline-none" {...register("preferredFit")}>
                  <option value="unspecified">ไม่ระบุ</option>
                  <option value="fitted">พอดีตัว (Fitted)</option>
                  <option value="relaxed">ทรงสบาย (Relaxed / Oversized)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Step 5: ชิ้นหลักและหมายเหตุ */}
          <div className="p-6 sm:p-8 bg-paper border border-line space-y-4">
            <div className="flex items-center gap-3 border-b border-line pb-3">
              <span className="font-mono text-xs text-muted">05 / ANCHOR & BUDGET</span>
              <h2 className="font-serif text-xl text-charcoal">ชิ้นหลักที่มีอยู่ & หมายเหตุ</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1">ชิ้นที่อยากใช้เป็นหลัก (Anchor Item)</label>
                <textarea rows={2} className="w-full p-3 bg-background border border-line text-sm resize-none focus:border-charcoal focus:outline-none" placeholder="เช่น อยากใส่กางเกงยีนส์ตัวโปรดเป็นหลัก" {...register("anchorItem")} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1">หมายเหตุเพิ่มเติม</label>
                <textarea rows={2} className="w-full p-3 bg-background border border-line text-sm resize-none focus:border-charcoal focus:outline-none" placeholder="เช่น เดินทางไกล, ต้องอยู่ในห้องแอร์เย็น" {...register("notes")} />
              </div>
            </div>
          </div>

          {error ? (
            <div className="p-4 bg-danger/10 border border-danger/30 text-danger text-sm flex items-center gap-2" role="alert">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <button
            className="w-full py-4 bg-charcoal text-white hover:bg-black font-medium text-sm rounded-none transition-colors flex items-center justify-center gap-2"
            disabled={isSubmitting || !configured || (mode === "wardrobe" && wardrobeItems.length < 2)}
            type="submit"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>AI กำลังประมวลผลจัดลุค 3 ทางเลือก…</span>
              </>
            ) : (
              <span>
                {mode === "wardrobe" ? "จัดชุดจากตู้เสื้อผ้า 3 ทางเลือก" : "สร้างคำแนะนำ 3 ชุดสำหรับวันนี้"}
              </span>
            )}
          </button>
        </form>

        {/* Side panel */}
        <aside className="space-y-6 sticky top-24">
          <div className="p-6 bg-paper border border-line space-y-4 text-sm">
            <h3 className="font-serif text-xl font-normal border-b border-line pb-3 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-olive" />
              <span>หลักการของ AI Stylist</span>
            </h3>
            <div className="space-y-3 text-xs text-muted leading-relaxed">
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-olive shrink-0 mt-0.5" />
                <span><strong>เป็นกลาง 100%:</strong> ไม่มีโฆษณาแอบแฝงในคำแนะนำ</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-olive shrink-0 mt-0.5" />
                <span><strong>ใช้เสื้อผ้าที่คุณมีจริง:</strong> ในโหมดตู้เสื้อผ้า ระบบจะเลือกจากชุดที่คุณเป็นเจ้าของเท่านั้น</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-olive shrink-0 mt-0.5" />
                <span><strong>3 ทิศทางชัดเจน:</strong> ใส่ง่าย (Safe), แต่งขึ้น (Elevated), สบาย (Comfortable)</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Results Section */}
      <section id="stylist-results" className="mt-16 pt-12 border-t border-line scroll-mt-24" aria-live="polite">
        {isSubmitting ? (
          <div className="space-y-6 animate-pulse">
            <div className="h-8 bg-line/40 rounded w-1/3"></div>
            <div className="grid md:grid-cols-3 gap-6 mt-8">
              <div className="h-96 bg-paper border border-line p-6"></div>
              <div className="h-96 bg-paper border border-line p-6"></div>
              <div className="h-96 bg-paper border border-line p-6"></div>
            </div>
          </div>
        ) : null}

        {/* Render General Results */}
        {generalResult ? (
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
          </div>
        ) : null}

        {/* Render Wardrobe Mode Results */}
        {wardrobeResult ? (
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

                      {/* Items Grid with Private Images */}
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

                      {/* Missing Items if any */}
                      {outfit.missingItems?.length > 0 && (
                        <div className="p-3 border border-warning/30 bg-warning/10 text-xs space-y-1">
                          <span className="font-medium text-warning block">ชิ้นที่แนะนำเพิ่ม (ไม่มีในตู้):</span>
                          {outfit.missingItems.map((m, mIdx) => (
                            <div key={mIdx} className="text-muted">
                              • {m.role}: {m.description}
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-muted leading-relaxed pt-2">{outfit.reason}</p>
                    </div>

                    <div className="pt-4 border-t border-line space-y-2 text-xs">
                      <p className="text-muted flex items-start gap-2">
                        <Info className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{outfit.comfortNote}</span>
                      </p>
                      <strong className="block text-sm text-charcoal font-medium pt-1">{outfit.estimatedBudgetText}</strong>
                    </div>
                  </article>
                );
              })}
            </div>

            {wardrobeResult.generalTips?.length > 0 && (
              <div className="p-8 bg-paper border border-line space-y-4">
                <h3 className="font-serif text-2xl font-normal">คำแนะนำเพิ่มเติมในการแมตช์ชุด</h3>
                <ul className="grid sm:grid-cols-2 gap-3 text-sm text-muted list-disc list-inside">
                  {wardrobeResult.generalTips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
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
