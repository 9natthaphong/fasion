import type { Ad } from "@/lib/types";

export function filterAdsByCategory(ads: Ad[], categorySlug: string) {
  return ads.filter((ad) =>
    ad.categories?.some((category) => category.slug === categorySlug),
  );
}
