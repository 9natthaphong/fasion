import { Sparkles, Info } from "lucide-react";
import type { WardrobeItem } from "@/lib/types";

interface Props {
  items: WardrobeItem[];
}

export function WardrobeInsightsPanel({ items }: Props) {
  if (items.length === 0) return null;

  const total = items.length;
  const availableCount = items.filter((i) => i.availability_status === "available").length;
  const laundryCount = items.filter((i) => i.availability_status === "laundry").length;
  const archivedCount = items.filter((i) => i.availability_status === "archived").length;

  // Category counts
  const categoryCounts: Record<string, number> = {};
  for (const item of items) {
    categoryCounts[item.item_type] = (categoryCounts[item.item_type] || 0) + 1;
  }

  // Color counts
  const colorCounts: Record<string, number> = {};
  for (const item of items) {
    for (const color of item.primary_colors || []) {
      colorCounts[color] = (colorCounts[color] || 0) + 1;
    }
  }

  const topColors = Object.entries(colorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([color]) => color);

  // Compute Gap Insight (Non-judgmental)
  let gapInsight: string | null = null;
  const topCount = categoryCounts["top"] || 0;
  const bottomCount = (categoryCounts["bottom"] || 0) + (categoryCounts["skirt"] || 0);
  const shoesCount = categoryCounts["shoes"] || 0;

  if (topCount >= 3 && shoesCount === 0) {
    gapInsight = "คุณมีเสื้อผ้าท่อนบนหลายชิ้น แต่ยังไม่มีรองเท้าในตู้เสื้อผ้าส่วนตัว เพิ่มรองเท้าสักคู่เพื่อความสมบูรณ์ในการจัดลุค";
  } else if (topCount >= 4 && bottomCount <= 1) {
    gapInsight = "คุณมีเสื้อหลายตัว แต่กางเกง/กระโปรงพร้อมใส่มีเพียงชิ้นเดียว";
  } else if (laundryCount > 0 && laundryCount >= availableCount) {
    gapInsight = `มีเสื้อผ้าอยู่ในตะกร้าซัก ${laundryCount} ชิ้น ย้ายกลับมาสถานะพร้อมใส่เมื่อซักเสร็จแล้วเพื่อความหลากหลายในการแมตช์ชุด`;
  }

  return (
    <div className="border border-line bg-paper p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex items-center gap-2 text-xs font-mono text-charcoal font-semibold uppercase">
          <Sparkles className="w-4 h-4 text-olive" />
          <span>Wardrobe Intelligence & Insights</span>
        </div>
        <span className="text-xs font-mono text-muted">รวมทั้งหมด {total} ชิ้น</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="p-3 bg-background border border-line space-y-1">
          <span className="text-muted block">พร้อมใส่ (Available)</span>
          <strong className="text-lg font-serif text-charcoal font-normal">{availableCount} ชิ้น</strong>
        </div>

        <div className="p-3 bg-background border border-line space-y-1">
          <span className="text-muted block">อยู่ในตะกร้าซัก (Laundry)</span>
          <strong className="text-lg font-serif text-warning font-normal">{laundryCount} ชิ้น</strong>
        </div>

        <div className="p-3 bg-background border border-line space-y-1">
          <span className="text-muted block">เก็บไว้ก่อน (Archived)</span>
          <strong className="text-lg font-serif text-muted font-normal">{archivedCount} ชิ้น</strong>
        </div>

        <div className="p-3 bg-background border border-line space-y-1">
          <span className="text-muted block">โทนสีหลักในตู้</span>
          <div className="flex flex-wrap gap-1 pt-0.5">
            {topColors.map((color) => (
              <span key={color} className="px-1.5 py-0.5 bg-paper border border-line text-[10px] text-charcoal font-medium">
                {color}
              </span>
            ))}
          </div>
        </div>
      </div>

      {gapInsight && (
        <div className="p-3 border border-olive/30 bg-olive-pale/30 text-xs flex items-start gap-2">
          <Info className="w-4 h-4 text-olive shrink-0 mt-0.5" />
          <div>
            <strong className="block text-charcoal font-medium">ข้อแนะนำสำหรับตู้เสื้อผ้าของคุณ:</strong>
            <p className="text-muted leading-relaxed mt-0.5">{gapInsight}</p>
          </div>
        </div>
      )}
    </div>
  );
}
