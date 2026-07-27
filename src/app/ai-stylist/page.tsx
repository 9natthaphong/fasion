import type { Metadata } from "next";
import { StylistForm } from "@/components/stylist-form";

export const metadata: Metadata = { title: "AI Stylist" };

export default function AiStylistPage() {
  return <div className="container stylist-page"><header className="content-hero"><p className="eyebrow">Independent AI styling</p><h1>วันนี้จะไปไหน?</h1><p>เล่าบริบทวันนี้ให้ AI ฟัง แล้วรับ 3 แนวทางที่แตกต่างกันจริง โดยผลลัพธ์นี้ไม่เลือกตามร้านที่ซื้อโฆษณา</p></header><StylistForm configured={Boolean(process.env.OPENAI_API_KEY)} /></div>;
}
