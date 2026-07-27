"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart } from "lucide-react";
import type { WardrobeItem } from "@/lib/types";

interface Props {
  item: WardrobeItem;
}

const typeLabels: Record<string, string> = {
  top: "เสื้อ",
  bottom: "กางเกง",
  skirt: "กระโปรง",
  dress: "ชุดเดรส",
  outerwear: "เสื้อคลุม",
  shoes: "รองเท้า",
  bag: "กระเป๋า",
  accessory: "เครื่องประดับ",
};

const statusBadges: Record<string, { label: string; bg: string }> = {
  available: { label: "พร้อมใส่", bg: "bg-success/15 text-success border-success/30" },
  laundry: { label: "ส่งซัก", bg: "bg-warning/15 text-warning border-warning/30" },
  archived: { label: "เก็บไว้", bg: "bg-muted/15 text-muted border-line" },
};

export function WardrobeItemCard({ item }: Props) {
  const [isFav, setIsFav] = useState(item.is_favorite);
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUpdating) return;

    const nextFav = !isFav;
    setIsFav(nextFav);
    setIsUpdating(true);

    try {
      await fetch(`/api/wardrobe/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: nextFav }),
      });
    } catch {
      setIsFav(!nextFav);
    } finally {
      setIsUpdating(false);
    }
  };

  const badge = statusBadges[item.availability_status] ?? statusBadges.available;
  const imageSrc = item.signed_image_url || "/demo-assets/ad-linen-shirt.jpg";

  return (
    <Link
      href={`/account/wardrobe/${item.id}`}
      className="group block border border-line bg-paper p-4 space-y-3 hover:border-charcoal transition-all relative"
    >
      {/* Image Container */}
      <div className="aspect-[3/4] relative bg-background border border-line overflow-hidden">
        <Image
          src={imageSrc}
          alt={item.name || "เสื้อผ้าส่วนตัว"}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Favorite Action Button */}
        <button
          type="button"
          onClick={toggleFavorite}
          aria-label={isFav ? "ยกเลิกการถูกใจ" : "ถูกใจเสื้อผ้าชิ้นนี้"}
          className="absolute top-2.5 right-2.5 p-2 bg-background/90 backdrop-blur-sm border border-line text-charcoal hover:bg-white transition-colors z-10"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFav ? "fill-danger text-danger" : "text-muted group-hover:text-charcoal"
            }`}
          />
        </button>

        {/* Status Badge */}
        <div className="absolute bottom-2.5 left-2.5">
          <span className={`px-2 py-0.5 text-[10px] font-mono font-medium border ${badge.bg}`}>
            {badge.label}
          </span>
        </div>
      </div>

      {/* Item Info */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted">
          <span className="font-mono uppercase">{typeLabels[item.item_type] ?? item.item_type}</span>
          {item.subcategory && <span>{item.subcategory}</span>}
        </div>

        <h3 className="font-serif text-lg font-normal text-charcoal group-hover:underline decoration-1 underline-offset-4 line-clamp-1">
          {item.name || "เสื้อผ้าไม่มีชื่อ"}
        </h3>

        {/* Color & Style Tags */}
        <div className="flex flex-wrap gap-1 pt-1">
          {item.primary_colors?.slice(0, 3).map((color) => (
            <span key={color} className="px-1.5 py-0.5 text-[10px] bg-background border border-line text-muted">
              {color}
            </span>
          ))}
          {item.styles?.slice(0, 2).map((style) => (
            <span key={style} className="px-1.5 py-0.5 text-[10px] bg-olive/10 text-olive">
              {style}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
