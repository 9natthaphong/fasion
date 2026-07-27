import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseAdminConfigured } from "@/lib/env";
import { getEventIdentity, passRateLimit, requireSameOrigin } from "@/lib/request-security";
import { getAdminClient } from "@/lib/supabase/admin";
import { outfitInputSchema, outfitResponseSchema } from "@/lib/validation";

const systemPrompt = `คุณคือสไตลิสต์ภาษาไทยที่สุภาพ ให้คำแนะนำแฟชั่นตามกิจกรรม อากาศ ความสบาย ความชอบ และงบประมาณ
ต้องตอบ 3 ชุดที่ต่างกันจริงและมี direction ตามลำดับ safe, elevated, comfortable
ห้ามวิจารณ์หรือทำให้รูปร่างผู้ใช้อับอาย ห้ามแนะนำการลดน้ำหนักหรือวินิจฉัยสุขภาพ
อย่าอ้างว่าส่วนสูงและน้ำหนักระบุสัดส่วนได้แม่นยำ ห้ามรับประกันไซซ์
ห้ามสร้างลิงก์สินค้า อ้างสินค้าจริง หรือแทรกโฆษณา/ร้านค้า
ใช้ภาษาที่เป็นกลางกับเพศ และระบุว่าไซซ์เป็นเพียงการประมาณ`;

export async function POST(request: Request) {
  if (!(await requireSameOrigin(request))) return NextResponse.json({ error: "Origin ไม่ถูกต้อง" }, { status: 403 });
  const parsed = outfitInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ code: "configuration_missing", error: "AI Stylist ยังไม่ได้ตั้งค่าใน environment นี้" }, { status: 503 });
  const user = await getCurrentUser();
  const identity = await getEventIdentity(user?.id);
  if (isSupabaseAdminConfigured() && !(await passRateLimit("ai-stylist", user?.id ?? identity.sessionId, 10, 3600))) return NextResponse.json({ error: "ใช้งานครบโควตาชั่วคราว กรุณาลองใหม่ภายหลัง" }, { status: 429 });
  const input = parsed.data.saveForNextTime ? parsed.data : { ...parsed.data, heightCm: null, weightKg: null };
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 1, timeout: 20_000 });
  let result = null;
  for (let attempt = 0; attempt < 2 && !result; attempt += 1) {
    try {
      const response = await client.responses.parse({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        store: false,
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `สร้างคำแนะนำจากข้อมูลต่อไปนี้:\n${JSON.stringify(input)}` },
        ],
        text: { format: zodTextFormat(outfitResponseSchema, "fittoday_outfits") },
      }, { signal: AbortSignal.timeout(20_000) });
      const checked = outfitResponseSchema.safeParse(response.output_parsed);
      if (checked.success) result = checked.data;
    } catch (error) {
      console.error("AI stylist request failed", { attempt: attempt + 1, name: error instanceof Error ? error.name : "UnknownError" });
    }
  }
  if (!result) return NextResponse.json({ error: "AI ส่งผลลัพธ์ไม่สมบูรณ์ กรุณาลองอีกครั้ง" }, { status: 502 });
  if (isSupabaseAdminConfigured()) {
    const admin = getAdminClient();
    const storedInput = parsed.data.saveForNextTime ? parsed.data : { ...parsed.data, heightCm: null, weightKg: null };
    const { data: saved } = await admin.from("outfit_requests").insert({ user_id: user?.id ?? null, input_data: storedInput }).select("id").single();
    if (saved) await admin.from("outfit_results").insert({ request_id: saved.id, model_name: process.env.OPENAI_MODEL || "gpt-4o-mini", result_data: result });
    if (user?.role === "customer" && parsed.data.saveForNextTime) {
      await admin.from("customer_preferences").upsert({
        user_id: user.id,
        height_cm: parsed.data.heightCm,
        weight_kg: parsed.data.weightKg,
        clothing_presentation: parsed.data.clothingPresentation,
        preferred_styles: parsed.data.preferredStyles,
        preferred_colors: parsed.data.preferredColors,
        avoided_colors: parsed.data.avoidedColors,
        preferred_fit: parsed.data.preferredFit,
        default_budget: parsed.data.budget,
        save_body_information: true,
      });
    }
  }
  return NextResponse.json(result);
}
