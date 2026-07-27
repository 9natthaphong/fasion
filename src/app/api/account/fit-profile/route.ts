import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getFitProfile, upsertFitProfile, deleteFitProfile } from "@/lib/fit-profile";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getFitProfile(user.id);
  return NextResponse.json({ profile });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const profile = await upsertFitProfile(user.id, body);
    return NextResponse.json({ profile });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update fit profile" },
      { status: 400 },
    );
  }
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await deleteFitProfile(user.id);
    return NextResponse.json({ message: "Fit profile deleted successfully" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete fit profile" },
      { status: 500 },
    );
  }
}
