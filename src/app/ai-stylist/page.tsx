import type { Metadata } from "next";
import { StylistForm } from "@/components/stylist-form";
import { EditorialPageIntro } from "@/components/ui";

export const metadata: Metadata = { title: "AI Stylist — FitToday" };

interface PageProps {
  searchParams: Promise<{ mode?: string }>;
}

export default async function AiStylistPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialMode = params.mode === "wardrobe" ? "wardrobe" : "general";

  return (
    <div className="editorial-page-shell editorial-page-ai">
      <div className="container py-12 space-y-8">
        <EditorialPageIntro
          tone="ai"
          eyebrow="INDEPENDENT AI STYLING"
          title="วันนี้จะไปไหน?"
          body="ตอบคำถามสั้น ๆ สามขั้น แล้วรับลุค Safe, Elevated และ Comfortable จากบริบทของคุณ เลือกได้ว่าจะใช้คำแนะนำทั่วไปหรือตู้เสื้อผ้าส่วนตัว"
        />

        <StylistForm
          configured={Boolean(process.env.OPENAI_API_KEY)}
          initialMode={initialMode}
        />
      </div>
    </div>
  );
}
