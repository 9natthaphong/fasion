import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { recordWearLog } from "@/lib/saved-outfits";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const wearLog = await recordWearLog(user.id, body);
    return NextResponse.json({ wearLog });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to record wear log" },
      { status: 400 },
    );
  }
}
