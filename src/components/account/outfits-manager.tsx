"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Calendar, ThumbsUp, ThumbsDown, Check, Sparkles, Shirt, MessageSquare, Trash2, History } from "lucide-react";
import type { SavedOutfit, WearLog, AIHistoryItem } from "@/lib/types";

interface Props {
  initialAIHistory: AIHistoryItem[];
  initialSavedOutfits: SavedOutfit[];
  initialWearLogs: WearLog[];
}

export function OutfitsManager({ initialAIHistory, initialSavedOutfits, initialWearLogs }: Props) {
  const [activeTab, setActiveTab] = useState<"history" | "saved" | "wear_logs">("history");
  const [aiHistory, setAiHistory] = useState<AIHistoryItem[]>(initialAIHistory);
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>(initialSavedOutfits);
  const [wearLogs, setWearLogs] = useState<WearLog[]>(initialWearLogs);

  // Wear Log Modal state
  const [selectedOutfit, setSelectedOutfit] = useState<SavedOutfit | null>(null);
  const [wornDate, setWornDate] = useState(new Date().toISOString().split("T")[0]);
  const [occasion, setOccasion] = useState("");
  const [comfortRating, setComfortRating] = useState<number>(5);
  const [confidenceRating, setConfidenceRating] = useState<number>(5);
  const [wearNotes, setWearNotes] = useState("");
  const [isRecordingWear, setIsRecordingWear] = useState(false);

  // Feedback State
  const [feedbackOutfitId, setFeedbackOutfitId] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<"liked" | "neutral" | "disliked">("liked");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const [msg, setMsg] = useState<string | null>(null);

  const handleDeleteHistoryItem = async (id: string) => {
    if (!confirm("คุณต้องการลบประวัติการขอคำแนะนำรายการนี้หรือไม่?")) return;

    try {
      const res = await fetch(`/api/account/outfits/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ลบประวัติไม่สำเร็จ");

      setAiHistory(aiHistory.filter((h) => h.id !== id));
      setMsg("ลบประวัติคำแนะนำเรียบร้อยแล้ว");
    } catch (err) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการลบประวัติ");
    }
  };

  const handleSaveOutfitFromHistory = async (
    outfit: {
      name: string;
      direction: string;
      reason?: string;
      items?: Array<{
        wardrobeItemId?: string;
        role?: string;
        stylingInstruction?: string;
        itemDetails?: { name?: string | null } | null;
      }>;
    },
    resultId?: string,
  ) => {
    try {
      const payload = {
        outfitResultId: resultId ?? null,
        name: outfit.name,
        direction: outfit.direction,
        notes: outfit.reason ?? null,
        isFavorite: true,
        items: (outfit.items || []).map((i, idx) => ({
          wardrobeItemId: i.wardrobeItemId ?? null,
          itemRole: i.role || "clothing",
          itemDescription: i.itemDetails?.name || i.role || "เสื้อผ้าส่วนตัว",
          stylingInstruction: i.stylingInstruction ?? null,
          sortOrder: idx,
        })),
      };

      const res = await fetch("/api/account/outfits/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "บันทึกชุดไม่สำเร็จ");

      setSavedOutfits([data.outfit, ...savedOutfits]);
      setMsg(`บันทึกชุด "${outfit.name}" เรียบร้อยแล้ว สามารถดูได้ที่แท็บ "ชุดที่บันทึก"`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึกชุด");
    }
  };

  const handleRecordWear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOutfit) return;

    setIsRecordingWear(true);
    setMsg(null);

    try {
      const res = await fetch("/api/account/outfits/wear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          savedOutfitId: selectedOutfit.id,
          wornOn: wornDate,
          occasion: occasion.trim() || null,
          comfortRating,
          confidenceRating,
          notes: wearNotes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "บันทึกประวัติไม่สำเร็จ");

      setWearLogs([data.wearLog, ...wearLogs]);
      setSelectedOutfit(null);
      setMsg(`บันทึกการใส่ชุด "${selectedOutfit.name}" สำหรับวันที่ ${wornDate} เรียบร้อยแล้ว`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsRecordingWear(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackOutfitId) return;

    setIsSubmittingFeedback(true);
    try {
      const res = await fetch("/api/account/outfits/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outfitResultId: feedbackOutfitId,
          outfitIndex: 0,
          rating: feedbackRating,
          feedbackTags: selectedTags,
          comment: feedbackComment.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "ส่งข้อเสนอแนะไม่สำเร็จ");

      setFeedbackOutfitId(null);
      setMsg("ขอบคุณสำหรับข้อเสนอแนะ! ระบบจะนำไปปรับปรุงการจัดชุดในครั้งต่อไป");
    } catch (err) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const toggleFeedbackTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <div className="space-y-8">
      {/* Navigation Tabs */}
      <div className="flex border-b border-line overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "history"
              ? "border-charcoal text-charcoal font-semibold"
              : "border-transparent text-muted hover:text-charcoal"
          }`}
        >
          <History className="w-4 h-4" />
          <span>ประวัติ AI Stylist ({aiHistory.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("saved")}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "saved"
              ? "border-charcoal text-charcoal font-semibold"
              : "border-transparent text-muted hover:text-charcoal"
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>ชุดที่บันทึกไว้ ({savedOutfits.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("wear_logs")}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "wear_logs"
              ? "border-charcoal text-charcoal font-semibold"
              : "border-transparent text-muted hover:text-charcoal"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>ประวัติการใส่ชุด ({wearLogs.length})</span>
        </button>
      </div>

      {msg && (
        <div className="p-4 border border-success/30 bg-success/10 text-success text-xs font-medium flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{msg}</span>
          </div>
          <button type="button" onClick={() => setMsg(null)} className="text-xs text-muted hover:text-charcoal">ปิด</button>
        </div>
      )}

      {/* Tab 1: AI History */}
      {activeTab === "history" && (
        <div>
          {aiHistory.length === 0 ? (
            <div className="text-center py-16 border border-line bg-paper space-y-4 p-8">
              <div className="w-16 h-16 rounded-full bg-background border border-line mx-auto flex items-center justify-center text-muted">
                <History className="w-8 h-8 text-muted" />
              </div>
              <h2 className="font-serif text-2xl font-normal text-charcoal">ยังไม่มีประวัติคำแนะนำ AI</h2>
              <p className="text-sm text-muted max-w-md mx-auto">
                ลองขอคำแนะนำแต่งชุดจาก AI Stylist เพื่อเริ่มเก็บบันทึกประวัติของคุณ
              </p>
              <div className="pt-2">
                <Link
                  href="/ai-stylist"
                  className="px-6 py-3 bg-charcoal text-white hover:bg-black text-xs font-medium inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>ลองเปิดใช้งาน AI Stylist</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {aiHistory.map((item) => {
                const activity = String(item.input_data.activity || "ไม่ระบุกิจกรรม");
                const weather = String(item.input_data.weather || "ไม่ระบุอากาศ");
                const formattedDate = new Date(item.created_at).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div key={item.id} className="border border-line bg-paper p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-line pb-3 gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[11px] font-mono text-muted block">{formattedDate}</span>
                        <h3 className="font-serif text-xl font-normal text-charcoal">
                          กิจกรรม: {activity} ({weather})
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteHistoryItem(item.id)}
                        className="text-xs text-danger/80 hover:text-danger inline-flex items-center gap-1 self-start sm:self-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>ลบประวัตินี้</span>
                      </button>
                    </div>

                    {item.result?.summary && (
                      <p className="text-xs text-muted leading-relaxed">{item.result.summary}</p>
                    )}

                    {/* 3 Outfit Directions */}
                    {item.result?.outfits && item.result.outfits.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                        {item.result.outfits.map((outfit, idx) => (
                          <div key={idx} className="p-4 border border-line bg-background space-y-3 flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono uppercase bg-olive/10 text-olive px-2 py-0.5 font-medium">
                                  {outfit.direction}
                                </span>
                                <span className="text-[11px] font-mono text-muted">{outfit.style}</span>
                              </div>
                              <h4 className="font-serif text-lg font-normal text-charcoal">{outfit.name}</h4>
                              <p className="text-xs text-muted line-clamp-3">{outfit.reason}</p>
                            </div>

                            <div className="pt-3 border-t border-line flex items-center justify-between text-xs">
                              <button
                                type="button"
                                onClick={() => handleSaveOutfitFromHistory(outfit, item.result?.id)}
                                className="text-olive font-medium hover:underline inline-flex items-center gap-1"
                              >
                                <Heart className="w-3.5 h-3.5" />
                                <span>บันทึกชุดนี้</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setFeedbackOutfitId(item.result?.id || item.id)}
                                className="text-muted hover:text-charcoal inline-flex items-center gap-1"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>ส่งความเห็น</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Saved Outfits */}
      {activeTab === "saved" && (
        <div>
          {savedOutfits.length === 0 ? (
            <div className="text-center py-16 border border-line bg-paper space-y-4 p-8">
              <div className="w-16 h-16 rounded-full bg-background border border-line mx-auto flex items-center justify-center text-muted">
                <Shirt className="w-8 h-8 text-muted" />
              </div>
              <h2 className="font-serif text-2xl font-normal text-charcoal">ยังไม่มีชุดที่บันทึกไว้</h2>
              <p className="text-sm text-muted max-w-md mx-auto">
                กดบันทึกชุดที่ AI Stylist แนะนำเพื่อเก็บไว้ใช้แต่งตัวในวันถัดไป
              </p>
              <div className="pt-2">
                <Link
                  href="/ai-stylist"
                  className="px-6 py-3 bg-charcoal text-white hover:bg-black text-xs font-medium inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>เปิด AI Stylist</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedOutfits.map((outfit) => (
                <div key={outfit.id} className="border border-line bg-paper p-6 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-line pb-2">
                      <span className="text-[10px] font-mono uppercase bg-olive/10 text-olive px-2 py-0.5 font-medium">
                        {outfit.direction}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedOutfit(outfit)}
                        className="text-xs text-olive font-medium hover:underline inline-flex items-center gap-1"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>ใส่ชุดนี้วันนี้</span>
                      </button>
                    </div>

                    <h3 className="font-serif text-xl font-normal text-charcoal">{outfit.name}</h3>
                    {outfit.notes && <p className="text-xs text-muted">{outfit.notes}</p>}

                    {/* Items List */}
                    <div className="space-y-2 pt-2 border-t border-line/60 text-xs">
                      {outfit.items?.map((item) => (
                        <div key={item.id} className="flex items-start justify-between">
                          <span className="font-mono text-muted uppercase shrink-0 w-20">{item.item_role}:</span>
                          <span className="font-medium text-charcoal text-right flex-1">{item.item_description || "เสื้อผ้าส่วนตัว"}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-line flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => setFeedbackOutfitId(outfit.outfit_result_id || outfit.id)}
                      className="text-muted hover:text-charcoal inline-flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>ให้ข้อเสนอแนะ</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Wear Logs */}
      {activeTab === "wear_logs" && (
        <div>
          {wearLogs.length === 0 ? (
            <div className="text-center py-16 border border-line bg-paper space-y-4 p-8">
              <div className="w-16 h-16 rounded-full bg-background border border-line mx-auto flex items-center justify-center text-muted">
                <Calendar className="w-8 h-8 text-muted" />
              </div>
              <h2 className="font-serif text-2xl font-normal text-charcoal">ยังไม่มีประวัติการใส่ชุด</h2>
              <p className="text-sm text-muted max-w-md mx-auto">
                กด &quot;ใส่ชุดนี้วันนี้&quot; ในหน้าชุดที่บันทึกไว้ เพื่อติดตามว่าใส่ชุดไหนไปแล้วกี่ครั้ง
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {wearLogs.map((log) => (
                <div key={log.id} className="border border-line bg-paper p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 text-xs text-muted">
                      <span className="font-mono text-charcoal font-semibold">{log.worn_on}</span>
                      {log.occasion && <span>โอกาส: {log.occasion}</span>}
                    </div>
                    {log.notes && <p className="text-sm text-charcoal">{log.notes}</p>}
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    {log.comfort_rating && (
                      <span className="bg-background border border-line px-2.5 py-1">
                        ความสบาย: {log.comfort_rating}/5
                      </span>
                    )}
                    {log.confidence_rating && (
                      <span className="bg-background border border-line px-2.5 py-1">
                        ความมั่นใจ: {log.confidence_rating}/5
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Wear Log Record Modal */}
      {selectedOutfit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleRecordWear} className="bg-background border border-line p-6 max-w-md w-full space-y-4">
            <h3 className="font-serif text-2xl font-normal text-charcoal">บันทึกการใส่ชุดวันนี้</h3>
            <p className="text-xs text-muted">ชุด: {selectedOutfit.name}</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">วันที่ใส่ *</label>
                <input
                  type="date"
                  value={wornDate}
                  onChange={(e) => setWornDate(e.target.value)}
                  className="w-full p-3 border border-line bg-background text-xs outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">โอกาส / กิจกรรมที่ไป</label>
                <input
                  type="text"
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  placeholder="เช่น ไปทำงาน, ไปคาเฟ่กับเพื่อน"
                  className="w-full p-3 border border-line bg-background text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-charcoal mb-1">ความสบาย (1-5)</label>
                  <select
                    value={comfortRating}
                    onChange={(e) => setComfortRating(Number(e.target.value))}
                    className="w-full p-3 border border-line bg-background text-xs outline-none"
                  >
                    <option value={5}>5 - สบายมาก</option>
                    <option value={4}>4 - สบายพอดี</option>
                    <option value={3}>3 - พอใช้ได้</option>
                    <option value={2}>2 - ไม่ค่อยสบาย</option>
                    <option value={1}>1 - อึดอัดมาก</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-charcoal mb-1">ความมั่นใจ (1-5)</label>
                  <select
                    value={confidenceRating}
                    onChange={(e) => setConfidenceRating(Number(e.target.value))}
                    className="w-full p-3 border border-line bg-background text-xs outline-none"
                  >
                    <option value={5}>5 - มั่นใจมาก</option>
                    <option value={4}>4 - มั่นใจดี</option>
                    <option value={3}>3 - ปานกลาง</option>
                    <option value={2}>2 - ไม่ค่อยมั่นใจ</option>
                    <option value={1}>1 - ไม่มั่นใจเลย</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">บันทึกส่วนตัว</label>
                <textarea
                  rows={2}
                  value={wearNotes}
                  onChange={(e) => setWearNotes(e.target.value)}
                  placeholder="เช่น ผ้าไม่ร้อน เดินสบายทั้งวัน"
                  className="w-full p-3 border border-line bg-background text-xs outline-none"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedOutfit(null)}
                className="px-4 py-2 border border-line text-xs hover:bg-paper"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isRecordingWear}
                className="px-5 py-2 bg-charcoal text-white text-xs font-medium hover:bg-black disabled:opacity-50"
              >
                {isRecordingWear ? "กำลังบันทึก..." : "บันทึกประวัติการใส่"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Outfit Feedback Modal */}
      {feedbackOutfitId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleFeedbackSubmit} className="bg-background border border-line p-6 max-w-md w-full space-y-4">
            <h3 className="font-serif text-2xl font-normal text-charcoal">ข้อเสนอแนะเกี่ยวกับชุดนี้</h3>
            <p className="text-xs text-muted">คำติชมของคุณจะถูกนำไปปรับปรุงการจัดชุดของ AI ในครั้งต่อๆ ไป</p>

            <div className="space-y-4">
              <div className="flex justify-center gap-3">
                {[
                  { rating: "liked", label: "ชอบมาก", icon: ThumbsUp },
                  { rating: "neutral", label: "ปานกลาง", icon: MessageSquare },
                  { rating: "disliked", label: "ไม่ชอบ", icon: ThumbsDown },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = feedbackRating === item.rating;
                  return (
                    <button
                      key={item.rating}
                      type="button"
                      onClick={() => setFeedbackRating(item.rating as "liked" | "neutral" | "disliked")}
                      className={`p-3 text-xs font-medium border text-center transition-colors flex items-center gap-1.5 ${
                        isActive
                          ? "bg-charcoal text-white border-charcoal"
                          : "bg-paper text-charcoal border-line hover:border-charcoal"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal mb-2">เหตุผล / แท็กข้อเสนอแนะ</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { tag: "comfortable", label: "ใส่สบายมาก" },
                    { tag: "too_formal", label: "ทางการเกินไป" },
                    { tag: "too_casual", label: "ลำลองเกินไป" },
                    { tag: "color_not_right", label: "โทนสีไม่เข้ากัน" },
                    { tag: "weather_not_right", label: "ไม่เหมาะกับอากาศ" },
                    { tag: "repeated_items", label: "ซ้ำกับชุดเดิม" },
                    { tag: "loved_the_style", label: "ชอบสไตล์นี้มาก" },
                  ].map((t) => {
                    const checked = selectedTags.includes(t.tag);
                    return (
                      <button
                        key={t.tag}
                        type="button"
                        onClick={() => toggleFeedbackTag(t.tag)}
                        className={`px-2.5 py-1 text-xs border font-medium transition-colors ${
                          checked
                            ? "bg-charcoal text-white border-charcoal"
                            : "bg-paper text-charcoal border-line hover:border-charcoal"
                        }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">ความคิดเห็นเพิ่มเติม</label>
                <textarea
                  rows={3}
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="เช่น อยากได้ชุดที่มีแจ็กเก็ตคลุมด้วย"
                  className="w-full p-3 border border-line bg-background text-xs outline-none"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setFeedbackOutfitId(null)}
                className="px-4 py-2 border border-line text-xs hover:bg-paper"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSubmittingFeedback}
                className="px-5 py-2 bg-charcoal text-white text-xs font-medium hover:bg-black disabled:opacity-50"
              >
                {isSubmittingFeedback ? "กำลังส่ง..." : "ส่งข้อเสนอแนะ"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
