export function calculateCtr(clicks: number, impressions: number) {
  if (!Number.isFinite(clicks) || !Number.isFinite(impressions) || impressions <= 0) {
    return 0;
  }
  return Math.round((clicks / impressions) * 10_000) / 100;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("th-TH").format(value);
}

export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeZone: "Asia/Bangkok",
  }).format(new Date(value));
}

export function adTypeLabel(type: string) {
  return (
    {
      single_product: "สินค้าชิ้นเดียว",
      outfit_set: "ชุดเซ็ต",
      collection: "คอลเลกชัน",
      promotion: "โปรโมชัน",
      shop_feature: "แนะนำร้าน",
    }[type] ?? type
  );
}

