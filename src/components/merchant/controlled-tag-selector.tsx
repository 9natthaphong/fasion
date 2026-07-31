"use client";

import { useState } from "react";
import { Check, Search, Tag } from "lucide-react";
import type { FashionTag, FashionTagType } from "@/lib/types";

interface Props {
  allTags: FashionTag[];
  selectedTagIds: string[];
  onChange: (selectedIds: string[]) => void;
  allowedTypes?: FashionTagType[];
  label?: string;
}

export function ControlledTagSelector({
  allTags,
  selectedTagIds,
  onChange,
  allowedTypes,
  label = "แท็กสไตล์และความเหมาะ (Controlled Taxonomy)",
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTags = allTags.filter((t) => {
    if (allowedTypes && !allowedTypes.includes(t.tag_type)) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return t.name_th.toLowerCase().includes(q) || t.name_en.toLowerCase().includes(q) || t.slug.includes(q);
  });

  const toggleTag = (id: string) => {
    if (selectedTagIds.includes(id)) {
      onChange(selectedTagIds.filter((tId) => tId !== id));
    } else {
      onChange([...selectedTagIds, id]);
    }
  };

  // Group by tag type
  const typeLabels: Record<string, string> = {
    style: "สไตล์",
    occasion: "โอกาส / กิจกรรม",
    formality: "ระดับความเป็นทางการ",
    fit: "ความกระชับ / ทรง",
    weather: "สภาพอากาศ",
    color: "โทนสี",
  };

  const grouped: Record<string, FashionTag[]> = {};
  for (const tag of filteredTags) {
    if (!grouped[tag.tag_type]) grouped[tag.tag_type] = [];
    grouped[tag.tag_type].push(tag);
  }

  return (
    <div className="space-y-4 border border-line bg-paper p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
        <div className="flex items-center gap-2 text-xs font-mono text-charcoal font-semibold uppercase">
          <Tag className="w-4 h-4 text-olive" />
          <span>{label}</span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาแท็ก..."
            className="pl-8 pr-3 py-1.5 bg-background border border-line text-xs outline-none focus:border-charcoal"
          />
        </div>
      </div>

      <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
        {Object.entries(grouped).map(([typeKey, tagList]) => (
          <div key={typeKey} className="space-y-2">
            <span className="text-[11px] font-mono text-muted uppercase block font-semibold">
              {typeLabels[typeKey] || typeKey}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {tagList.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-2.5 py-1 text-xs border font-medium transition-colors inline-flex items-center gap-1 ${
                      isSelected
                        ? "bg-charcoal text-background border-charcoal"
                        : "bg-background text-charcoal border-line hover:border-charcoal"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    <span>{tag.name_th}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
