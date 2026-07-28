import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPersonalizedAds } from "@/lib/ad-relevance";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  const url = new URL(req.url);
  const categorySlug = url.searchParams.get("category");
  const style = url.searchParams.get("style");
  const occasion = url.searchParams.get("occasion");
  const limit = Math.min(Number(url.searchParams.get("limit") || 4), 12);

  const ads = await getPersonalizedAds({
    userId: user?.id,
    currentCategorySlug: categorySlug,
    contextStyle: style,
    contextOccasion: occasion,
    limit,
  });

  return NextResponse.json({ ads });
}
