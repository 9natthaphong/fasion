import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { setShopFashionTags } from "@/lib/taxonomy";
import { z } from "zod";

const schema = z.object({
  shopId: z.string().uuid(),
  tagIds: z.array(z.string().uuid()).max(20),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "merchant" && user.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { shopId, tagIds } = schema.parse(body);
    await setShopFashionTags(shopId, tagIds);
    return NextResponse.json({ message: "Shop tags updated successfully" });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update shop tags" },
      { status: 400 },
    );
  }
}
