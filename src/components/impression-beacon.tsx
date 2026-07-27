"use client";

import { useEffect, useRef } from "react";

export function ImpressionBeacon({ adId, pageContext, disabled = false }: { adId: string; pageContext: string; disabled?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (disabled || !ref.current) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let sent = false;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5 && !sent) {
        timer = setTimeout(() => {
          sent = true;
          navigator.sendBeacon("/api/events/impression", new Blob([JSON.stringify({ adId, pageContext })], { type: "application/json" }));
          observer.disconnect();
        }, 1000);
      } else if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }, { threshold: [0.5] });
    observer.observe(ref.current);
    return () => { observer.disconnect(); if (timer) clearTimeout(timer); };
  }, [adId, disabled, pageContext]);
  return <span ref={ref} className="tracking-sentinel" aria-hidden />;
}
