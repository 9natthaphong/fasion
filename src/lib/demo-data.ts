import type { Ad, Category, Shop } from "@/lib/types";

export const categories: Category[] = [
  ["men", "เสื้อผู้ชาย", "menswear"],
  ["women", "เสื้อผู้หญิง", "womenswear"],
  ["unisex", "Unisex", "unisex"],
  ["pants", "กางเกง", "pants"],
  ["skirts", "กระโปรง", "skirts"],
  ["dresses", "เดรส", "dresses"],
  ["work", "ชุดทำงาน", "workwear"],
  ["minimal", "Minimal", "minimal"],
  ["street", "Streetwear", "streetwear"],
  ["sport", "กีฬา", "sport"],
  ["shoes", "รองเท้า", "shoes"],
  ["bags", "กระเป๋า", "bags"],
  ["accessories", "เครื่องประดับ", "accessories"],
  ["sets", "ชุดเซ็ต", "outfit-sets"],
  ["promotion", "โปรโมชัน", "promotions"],
].map(([id, name_th, slug], index) => ({
  id,
  name_th,
  slug,
  sort_order: index + 1,
  is_active: true,
}));

export const shops: Shop[] = [
  {
    id: "demo-shop-01",
    name: "Quiet Form",
    slug: "quiet-form",
    description:
      "เสื้อผ้า everyday minimal ที่เน้นทรงสบาย เนื้อผ้าเหมาะกับอากาศร้อน และสีที่หยิบมาใส่ซ้ำได้ง่าย",
    logo_path: "/demo/shop-quiet.svg",
    cover_path: "/demo-assets/shop-quiet-cover.jpg",
    website_url: null,
    instagram_url: null,
    status: "approved",
    subscription_status: "active",
    subscription_ends_at: "2027-01-01T00:00:00.000Z",
    is_demo: true,
  },
  {
    id: "demo-shop-02",
    name: "Everyday Edit",
    slug: "everyday-edit",
    description:
      "เสื้อผ้าทำงานแบบไม่เป็นทางการเกินไป จับคู่ได้ทั้งวันทำงาน คาเฟ่ และวันเดินทาง",
    logo_path: "/demo/shop-edit.svg",
    cover_path: "/demo-assets/shop-edit-cover.jpg",
    website_url: null,
    instagram_url: null,
    status: "approved",
    subscription_status: "active",
    subscription_ends_at: "2027-01-01T00:00:00.000Z",
    is_demo: true,
  },
  {
    id: "demo-shop-03",
    name: "Morrow Studio",
    slug: "morrow-studio",
    description:
      "สตูดิโอแฟชั่นไร้เพศ โครงเสื้อชัด รายละเอียดน้อย และใช้พาเลตต์สีสงบสำหรับแต่งตัวทุกวัน",
    logo_path: "/demo/shop-morrow.svg",
    cover_path: "/demo-assets/shop-morrow-cover.jpg",
    website_url: null,
    instagram_url: null,
    status: "approved",
    subscription_status: "active",
    subscription_ends_at: "2027-01-01T00:00:00.000Z",
    is_demo: true,
  },
  {
    id: "demo-shop-04",
    name: "Sunday Assembly",
    slug: "sunday-assembly",
    description:
      "ชุดเซ็ตและเดรสที่ออกแบบให้แต่งง่ายในครั้งเดียว เหมาะกับวันพักผ่อนและโอกาสพิเศษแบบเรียบๆ",
    logo_path: "/demo/shop-sunday.svg",
    cover_path: "/demo-assets/shop-sunday-cover.jpg",
    website_url: null,
    instagram_url: null,
    status: "approved",
    subscription_status: "active",
    subscription_ends_at: "2027-01-01T00:00:00.000Z",
    is_demo: true,
  },
];

const adBlueprints = [
  ["linen-utility-shirt", "เสื้อลินิน Utility", "single_product", "890 บาท", 0, [0, 2, 7]],
  ["soft-tailored-set", "Soft Tailored Set", "outfit_set", "1,790 บาท", 1, [6, 7, 13]],
  ["city-walk-collection", "City Walk Collection", "collection", "เริ่มต้น 690 บาท", 2, [8, 10]],
  ["weekend-pairing", "Weekend Pairing", "outfit_set", "1,290 บาท", 3, [1, 13]],
  ["relaxed-pleated-pants", "กางเกงจีบ Relaxed", "single_product", "990 บาท", 0, [3, 7]],
  ["desk-to-dinner", "Desk to Dinner", "collection", "เริ่มต้น 790 บาท", 1, [1, 6]],
  ["mono-layer", "Mono Layer", "outfit_set", "1,590 บาท", 2, [2, 8, 13]],
  ["summer-dress-edit", "Summer Dress Edit", "collection", "เริ่มต้น 1,090 บาท", 3, [5, 7]],
  ["lightweight-overshirt", "Lightweight Overshirt", "single_product", "850 บาท", 0, [0, 2]],
  ["workday-capsule", "Workday Capsule", "collection", "เริ่มต้น 750 บาท", 1, [6, 7]],
  ["motion-knit-set", "Motion Knit Set", "outfit_set", "1,390 บาท", 2, [9, 13]],
  ["weekend-special", "Weekend Special ลด 15%", "promotion", "ลด 15%", 3, [14]],
  ["everyday-tote", "Everyday Structure Tote", "single_product", "790 บาท", 0, [11]],
  ["quiet-accessories", "Quiet Accessories", "collection", "เริ่มต้น 290 บาท", 1, [12]],
  ["travel-light-set", "Travel Light Set", "outfit_set", "1,490 บาท", 2, [2, 9, 13]],
  ["new-studio-opening", "เปิดตัว Sunday Assembly", "shop_feature", "ชมคอลเลกชัน", 3, [5, 14]],
] as const;

