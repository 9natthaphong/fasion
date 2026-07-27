"use client";

import { useEffect } from "react";

export function ShopViewBeacon({ shopId, disabled = false }: { shopId: string; disabled?: boolean }) {
  useEffect(() => {
    if (!disabled) navigator.sendBeacon("/api/events/shop-view", new Blob([JSON.stringify({ shopId })], { type: "application/json" }));
  }, [disabled, shopId]);
  return null;
}
