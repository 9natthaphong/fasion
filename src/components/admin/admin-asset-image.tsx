"use client";

import Image from "next/image";
import { useState } from "react";
import { isProtectedAssetUrl } from "@/lib/protected-assets";

const loadFailureMessage = "ไม่สามารถโหลดรูปต้นฉบับได้ กรุณาลองใหม่หรือติดต่อร้านค้า";

export function AdminAssetImage({
  src,
  alt,
  className,
  sizes,
  fill,
  width,
  height,
  priority,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const protectedAsset = isProtectedAssetUrl(src);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={`${alt}: ${loadFailureMessage}`}
        className={`${fill ? "absolute inset-0" : ""} flex min-h-24 flex-col items-center justify-center gap-2 bg-charcoal p-4 text-center text-[11px] text-paper ${className ?? ""}`}
      >
        <p>{loadFailureMessage}</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            className="border border-white/50 px-2 py-1 hover:border-white"
            onClick={() => setFailed(false)}
          >
            ลองใหม่
          </button>
          {protectedAsset ? (
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-white/50 px-2 py-1 hover:border-white"
            >
              เปิดต้นฉบับ
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      sizes={sizes}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      priority={priority}
      unoptimized={protectedAsset}
      onError={() => setFailed(true)}
    />
  );
}
