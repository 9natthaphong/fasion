import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { setAdFashionTags } from "@/lib/taxonomy";
import { z } from "zod";

const schema = z.object({
  tagIds: z.array(z.string().uuid()).max(20),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "merchant" && user.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: adId } = await params;
    const body = await req.json();
    const { tagIds } = schema.parse(body);
    await setAdFashionTags(adId, tagIds);
    return NextResponse.json({ message: "Ad tags updated successfully" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update ad tags" },
      { status: 400 },
    );
  }
}
