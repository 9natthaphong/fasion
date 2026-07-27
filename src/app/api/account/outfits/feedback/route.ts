import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { saveOutfitFeedback } from "@/lib/saved-outfits";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const feedback = await saveOutfitFeedback(user.id, body);
    return NextResponse.json({ feedback });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save outfit feedback" },
      { status: 400 },
    );
  }
}
