import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseAdminConfigured } from "@/lib/env";
import { getEventIdentity, passRateLimit, requireSameOrigin } from "@/lib/request-security";
import { getAdminClient } from "@/lib/supabase/admin";
import { getFitProfile } from "@/lib/fit-profile";
import { getAggregatedFeedbackSummary } from "@/lib/saved-outfits";
import { getPersonalizedAds } from "@/lib/ad-relevance";
import {
  outfitResponseSchema,
  wardrobeOutfitInputSchema,
  wardrobeOutfitResponseSchema,
} from "@/lib/validation";
import { getWardrobeItems, wardrobeAssetUrl } from "@/lib/wardrobe";
import type { WardrobeOutfitResponse, WardrobeItem, OutfitResponse } from "@/lib/types";

const generalSystemPrompt = `คุณคือสไตลิสต์ภาษาไทยที่สุภาพ ให้คำแนะนำแฟชั่นตามกิจกรรม อากาศ ความสบาย ความชอบ และงบประมาณ
ต้องตอบ 3 ชุดที่ต่างกันจริงและมี direction ตามลำดับ safe, elevated, comfortable
ห้ามวิจารณ์หรือทำให้รูปร่างผู้ใช้อับอาย ห้ามแนะนำการลดน้ำหนักหรือวินิจฉัยสุขภาพ
อย่าอ้างว่าส่วนสูงและน้ำหนักระบุสัดส่วนได้แม่นยำ ห้ามรับประกันไซซ์
ห้ามสร้างลิงก์สินค้า อ้างสินค้าจริง หรือแทรกโฆษณา/ร้านค้า
ใช้ภาษาที่เป็นกลางกับเพศ และระบุว่าไซซ์เป็นเพียงการประมาณ`;

const wardrobeSystemPrompt = `คุณคือสไตลิสต์ภาษาไทยที่ช่วยจัดลุคแฟชั่นจากตู้เสื้อผ้าส่วนตัวของผู้ใช้
ต้องตอบ 3 ชุดที่มี direction ต่างกันจริงตามลำดับ: safe, elevated, comfortable
กฎที่ต้องปฏิบัติตามอย่างเคร่งครัด:
1. เลือกใช้เฉพาะรายการเสื้อผ้าที่มีอยู่จริงในรายการตู้เสื้อผ้าของผู้ใช้เท่านั้น (ระบุด้วย wardrobeItemId ตรงกับที่ให้ไว้)
2. ห้ามสร้างหรือสมมุติ wardrobeItemId ขึ้นเองเด็ดขาด!
3. หากตู้เสื้อผ้าขาดชิ้นสำคัญสำหรับลุคนั้น (เช่น ขาดรองเท้า หรือขาดชิ้นล่าง) ให้ใส่ไว้ใน missingItems เพื่อแจ้งผู้ใช้
4. อธิบายเหตุผลการแมตช์ชุดอย่างเป็นมิตร ภาษาไทย สุภาพ ไม่วิจารณ์รูปร่าง`;

