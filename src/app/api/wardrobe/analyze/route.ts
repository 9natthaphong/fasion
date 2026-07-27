import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { requireSameOrigin } from "@/lib/request-security";
import { getAdminClient } from "@/lib/supabase/admin";
import { wardrobeAnalysisOutputSchema, isOwnedWardrobeAssetPath } from "@/lib/validation";
import type { WardrobeAnalysisOutput } from "@/lib/types";

const systemPrompt = `คุณคือ AI ผู้เชี่ยวชาญการวิเคราะห์ลักษณะเสื้อผ้าแฟชั่นในประเทศไทย
จงวิเคราะห์ภาพเสื้อผ้าอย่างละเอียดตามจริง ระบุประเภท สีหลัก สไตล์ เนื้อผ้า ความกระชับ ความเป็นทางการ อากาศที่เหมาะสม และคำอธิบายสรุปเป็นภาษาไทย
คำเตือนความปลอดภัยและความเป็นกลาง:
- ห้ามวิจารณ์หรือคาดเดารูปร่างบุคคลในภาพ
- ห้ามคาดเดายี่ห้อแบรนด์ที่มองไม่เห็นชัดเจน
- ห้ามระบุข้อมูลสุขภาพหรือลักษณะส่วนบุคคล
- หากมองไม่ชัดเจน ให้ระบุเป็น unknown หรือ null`;

const fallbackOutput: WardrobeAnalysisOutput = {
  itemType: "top",
  subcategory: null,
  suggestedName: "เสื้อผ้าของฉัน",
  primaryColors: ["ขาว"],
  styles: ["เรียบง่าย"],
  material: null,
  preferredFit: "regular",
  formality: "casual",
  weatherSuitability: ["warm", "indoor"],
  description: "เสื้อผ้าคุณภาพดีสำหรับใส่ทั่วไป",
  confidence: 0.8,
};

export async function POST(request: Request) {
  if (!(await requireSameOrigin(request))) {
    return NextResponse.json({ error: "Origin ไม่ถูกต้อง" }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนดำเนินการ" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const storagePath = body?.storagePath as string | undefined;

    if (!storagePath || !isOwnedWardrobeAssetPath(storagePath, user.id)) {
      return NextResponse.json({ error: "เส้นทางไฟล์ภาพไม่ถูกต้องหรือไม่มีสิทธิ์" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        status: "manual_required",
        message: "AI Vision ยังไม่ได้ตั้งค่าใน environment นี้ กรุณาระบุข้อมูลเสื้อผ้าด้วยตนเอง",
        analysis: fallbackOutput,
      });
    }

    const admin = getAdminClient();
    const { data: fileData, error: downloadError } = await admin.storage
      .from("wardrobe-assets")
      .download(storagePath);

    if (downloadError || !fileData) {
      return NextResponse.json({
        status: "manual_required",
        message: "ไม่สามารถดาวน์โหลดไฟล์ภาพเพื่อวิเคราะห์ได้ กรุณาระบุข้อมูลด้วยตนเอง",
        analysis: fallbackOutput,
      });
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const mimeType = storagePath.endsWith(".png")
      ? "image/png"
      : storagePath.endsWith(".webp")
      ? "image/webp"
      : "image/jpeg";
    const base64Data = `data:${mimeType};base64,${buffer.toString("base64")}`;

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 1, timeout: 25_000 });
    let analysisResult: WardrobeAnalysisOutput | null = null;

    try {
      const response = await client.responses.parse(
        {
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          store: false,
          input: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                { type: "input_text", text: "วิเคราะห์เสื้อผ้าในภาพนี้และส่งออกข้อมูลแบบยึดโครงสร้างที่กำหนด" },
                { type: "input_image", image_url: base64Data, detail: "auto" },
              ],
            },
          ],
          text: { format: zodTextFormat(wardrobeAnalysisOutputSchema, "fittoday_wardrobe_analysis") },
        },
        { signal: AbortSignal.timeout(25_000) },
      );

      const parsed = wardrobeAnalysisOutputSchema.safeParse(response.output_parsed);
      if (parsed.success) {
        analysisResult = parsed.data;
      }
    } catch (err) {
      console.error("OpenAI vision analysis failed", err);
    }

    if (!analysisResult) {
      return NextResponse.json({
        status: "manual_required",
        message: "AI ไม่สามารถอ่านข้อมูลภาพได้ชัดเจน กรุณาระบุหรือแก้ไขข้อมูลด้วยตนเอง",
        analysis: fallbackOutput,
      });
    }

    return NextResponse.json({
      status: "completed",
      analysis: analysisResult,
    });
  } catch (error) {
    console.error("Wardrobe analyze exception", error);
    return NextResponse.json({
      status: "manual_required",
      message: "เกิดข้อผิดพลาดในการวิเคราะห์ภาพ",
      analysis: fallbackOutput,
    });
  }
}
