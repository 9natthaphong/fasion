import { createClient } from "@/lib/supabase/server";
import { getFitProfile } from "@/lib/fit-profile";
import type { Ad, PersonalizedAd } from "@/lib/types";

interface GetPersonalizedAdsOptions {
  userId?: string | null;
  currentCategorySlug?: string | null;
  contextStyle?: string | null;
  contextOccasion?: string | null;
  limit?: number;
}

export async function getPersonalizedAds(
  options: GetPersonalizedAdsOptions = {},
): Promise<PersonalizedAd[]> {
  const { userId, currentCategorySlug, contextStyle, contextOccasion, limit = 4 } = options;
  const supabase = await createClient();

  // Fetch all active ads from approved & active shops
  const { data: adsData, error } = await supabase
    .from("ads")
    .select(`
      *,
      shop:shops(*),
      categories:ad_categories(categories(*)),
      fashion_tags:ad_fashion_tags(fashion_tags(*))
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error || !adsData || adsData.length === 0) {
    return [];
  }

  // Filter out ads whose shop is not approved or whose subscription is inactive
  const now = new Date();
  const eligibleAds: Ad[] = adsData
    .map((raw) => {
      const shop = raw.shop;
      const categories = (raw.categories || [])
        .map((c: { categories: unknown }) => c.categories)
        .filter(Boolean);
      const fashion_tags = (raw.fashion_tags || [])
        .map((t: { fashion_tags: unknown }) => t.fashion_tags)
        .filter(Boolean);
      return {
        ...raw,
        shop,
        categories,
        fashion_tags,
      } as Ad;
    })
    .filter((ad) => {
      if (!ad.shop || ad.shop.status !== "approved" || ad.shop.subscription_status !== "active") {
        return false;
      }
      if (ad.starts_at && new Date(ad.starts_at) > now) return false;
      if (ad.ends_at && new Date(ad.ends_at) < now) return false;
      return true;
    });

  if (eligibleAds.length === 0) {
    return [];
  }

  // Check user personalization preferences
  let enablePersonalization = false;
  let useWardrobePersonalization = false;
  let resetCutoffIso: string | null = null;
  let preferredStyles: string[] = [];
  let preferredColors: string[] = [];
  let likedAdIds: string[] = [];
  let clickedAdIds: string[] = [];
  let wardrobeStyles: string[] = [];

  if (userId) {
    const fitProfile = await getFitProfile(userId);
    if (fitProfile) {
      // Personalized ads active ONLY when enable_personalized_ads === true AND consent timestamp is set
      enablePersonalization = Boolean(fitProfile.enable_personalized_ads && fitProfile.personalized_ads_consent_at);
      useWardrobePersonalization = Boolean(fitProfile.use_wardrobe_for_personalization);
      resetCutoffIso = fitProfile.personalization_reset_at || null;
    }

    // Fetch customer preferences
    const { data: prefData } = await supabase
      .from("customer_preferences")
      .select("preferred_styles, preferred_colors")
      .eq("user_id", userId)
      .maybeSingle();

    if (prefData) {
      preferredStyles = prefData.preferred_styles || [];
      preferredColors = prefData.preferred_colors || [];
    }

    // Fetch user liked ad IDs (filtered by reset cutoff)
    let likesQuery = supabase.from("ad_likes").select("ad_id, created_at").eq("user_id", userId);
    if (resetCutoffIso) {
      likesQuery = likesQuery.gte("created_at", resetCutoffIso);
    }
    const { data: likesData } = await likesQuery;
    if (likesData) likedAdIds = likesData.map((l) => l.ad_id);

    // Fetch user clicked ad IDs (filtered by reset cutoff)
    let clicksQuery = supabase.from("ad_clicks").select("ad_id, created_at").eq("user_id", userId);
    if (resetCutoffIso) {
      clicksQuery = clicksQuery.gte("created_at", resetCutoffIso);
    }
    const { data: clicksData } = await clicksQuery;
    if (clicksData) clickedAdIds = clicksData.map((c) => c.ad_id);

    // Fetch wardrobe styles if consent enabled
    if (useWardrobePersonalization) {
      const { data: wardrobeData } = await supabase
        .from("wardrobe_items")
        .select("styles, primary_colors")
        .eq("user_id", userId)
        .is("deleted_at", null);
      if (wardrobeData) {
        wardrobeStyles = wardrobeData.flatMap((w) => w.styles || []);
      }
    }
  }

  // If personalization disabled or no user, return recent active ads with fallback score
  if (!enablePersonalization || !userId) {
    const shopCounts: Record<string, number> = {};
    return eligibleAds.slice(0, limit).map((ad) => {
      const count = shopCounts[ad.shop_id] || 0;
      shopCounts[ad.shop_id] = count + 1;
      return {
        ...ad,
        relevanceScore: 10 - count * 2,
        explanations: ["โฆษณาล่าสุดจากร้านค้าที่ผ่านการรับรอง"],
      };
    });
  }

  // Deterministic Relevance Scoring Engine
  const shopAdCounts: Record<string, number> = {};
  const scoredAds: PersonalizedAd[] = eligibleAds.map((ad) => {
    let score = 0;
    const explanations: string[] = [];

    // 1. Style Overlap (+35 max)
    const adStyles = (ad.fashion_tags || [])
      .filter((t) => t.tag_type === "style")
      .map((t) => t.name_th);
    const matchedStyles = adStyles.filter((s) =>
      preferredStyles.some((p) => p.toLowerCase() === s.toLowerCase()),
    );
    if (matchedStyles.length > 0) {
      score += 35;
      explanations.push(`เพราะคุณสนใจสไตล์ ${matchedStyles[0]}`);
    } else if (contextStyle && adStyles.some((s) => s.toLowerCase() === contextStyle.toLowerCase())) {
      score += 25;
      explanations.push(`ใกล้เคียงกับสไตล์ ${contextStyle} ที่คุณดูอยู่`);
    }

    // 2. Category / Item-Type Overlap (+25 max)
    const adCategorySlugs = (ad.categories || []).map((c) => c.slug);
    if (currentCategorySlug && adCategorySlugs.includes(currentCategorySlug)) {
      score += 25;
      explanations.push("อยู่ในหมวดสินค้าที่คุณกำลังเรียกดู");
    }

    // 3. Explicit Color Overlap (+10 max)
    const adColors = (ad.fashion_tags || [])
      .filter((t) => t.tag_type === "color")
      .map((t) => t.name_th);
    const matchedColors = adColors.filter((c) =>
      preferredColors.some((p) => p.toLowerCase() === c.toLowerCase()),
    );
    if (matchedColors.length > 0) {
      score += 10;
      if (explanations.length < 2) {
        explanations.push(`ตรงกับโทนสี ${matchedColors[0]} ที่คุณชอบ`);
      }
    }

    // 4. Occasion / Weather Match (+10 max)
    const adOccasions = (ad.fashion_tags || [])
      .filter((t) => t.tag_type === "occasion")
      .map((t) => t.name_th);
    if (contextOccasion && adOccasions.some((o) => o.toLowerCase() === contextOccasion.toLowerCase())) {
      score += 10;
      if (explanations.length < 2) {
        explanations.push(`เหมาะกับโอกาส ${contextOccasion}`);
      }
    }

    // 5. Wardrobe Composition Match (+10 max, ONLY if user enabled use_wardrobe_for_personalization)
    if (useWardrobePersonalization && wardrobeStyles.length > 0) {
      const wardrobeMatches = adStyles.filter((s) => wardrobeStyles.includes(s));
      if (wardrobeMatches.length > 0) {
        score += 10;
        if (explanations.length < 2) {
          explanations.push(`แมตช์กับเสื้อผ้าในตู้ส่วนตัวของคุณ`);
        }
      }
    }

    // 6. User Engagement History (+15 max)
    if (likedAdIds.includes(ad.id)) score += 10;
    if (clickedAdIds.includes(ad.id)) score += 5;

    // 7. Recency Boost (+5 max for ads created in last 7 days)
    const daysOld = (now.getTime() - new Date(ad.created_at).getTime()) / (1000 * 3600 * 24);
    if (daysOld <= 7) score += 5;

    // Diversity penalty (-15 pts for second or third ad from same shop)
    const shopCount = shopAdCounts[ad.shop_id] || 0;
    shopAdCounts[ad.shop_id] = shopCount + 1;
    if (shopCount > 0) {
      score -= shopCount * 15;
    }

    if (explanations.length === 0) {
      explanations.push("โฆษณาแนะนำสำหรับสไตล์ของคุณ");
    }

    return {
      ...ad,
      relevanceScore: Math.max(1, score),
      explanations,
    };
  });

  // Sort descending by relevance score
  scoredAds.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return scoredAds.slice(0, limit);
}
