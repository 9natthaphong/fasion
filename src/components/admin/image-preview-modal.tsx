"use client";

import { useState, useEffect } from "react";
import { Maximize2, X } from "lucide-react";
import { AdminAssetImage } from "@/components/admin/admin-asset-image";

export function ImagePreviewModal({
  src,
  alt,
  label,
}: {
  src: string;
  alt: string;
  label?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-2 text-[11px] text-olive font-medium inline-flex items-center gap-1 hover:underline focus:outline-none focus:ring-1 focus:ring-olive"
        aria-label={`ขยายดูภาพ ${label || alt}`}
      >
        <Maximize2 className="w-3 h-3" />
        <span>ขยายดูภาพ (Preview)</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`พรีวิวภาพ ${alt}`}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative max-w-4xl w-full bg-charcoal border border-line-dark p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-line-dark pb-3">
              <div>
                <p className="text-xs font-mono text-olive uppercase">{label || "Image Preview"}</p>
                <p className="text-sm font-medium text-paper">{alt}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-muted hover:text-white transition-colors"
                aria-label="ปิดพรีวิวภาพ"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative max-h-[70vh] flex items-center justify-center bg-black/40 p-2 overflow-hidden">
              <AdminAssetImage
                src={src}
                alt={alt}
                width={1200}
                height={1200}
                className="max-h-[65vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
