import { NextResponse } from "next/server";
import { getFashionTagsGrouped } from "@/lib/taxonomy";

export async function GET() {
  const grouped = await getFashionTagsGrouped();
  return NextResponse.json({ tags: grouped });
}
