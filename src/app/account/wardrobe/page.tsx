import Link from "next/link";
import { Plus, Filter, Heart, Shirt, Sparkles } from "lucide-react";
import { requireCustomerExperiencePage } from "@/lib/auth";
import { getWardrobeItems } from "@/lib/wardrobe";
import { WardrobeItemCard } from "@/components/wardrobe/wardrobe-item-card";
import { WardrobeInsightsPanel } from "@/components/wardrobe/wardrobe-insights-panel";
import { parseWardrobeFilters } from "@/lib/wardrobe-filters";
import { getCustomerEntitlements } from "@/lib/entitlements";
import type { WardrobeItemType, WardrobeAvailabilityStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    type?: string;
    status?: string;
    favorite?: string;
  }>;
}

export default async function WardrobePage({ searchParams }: PageProps) {
  const user = await requireCustomerExperiencePage("/login/customer");
  const params = await searchParams;

  const filters = parseWardrobeFilters(params);
  const {
    type: currentType,
    status: currentStatus,
    favoriteOnly,
  } = filters;

  const [allItems, items, entitlements] = await Promise.all([
    getWardrobeItems(user.id, {}),
    filters.invalid
      ? Promise.resolve([])
      : getWardrobeItems(user.id, {
          type: currentType,
          status: currentStatus,
          favoriteOnly,
        }),
    getCustomerEntitlements(user.id, user.role),
  ]);

  const isPro = entitlements.isProActive;

  const categories: { key: WardrobeItemType | "all"; label: string }[] = [
    { key: "all", label: "ทั้งหมด" },
    { key: "top", label: "เสื้อ" },
    { key: "bottom", label: "กางเกง" },
    { key: "skirt", label: "กระโปรง" },
    { key: "dress", label: "ชุดเดรส" },
    { key: "outerwear", label: "เสื้อคลุม/แจ็กเก็ต" },
    { key: "shoes", label: "รองเท้า" },
    { key: "bag", label: "กระเป๋า" },
    { key: "accessory", label: "เครื่องประดับ" },
  ];

  const statusFilters: { key: WardrobeAvailabilityStatus | "all"; label: string }[] = [
    { key: "all", label: "ทุกสถานะ" },
    { key: "available", label: "พร้อมใส่" },
    { key: "laundry", label: "อยู่ในตะกร้าซัก" },
    { key: "archived", label: "เก็บไว้ก่อน" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="editorial-workflow-header flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-muted uppercase">
            <Shirt className="w-4 h-4 text-olive" />
            <span>Personal Closet</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-charcoal mt-1">
            ตู้เสื้อผ้าของฉัน
          </h1>
          <p className="text-sm text-muted mt-1">
            บันทึกเสื้อผ้าส่วนตัว ให้ AI จัดลุค 3 ทิศทางจากชุดที่คุณมีอยู่จริง
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/ai-stylist?mode=wardrobe"
            className="px-5 py-3 border border-line text-charcoal hover:bg-paper font-medium text-xs rounded-none transition-colors inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-olive" />
            <span>จัดชุดจากตู้เสื้อผ้า</span>
          </Link>
          <Link
            href="/account/wardrobe/new"
            className="px-5 py-3 bg-charcoal text-background hover:bg-olive font-medium text-xs rounded-none transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่มเสื้อผ้าใหม่</span>
          </Link>
        </div>
      </div>

      {/* Wardrobe Insights Intelligence Panel */}
      <WardrobeInsightsPanel items={allItems} isPro={isPro} />

      {/* Filter Toolbar */}
      <div className="space-y-4 bg-paper border border-line p-4 sm:p-5">
        <div className="flex items-center gap-2 text-xs font-mono text-muted uppercase">
          <Filter className="w-3.5 h-3.5" />
          <span>ตัวกรองเสื้อผ้า</span>
        </div>

        {/* Category Chips */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const isActive = currentType === cat.key;
            const nextParams = new URLSearchParams();
            if (cat.key !== "all") nextParams.set("type", cat.key);
            if (currentStatus !== "all") nextParams.set("status", currentStatus);
            if (favoriteOnly) nextParams.set("favorite", "true");
            const href = `/account/wardrobe?${nextParams.toString()}`;

            return (
              <Link
                key={cat.key}
                href={href}
                className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                  isActive
                    ? "bg-charcoal text-background border-charcoal"
                    : "bg-background text-charcoal border-line hover:border-charcoal"
                }`}
              >
                {cat.label}
              </Link>
            );
          })}
        </div>

        {/* Status & Favorite Filter */}
        <div className="pt-3 border-t border-line flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-muted font-medium">สถานะ:</span>
            {statusFilters.map((s) => {
              const isActive = currentStatus === s.key;
              const nextParams = new URLSearchParams();
              if (currentType !== "all") nextParams.set("type", currentType);
              if (s.key !== "all") nextParams.set("status", s.key);
              if (favoriteOnly) nextParams.set("favorite", "true");
              const href = `/account/wardrobe?${nextParams.toString()}`;

              return (
                <Link
                  key={s.key}
                  href={href}
                  className={`px-2.5 py-1 rounded-none font-medium transition-colors ${
                    isActive
                      ? "bg-charcoal text-background"
                      : "text-muted hover:text-charcoal"
                  }`}
                >
                  {s.label}
                </Link>
              );
            })}
          </div>

          <div>
            {(() => {
              const nextParams = new URLSearchParams();
              if (currentType !== "all") nextParams.set("type", currentType);
              if (currentStatus !== "all") nextParams.set("status", currentStatus);
              if (!favoriteOnly) nextParams.set("favorite", "true");
              const href = `/account/wardrobe?${nextParams.toString()}`;

              return (
                <Link
                  href={href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 border transition-colors ${
                    favoriteOnly
                      ? "bg-danger/10 border-danger text-danger"
                      : "border-line text-muted hover:text-charcoal"
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${favoriteOnly ? "fill-current" : ""}`} />
                  <span>เฉพาะที่ถูกใจ</span>
                </Link>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Grid or Empty State */}
      {items.length === 0 ? (
        <div className="text-center py-16 border border-line bg-paper space-y-4 p-8">
          <div className="w-16 h-16 rounded-full bg-background border border-line mx-auto flex items-center justify-center text-muted">
            <Shirt className="w-8 h-8 text-muted" />
          </div>
          <h2 className="font-serif text-2xl font-normal text-charcoal">ยังไม่มีรายการเสื้อผ้าในหมวดนี้</h2>
          <p className="text-sm text-muted max-w-md mx-auto">
            ถ่ายรูปหรืออัปโหลดเสื้อผ้าชิ้นโปรด เพื่อให้ AI ช่วยจัดลุค 3 ทางเลือกจากชุดที่คุณมีอยู่จริง
          </p>
          <div className="pt-2">
            <Link
              href="/account/wardrobe/new"
              className="px-6 py-3 bg-charcoal text-background hover:bg-olive font-medium text-xs rounded-none transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มเสื้อผ้าชิ้นแรก</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <WardrobeItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
