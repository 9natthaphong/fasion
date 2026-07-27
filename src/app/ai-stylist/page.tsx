import type { Metadata } from "next";
import { StylistForm } from "@/components/stylist-form";

export const metadata: Metadata = { title: "AI Stylist — FitToday" };

interface PageProps {
  searchParams: Promise<{ mode?: string }>;
}

export default async function AiStylistPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialMode = params.mode === "wardrobe" ? "wardrobe" : "general";

  return (
    <div className="container py-12 space-y-8">
      <header className="max-w-3xl space-y-3">
        <p className="font-mono text-xs text-muted uppercase">Independent AI styling</p>
        <h1 className="font-serif text-4xl sm:text-5xl font-normal text-charcoal">วันนี้จะไปไหน?</h1>
        <p className="text-base text-muted leading-relaxed">
          บอกกิจกรรม อากาศ และสไตล์ที่ชอบ แล้วรับไอเดียจัดลุค 3 ทิศทาง (Safe, Elevated, Comfortable) เลือกแนะนำได้ทั้งจากเสื้อผ้าทั่วไปหรือตู้เสื้อผ้าส่วนตัวของคุณ
        </p>
      </header>

      <StylistForm
        configured={Boolean(process.env.OPENAI_API_KEY)}
        initialMode={initialMode}
      />
    </div>
  );
}