export const demoAdCoverBySlug: Record<string, string> = {
  "linen-utility-shirt": "/demo-assets/ad-linen-shirt.jpg",
  "soft-tailored-set": "/images/fittoday/ad-soft-tailored-set-v1.webp",
  "city-walk-collection": "/images/fittoday/ad-city-shoes.jpg",
  "weekend-pairing": "/demo-assets/ad-weekend-pairing.jpg",
  "relaxed-pleated-pants": "/images/fittoday/ad-pleated-pants.jpg",
  "desk-to-dinner": "/demo-assets/ad-tailored-set.jpg",
  "mono-layer": "/demo-assets/ad-city-walk.jpg",
  "summer-dress-edit": "/images/fittoday/ad-summer-dress.jpg",
  "lightweight-overshirt": "/demo-assets/ad-linen-shirt.jpg",
  "workday-capsule": "/images/fittoday/ad-workday-capsule-v1.webp",
  "motion-knit-set": "/demo-assets/ad-weekend-pairing.jpg",
  "weekend-special": "/demo-assets/ad-weekend-pairing.jpg",
  "everyday-tote": "/images/fittoday/ad-structure-tote.jpg",
  "quiet-accessories": "/images/fittoday/ad-structure-tote.jpg",
  "travel-light-set": "/images/fittoday/ad-travel-light-set-v1.webp",
  "new-studio-opening": "/images/fittoday/ad-summer-dress.jpg",
};

export const demoAdAltBySlug: Record<string, string> = {
  "soft-tailored-set": "ผู้หญิงไทยสวมชุดสูทกางเกงสีเบจในสตูดิโอแสงธรรมชาติ",
  "workday-capsule": "กางเกงทำงานสีชาร์โคล เสื้อเชิ้ตสีงาช้าง และเบลเซอร์สีเขียวหม่นจัดเป็นชุดแคปซูล",
  "travel-light-set": "ผู้หญิงไทยสวมกางเกงสีทรายและเสื้อเชิ้ตสีขาวสำหรับวันเดินทาง",
};

export const ads: Ad[] = adBlueprints.map(
  ([slug, title, adType, price, shopIndex, categoryIndexes], index) => ({
    id: `demo-ad-${String(index + 1).padStart(2, "0")}`,
    shop_id: shops[shopIndex].id,
    title,
    slug,
    description:
      index % 2 === 0
        ? "ชิ้นหลักที่ออกแบบให้ใส่ง่ายในอากาศร้อน จับคู่ซ้ำได้หลายโอกาสโดยไม่ดูจำเจ"
        : "การจัดชุดที่บาลานซ์ความเรียบและรายละเอียด ใช้โทนสีสุภาพและทรงที่เคลื่อนไหวสบาย",
    ad_type: adType,
    price_text: price,
    // Demo content is informational only and never exposes an outbound CTA.
    purchase_info: "สินค้าตัวอย่าง — ติดต่อร้านค้าเพื่อสอบถามรายละเอียด",
    destination_url: null,
    cover_image_path: demoAdCoverBySlug[slug],
    image_alt: demoAdAltBySlug[slug],
    status: "active",
    starts_at: "2026-07-01T00:00:00.000Z",
    ends_at: "2027-01-01T00:00:00.000Z",
    created_at: new Date(Date.UTC(2026, 6, 26 - index)).toISOString(),
    shop: shops[shopIndex],
    categories: categoryIndexes.map((categoryIndex) => categories[categoryIndex]),
    impressions: 820 + index * 137,
    likes: 42 + index * 11,
    clicks: 29 + index * 7,
    is_demo: true,
  }),
);

export function getDemoAd(slug: string) {
  return ads.find((ad) => ad.slug === slug) ?? null;
}

export function getDemoShop(slug: string) {
  return shops.find((shop) => shop.slug === slug) ?? null;
}