export async function POST(request: Request) {
  if (!(await requireSameOrigin(request))) {
    return NextResponse.json({ error: "Origin ไม่ถูกต้อง" }, { status: 403 });
  }

  const rawJson = await request.json().catch(() => null);
  const parsed = wardrobeOutfitInputSchema.safeParse(rawJson);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { code: "configuration_missing", error: "AI Stylist ยังไม่ได้ตั้งค่าใน environment นี้" },
      { status: 503 },
    );
  }

  const user = await getCurrentUser();
  const identity = await getEventIdentity(user?.id);

  if (
    isSupabaseAdminConfigured() &&
    !(await passRateLimit("ai-stylist", user?.id ?? identity.sessionId, 10, 3600))
  ) {
    return NextResponse.json({ error: "ใช้งานครบโควตาชั่วคราว กรุณาลองใหม่ภายหลัง" }, { status: 429 });
  }

  // Fetch optional feedback summary if user logged in
  let feedbackSummary: string | null = null;
  let fitProfilePromptPart: Record<string, unknown> = {};

  if (user) {
    feedbackSummary = await getAggregatedFeedbackSummary(user.id);
    const fitProfile = await getFitProfile(user.id);
    if (fitProfile && fitProfile.use_for_ai_styling) {
      fitProfilePromptPart = {
        usualTopSize: fitProfile.usual_top_size,
        usualBottomSize: fitProfile.usual_bottom_size,
        usualShoeSize: fitProfile.usual_shoe_size,
        fitNotes: fitProfile.fit_notes,
        colorContrastPreference: fitProfile.color_contrast_preference,
      };
    }
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, maxRetries: 1, timeout: 25_000 });

  // Handle Wardrobe Mode
  if (parsed.data.mode === "wardrobe") {
    if (!user) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบเพื่อใช้งานโหมดตู้เสื้อผ้าส่วนตัว" }, { status: 401 });
    }

    const rawUserItems = await getWardrobeItems(user.id, { status: "available" });
    const excludedSet = new Set(parsed.data.excludedItemIds);
    const availableItems = rawUserItems.filter((item) => !excludedSet.has(item.id));

    if (availableItems.length < 2) {
      return NextResponse.json(
        {
          error: "ตู้เสื้อผ้าของคุณมีจำนวนน้อยเกินไปสำหรับจัดชุด กรุณาอัปโหลดเสื้อผ้าเพิ่มอย่างน้อย 2 ชิ้น",
          code: "insufficient_wardrobe_items",
        },
        { status: 400 },
      );
    }

    const itemCatalogForPrompt = availableItems.map((item) => ({
      wardrobeItemId: item.id,
      name: item.name ?? "ไม่ระบุชื่อ",
      itemType: item.item_type,
      subcategory: item.subcategory,
      colors: item.primary_colors,
      styles: item.styles,
      material: item.material,
      fit: item.preferred_fit,
      formality: item.formality,
      weather: item.weather_suitability,
      description: item.ai_description,
    }));

    const inputPrompt = `จัดชุด 3 ทางเลือกจากตู้เสื้อผ้าต่อไปนี้:\n${JSON.stringify({
      userWardrobe: itemCatalogForPrompt,
      context: {
        activity: parsed.data.activity,
        formality: parsed.data.formality,
        weather: parsed.data.weather,
        timeOfDay: parsed.data.timeOfDay,
        preferredStyles: parsed.data.preferredStyles,
        preferredColors: parsed.data.preferredColors,
        avoidedColors: parsed.data.avoidedColors,
        anchorItem: parsed.data.anchorItem,
        notes: parsed.data.notes,
        feedbackSummary,
        fitProfileOptions: fitProfilePromptPart,
      },
    })}`;

    let wardrobeResult: WardrobeOutfitResponse | null = null;

    for (let attempt = 0; attempt < 2 && !wardrobeResult; attempt += 1) {
      try {
        const response = await client.responses.parse(
          {
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            store: false,
            input: [
              { role: "system", content: wardrobeSystemPrompt },
              { role: "user", content: inputPrompt },
            ],
            text: { format: zodTextFormat(wardrobeOutfitResponseSchema, "fittoday_wardrobe_outfits") },
          },
          { signal: AbortSignal.timeout(25_000) },
        );

        const checked = wardrobeOutfitResponseSchema.safeParse(response.output_parsed);
        if (checked.success) {
          wardrobeResult = checked.data;
        }
      } catch (error) {
        console.error("Wardrobe AI request failed", { attempt: attempt + 1, error });
      }
    }

    if (!wardrobeResult) {
      return NextResponse.json({ error: "AI ไม่สามารถจัดชุดจากตู้เสื้อผ้าได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง" }, { status: 502 });
    }

    // Server-side ownership & validity check for returned item IDs
    const validUserItemMap = new Map<string, WardrobeItem>(availableItems.map((i) => [i.id, i]));

    const validatedOutfits = wardrobeResult.outfits.map((outfit) => {
      const validItems = outfit.items
        .filter((itemRef) => validUserItemMap.has(itemRef.wardrobeItemId))
        .map((itemRef) => {
          const details = validUserItemMap.get(itemRef.wardrobeItemId);
          return {
            ...itemRef,
            itemDetails: details
              ? { ...details, signed_image_url: wardrobeAssetUrl(details.image_path) }
              : null,
          };
        });

      return {
        ...outfit,
        items: validItems,
      };
    });

    // Separated sponsored ads retrieval (AFTER AI recommendation generation finishes)
    const sponsoredAds = await getPersonalizedAds({
      userId: user.id,
      contextStyle: wardrobeResult.outfits[0]?.style,
      contextOccasion: parsed.data.activity,
      limit: 3,
    });

    const finalWardrobeResult: WardrobeOutfitResponse = {
      summary: wardrobeResult.summary,
      outfits: validatedOutfits,
      generalTips: wardrobeResult.generalTips,
      sponsoredAds,
    };

    // Save to Database History
    if (isSupabaseAdminConfigured()) {
      const admin = getAdminClient();
      const storedInput = { ...parsed.data, mode: "wardrobe" };
      const { data: savedReq } = await admin
        .from("outfit_requests")
        .insert({ user_id: user.id, input_data: storedInput })
        .select("id")
        .single();

      if (savedReq) {
        const { data: savedRes } = await admin
          .from("outfit_results")
          .insert({
            request_id: savedReq.id,
            model_name: process.env.OPENAI_MODEL || "gpt-4o-mini",
            result_data: finalWardrobeResult,
          })
          .select("id")
          .single();

        if (savedRes) {
          const mappingRows = finalWardrobeResult.outfits.flatMap((outfit, outfitIdx) =>
            outfit.items.map((item) => ({
              outfit_result_id: savedRes.id,
              wardrobe_item_id: item.wardrobeItemId,
              outfit_index: outfitIdx,
              item_role: item.role,
              styling_instruction: item.stylingInstruction,
            })),
          );

          if (mappingRows.length > 0) {
            await admin.from("outfit_result_items").insert(mappingRows);
          }
        }
      }
    }

    return NextResponse.json(finalWardrobeResult);
  }

  // Handle General Mode
  const inputPromptData = {
    ...(parsed.data.saveForNextTime ? parsed.data : { ...parsed.data, heightCm: null, weightKg: null }),
    feedbackSummary,
    fitProfileOptions: fitProfilePromptPart,
  };

  let result: OutfitResponse | null = null;

  for (let attempt = 0; attempt < 2 && !result; attempt += 1) {
    try {
      const response = await client.responses.parse(
        {
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          store: false,
          input: [
            { role: "system", content: generalSystemPrompt },
            { role: "user", content: `สร้างคำแนะนำจากข้อมูลต่อไปนี้:\n${JSON.stringify(inputPromptData)}` },
          ],
          text: { format: zodTextFormat(outfitResponseSchema, "fittoday_outfits") },
        },
        { signal: AbortSignal.timeout(20_000) },
      );
      const checked = outfitResponseSchema.safeParse(response.output_parsed);
      if (checked.success) result = checked.data;
    } catch (error) {
      console.error("AI stylist request failed", { attempt: attempt + 1, name: error instanceof Error ? error.name : "UnknownError" });
    }
  }

  if (!result) return NextResponse.json({ error: "AI ส่งผลลัพธ์ไม่สมบูรณ์ กรุณาลองอีกครั้ง" }, { status: 502 });

  // Separated sponsored ads retrieval (AFTER AI recommendation generation finishes)
  const sponsoredAds = await getPersonalizedAds({
    userId: user?.id,
    contextStyle: result.outfits[0]?.style,
    contextOccasion: parsed.data.activity,
    limit: 3,
  });

  const finalResult: OutfitResponse = {
    ...result,
    sponsoredAds,
  };

  if (isSupabaseAdminConfigured()) {
    const admin = getAdminClient();
    const storedInput = parsed.data.saveForNextTime ? parsed.data : { ...parsed.data, heightCm: null, weightKg: null };
    const { data: saved } = await admin.from("outfit_requests").insert({ user_id: user?.id ?? null, input_data: storedInput }).select("id").single();
    if (saved) await admin.from("outfit_results").insert({ request_id: saved.id, model_name: process.env.OPENAI_MODEL || "gpt-4o-mini", result_data: finalResult });
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

  return NextResponse.json(finalResult);
}
