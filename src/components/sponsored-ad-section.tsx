"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Info, ExternalLink, ShieldCheck } from "lucide-react";
import { PurchaseInfoText } from "@/components/purchase-info-text";
import { resolvePurchaseInfo } from "@/lib/purchase-info";
import type { PersonalizedAd } from "@/lib/types";

interface Props {
  ads: PersonalizedAd[];
}

export function SponsoredAdSection({ ads }: Props) {
  const [selectedAdForInfo, setSelectedAdForInfo] = useState<PersonalizedAd | null>(null);

  if (!ads || ads.length === 0) return null;

  return (
    <div className="space-y-6 pt-12 border-t border-line">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-mono text-muted uppercase">
            <span className="px-2 py-0.5 bg-paper border border-line text-charcoal font-semibold">สนับสนุนโดยร้านค้า</span>
            <span>Sponsored Recommendations</span>
          </div>
          <h3 className="font-serif text-2xl font-normal text-charcoal mt-1">
            สินค้าและร้านค้าที่อาจเข้ากับลุคของคุณ
          </h3>
          <p className="text-xs text-muted mt-0.5">
            โฆษณาในส่วนนี้ถูกคัดเลือกแยกต่างหากหลัง AI สรุปชุดเสร็จแล้ว และไม่ได้มีผลต่อคำแนะนำของ AI Stylist
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSelectedAdForInfo(ads[0])}
          className="text-xs text-muted hover:text-charcoal underline inline-flex items-center gap-1 shrink-0"
        >
          <Info className="w-3.5 h-3.5" />
          <span>ทำไมฉันเห็นโฆษณานี้?</span>
        </button>
      </div>

      {/* Grid of Sponsored Ads */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {ads.map((ad) => {
          const coverUrl = ad.cover_image_path || "/demo-assets/ad-linen-shirt.jpg";
          const purchaseInfo = resolvePurchaseInfo(ad.purchase_info, ad.destination_url);
          return (
            <div key={ad.id} className="border border-line bg-paper p-4 space-y-3 flex flex-col justify-between relative group hover:border-charcoal transition-colors">
              <div className="space-y-3">
                {/* Image */}
                <div className="aspect-[4/3] relative bg-background border border-line overflow-hidden">
                  <Image src={coverUrl} alt={ad.image_alt ?? ad.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-2 left-2">
                    <span className="px-2 py-0.5 bg-black/80 backdrop-blur-xs text-white text-[10px] font-mono font-medium">
                      โฆษณา
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-olive uppercase block">
                    {ad.shop?.name || "ร้านค้าพันธมิตร"}
                  </span>
                  <h4 className="font-serif text-lg font-normal text-charcoal line-clamp-1 group-hover:underline">
                    {ad.title}
                  </h4>
                  <p className="text-xs text-muted line-clamp-2">{ad.description}</p>
                </div>

                {/* Score Explanations */}
                {ad.explanations?.length > 0 && (
                  <div className="pt-2 border-t border-line/60 text-[11px] text-muted space-y-0.5">
                    {ad.explanations.slice(0, 2).map((exp, idx) => (
                      <div key={idx} className="flex items-start gap-1">
                        <span className="text-olive">•</span>
                        <span>{exp}</span>
                      </div>
                    ))}
                  </div>
                )}

                {purchaseInfo ? (
                  <div className="pt-2 border-t border-line/60 space-y-1">
                    <span className="block text-[10px] font-mono text-muted uppercase">
                      ช่องทางสั่งซื้อ
                    </span>
                    <PurchaseInfoText
                      value={purchaseInfo}
                      className="text-xs text-charcoal whitespace-pre-wrap break-words line-clamp-3"
                    />
                  </div>
                ) : null}
              </div>

              {/* Price & Action CTA */}
              <div className="pt-3 border-t border-line flex items-center justify-between">
                <span className="text-sm font-medium text-charcoal font-mono">{ad.price_text || "ดูรายละเอียด"}</span>
                {ad.destination_url && !ad.is_demo ? (
                  <Link
                    href={`/go/ad/${ad.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-charcoal text-white hover:bg-olive text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
                  >
                    <span>ไปยังร้านค้า</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Why This Ad Modal */}
      {selectedAdForInfo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-background border border-line p-6 max-w-md w-full space-y-4">
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <ShieldCheck className="w-5 h-5 text-olive" />
              <h4 className="font-serif text-xl font-normal text-charcoal">ทำไมฉันจึงเห็นโฆษณานี้?</h4>
            </div>

            <div className="space-y-3 text-xs text-muted leading-relaxed">
              <p>
                โฆษณาแสดงตามความสอดคล้องของสไตล์ หมวดหมู่สินค้า และโทนสีที่คุณเลือกดูในระบบ
              </p>

              <div className="p-3 border border-line bg-paper space-y-1">
                <strong className="block font-medium text-charcoal">หลักการความปลอดภัยด้านข้อมูล:</strong>
                <ul className="list-disc list-inside space-y-1">
                  <li>สัดส่วนร่างกาย น้ำหนัก และขนาดตัว **ไม่เคยถูกนำมาใช้โฆษณา**</li>
                  <li>โฆษณาไม่เคยถูกนำไปใส่ในคำสั่ง prompt ของ AI Stylist</li>
                  <li>คุณสามารถปิดโฆษณาแนะนำได้ที่หน้าการตั้งค่าบัญชี</li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-line flex items-center justify-between">
              <Link href="/account/settings" className="text-xs text-olive font-medium hover:underline">
                ไปที่การตั้งค่าโฆษณา →
              </Link>

              <button
                type="button"
                onClick={() => setSelectedAdForInfo(null)}
                className="px-4 py-2 bg-charcoal text-white text-xs font-medium hover:bg-olive transition-colors"
              >
                เข้าใจแล้ว
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
