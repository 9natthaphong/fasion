import { requirePageRole } from "@/lib/auth";
import { getAIHistory, getSavedOutfits, getWearLogs } from "@/lib/saved-outfits";
import { OutfitsManager } from "@/components/account/outfits-manager";
import { Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OutfitsPage() {
  const user = await requirePageRole(["customer"], "/login/customer");

  const [aiHistory, savedOutfits, wearLogs] = await Promise.all([
    getAIHistory(user.id),
    getSavedOutfits(user.id),
    getWearLogs(user.id),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-line pb-6">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-muted uppercase">
          <Sparkles className="w-4 h-4 text-olive" />
          <span>Saved Outfits, History & Wear Log</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-charcoal mt-1">
          ชุดที่บันทึกและประวัติการจัดชุด
        </h1>
        <p className="text-sm text-muted mt-1">
          ดูประวัติคำแนะนำของ AI Stylist, จัดเก็บชุดโปรด และติดตามสถิติการใส่เสื้อผ้า
        </p>
      </div>

      {/* Outfits Manager Component */}
      <OutfitsManager
        initialAIHistory={aiHistory}
        initialSavedOutfits={savedOutfits}
        initialWearLogs={wearLogs}
      />
    </div>
  );
}
