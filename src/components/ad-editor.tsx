"use client";

import { useState, useMemo, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Trash2, Eye, AlertCircle, ExternalLink, Check } from "lucide-react";
import { ControlledTagSelector } from "@/components/merchant/controlled-tag-selector";
import type { FashionTag } from "@/lib/types";

function toLocalValue(date: string | null | undefined) {
  if (!date) return "";
  const d = new Date(date);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

type EditorAd = {
  id: string;
  title: string;
  slug: string;
  description: string;
  ad_type: string;
  price_text: string | null;
  destination_url: string | null;
  cover_image_path: string | null;
  starts_at: string | null;
  ends_at: string | null;
  status: string;
  ad_categories?: { category_id: string }[];
  ad_fashion_tags?: { tag_id: string }[];
  ad_images?: { storage_path: string; alt_text: string; sort_order: number }[];
};

export function AdEditor({
  shopId,
  categories,
  allTags = [],
  ad,
  canSubmit,
}: {
  shopId: string;
  categories: { id: string; name_th: string }[];
  allTags?: FashionTag[];
  ad?: EditorAd | null;
  canSubmit: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  // Live preview state fields
  const [title, setTitle] = useState(ad?.title || "");
  const [description, setDescription] = useState(ad?.description || "");
  const [priceText, setPriceText] = useState(ad?.price_text || "");
  const [destinationUrl, setDestinationUrl] = useState(ad?.destination_url || "");
  const [adType, setAdType] = useState(ad?.ad_type || "single_product");

  const [uploaded, setUploaded] = useState(
    ad?.ad_images?.sort((a, b) => a.sort_order - b.sort_order) ?? [],
  );
  const [coverPath, setCoverPath] = useState(ad?.cover_image_path ?? "");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    ad?.ad_fashion_tags?.map((t) => t.tag_id) ?? [],
  );
  const selectedCategories = useMemo(
    () => new Set(ad?.ad_categories?.map((item) => item.category_id) ?? []),
    [ad],
  );

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setMessage("");
    for (const file of files.slice(0, 8 - uploaded.length)) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 6_000_000) {
        setMessage("รองรับ JPEG, PNG, WebP ขนาดไม่เกิน 6MB");
        continue;
      }
      const body = new FormData();
      body.set("file", file);
      body.set("shopId", shopId);
      const request = new XMLHttpRequest();
      const result = await new Promise<{ path?: string; error?: string }>((resolve) => {
        request.upload.onprogress = (uploadEvent) =>
          setProgress(Math.round((uploadEvent.loaded / uploadEvent.total) * 100));
        request.onload = () => {
          try {
            resolve(JSON.parse(request.responseText));
          } catch {
            resolve({ error: "อัปโหลดไม่สำเร็จ" });
          }
        };
        request.onerror = () => resolve({ error: "อัปโหลดไม่สำเร็จ" });
        request.open("POST", "/api/merchant/uploads");
        request.send(body);
      });
      setProgress(null);
      if (!result.path) {
        setMessage(result.error ?? "อัปโหลดไม่สำเร็จ");
        continue;
      }
      setUploaded((current) => [
        ...current,
        {
          storage_path: result.path!,
          alt_text: file.name.replace(/\.[^.]+$/, ""),
          sort_order: current.length,
        },
      ]);
      setCoverPath((current) => current || result.path!);
    }
    event.target.value = "";
  }

  async function removeImage(index: number) {
    const target = uploaded[index];
    setUploaded((current) =>
      current.filter((_, currentIndex) => currentIndex !== index).map((item, sort_order) => ({
        ...item,
        sort_order,
      })),
    );
    if (coverPath === target.storage_path) setCoverPath("");
    await fetch("/api/merchant/uploads", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ shopId, path: target.storage_path }),
    });
  }

  async function submit(formElement: HTMLFormElement, intent: "draft" | "submit") {
    setPending(true);
    setMessage("");
    const form = new FormData(formElement);
    const body = {
      shopId,
      title: title || form.get("title"),
      description: description || form.get("description"),
      adType: adType || form.get("adType"),
      priceText: priceText || form.get("priceText") || null,
      destinationUrl: destinationUrl || form.get("destinationUrl"),
      coverImagePath: coverPath || null,
      categoryIds: form.getAll("categoryIds"),
      tagIds: selectedTagIds,
      images: uploaded.map((item, sortOrder) => ({
        storagePath: item.storage_path,
        altText: item.alt_text,
        sortOrder,
      })),
      startsAt: form.get("startsAt") ? new Date(String(form.get("startsAt"))).toISOString() : null,
      endsAt: form.get("endsAt") ? new Date(String(form.get("endsAt"))).toISOString() : null,
      intent,
    };
    const response = await fetch(ad ? `/api/merchant/ads/${ad.id}` : "/api/merchant/ads", {
      method: ad ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();

    if (response.ok && result.ad?.id) {
      await fetch(`/api/merchant/ads/${result.ad.id}/tags`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tagIds: selectedTagIds }),
      });
    }

    setPending(false);
    if (!response.ok) {
      setMessage(result.error ?? "บันทึกโฆษณาไม่สำเร็จ");
      return;
    }
    setMessage(intent === "submit" ? "ส่งตรวจเรียบร้อย" : "บันทึกร่างเรียบร้อย");
    router.push("/merchant/ads");
    router.refresh();
  }

  const coverUrl = coverPath
    ? `/api/assets?bucket=ad-assets&path=${encodeURIComponent(coverPath)}`
    : "/demo-assets/ad-linen-shirt.jpg";

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
      {/* Main Ad Creation Form */}
      <form
        className="space-y-8"
        onSubmit={(event) => {
          event.preventDefault();
          submit(event.currentTarget, "draft");
        }}
      >
        {/* Step 1: Basic Information */}
        <div className="p-6 sm:p-8 bg-paper border border-line space-y-5">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <span className="font-mono text-xs text-muted uppercase">Step 1 / Basics</span>
            <span className="text-xs text-olive font-medium">ชื่อ & ลิงก์สินค้า</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-muted uppercase mb-1">ชื่อโฆษณา / สินค้า *</label>
              <input
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={140}
                placeholder="เช่น เสื้อเชิ้ตคอตตอนลินินทรงหลวม"
                className="w-full px-4 py-3 border border-line bg-background text-sm text-charcoal focus:border-charcoal outline-none"
              />
            </div>

            {ad?.slug && (
              <div className="p-3 border border-line bg-background text-xs space-y-1">
                <span className="font-mono text-muted uppercase block">ลิงก์สาธารณะโฆษณา:</span>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-charcoal font-mono select-all">/ads/{ad.slug}</code>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        navigator.clipboard.writeText(`${window.location.origin}/ads/${ad.slug}`);
                      }
                    }}
                    className="px-2.5 py-1 text-[11px] border border-line hover:bg-paper font-medium transition-colors"
                  >
                    คัดลอกลิงก์
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-muted uppercase mb-1">รายละเอียดสินค้า</label>
              <textarea
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={3000}
                placeholder="อธิบายจุดเด่นของสินค้า คอลเลกชัน หรือส่วนลดสำหรับผู้ซื้อ"
                className="w-full p-4 border border-line bg-background text-sm text-charcoal focus:border-charcoal outline-none"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-muted uppercase mb-1">ประเภทโฆษณา</label>
                <select
                  name="adType"
                  value={adType}
                  onChange={(e) => setAdType(e.target.value)}
                  className="w-full px-4 py-3 border border-line bg-background text-sm text-charcoal focus:border-charcoal outline-none"
                >
                  <option value="single_product">เสื้อผ้าชิ้นเดียว (Single Product)</option>
                  <option value="outfit_set">ชุดเซ็ต (Outfit Set)</option>
                  <option value="collection">คอลเลกชัน (Collection)</option>
                  <option value="promotion">โปรโมชันพิเศษ (Promotion)</option>
                  <option value="shop_feature">แนะนำร้านค้า (Shop Feature)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-muted uppercase mb-1">ข้อความราคาที่แสดง</label>
                <input
                  name="priceText"
                  value={priceText}
                  onChange={(e) => setPriceText(e.target.value)}
                  maxLength={80}
                  placeholder="เช่น 1,290 บาท / ลด 20%"
                  className="w-full px-4 py-3 border border-line bg-background text-sm text-charcoal focus:border-charcoal outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-muted uppercase mb-1">ลิงก์ร้านค้าหรือหน้าสินค้า (ไม่บังคับ)</label>
              <p className="text-xs text-muted mb-2">ใส่ลิงก์หน้าสินค้า หน้าร้าน หรือช่องทางสั่งซื้อของคุณได้ ผู้ดูแลจะตรวจสอบก่อนเผยแพร่ หากไม่ใส่ โฆษณาจะไม่มีปุ่มไปยังร้านค้า</p>
              <input
                name="destinationUrl"
                type="text"
                value={destinationUrl}
                onChange={(e) => setDestinationUrl(e.target.value)}
                placeholder="https://example.com/product"
                className="w-full px-4 py-3 border border-line bg-background text-sm text-charcoal focus:border-charcoal outline-none"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Taxonomy & Tags */}
        <div className="p-6 sm:p-8 bg-paper border border-line space-y-5">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <span className="font-mono text-xs text-muted uppercase">Step 2 / Taxonomy</span>
            <span className="text-xs text-muted">เลือก 1-5 หมวด</span>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-xs font-mono text-muted uppercase mb-2">หมวดหมู่สินค้า</legend>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="p-3 border border-line bg-background text-xs font-medium text-charcoal flex items-center gap-2 cursor-pointer hover:border-charcoal transition-colors"
                >
                  <input
                    type="checkbox"
                    name="categoryIds"
                    value={category.id}
                    defaultChecked={selectedCategories.has(category.id)}
                    className="w-4 h-4 accent-charcoal cursor-pointer"
                  />
                  <span>{category.name_th}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="pt-2">
            <ControlledTagSelector
              allTags={allTags}
              selectedTagIds={selectedTagIds}
              onChange={setSelectedTagIds}
              label="แท็กแฟชั่นโฆษณา (สไตล์, สี, กิจกรรมที่เหมาะ)"
            />
          </div>
        </div>

        {/* Step 3: Images & Upload */}
        <div className="p-6 sm:p-8 bg-paper border border-line space-y-5">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <span className="font-mono text-xs text-muted uppercase">Step 3 / Media</span>
            <span className="text-xs text-muted">สูงสุด 8 รูปภาพ</span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <strong className="block text-sm text-charcoal">รูปภาพสินค้า & หน้าปก</strong>
                <p className="text-xs text-muted">รองรับ JPEG, PNG, WebP ขนาดไม่เกิน 6 MB ต่อรูปภาพ</p>
              </div>

              <label className="px-5 py-2.5 border border-charcoal bg-charcoal text-white hover:bg-olive text-xs font-medium cursor-pointer inline-flex items-center gap-2 transition-colors">
                <span>+ เลือกรูปภาพ</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={upload} className="hidden" />
              </label>
            </div>

            {progress !== null && (
              <div className="w-full bg-line/40 h-2 overflow-hidden">
                <div className="bg-olive h-full transition-all duration-200" style={{ width: `${progress}%` }}></div>
              </div>
            )}

            {uploaded.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                {uploaded.map((item, index) => (
                  <div key={item.storage_path} className="border border-line bg-background p-2 space-y-2 relative group">
                    <div className="aspect-[4/5] relative overflow-hidden bg-paper border border-line">
                      <Image
                        src={`/api/assets?bucket=ad-assets&path=${encodeURIComponent(item.storage_path)}`}
                        alt={item.alt_text}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>

                    <input
                      aria-label={`Alt text รูป ${index + 1}`}
                      value={item.alt_text}
                      onChange={(event) =>
                        setUploaded((current) =>
                          current.map((image, imageIndex) =>
                            imageIndex === index ? { ...image, alt_text: event.target.value } : image,
                          ),
                        )
                      }
                      placeholder="คำอธิบายรูป"
                      className="w-full p-1.5 border border-line bg-paper text-[11px] outline-none"
                    />

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => setUploaded((current) => move(current, index, index - 1))}
                          className="p-1 border border-line hover:bg-paper disabled:opacity-30"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={index === uploaded.length - 1}
                          onClick={() => setUploaded((current) => move(current, index, index + 1))}
                          className="p-1 border border-line hover:bg-paper disabled:opacity-30"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="p-1 text-danger hover:bg-danger/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <label className="flex items-center gap-1.5 text-[11px] text-muted cursor-pointer pt-1 border-t border-line/60">
                      <input
                        type="radio"
                        name="coverSelection"
                        checked={coverPath === item.storage_path}
                        onChange={() => setCoverPath(item.storage_path)}
                        className="w-3 h-3 accent-charcoal"
                      />
                      <span>รูปหน้าปก</span>
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 border border-dashed border-line text-center text-xs text-muted space-y-1">
                <p>ยังไม่มีรูปภาพที่อัปโหลด กรุณาคลิกปุ่มเลือกรูปภาพเพื่ออัปโหลดรูปหน้าปก</p>
              </div>
            )}
          </div>
        </div>

        {/* Schedule */}
        <div className="p-6 sm:p-8 bg-paper border border-line space-y-4">
          <h3 className="font-serif text-xl text-charcoal">กำหนดเวลาเผยแพร่</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-muted uppercase mb-1">เริ่มเผยแพร่</label>
              <input
                name="startsAt"
                type="datetime-local"
                defaultValue={toLocalValue(ad?.starts_at)}
                className="w-full px-4 py-3 border border-line bg-background text-sm text-charcoal focus:border-charcoal outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-muted uppercase mb-1">สิ้นสุด</label>
              <input
                name="endsAt"
                type="datetime-local"
                defaultValue={toLocalValue(ad?.ends_at)}
                className="w-full px-4 py-3 border border-line bg-background text-sm text-charcoal focus:border-charcoal outline-none"
              />
            </div>
          </div>
        </div>

        {message && (
          <div className="p-4 border border-olive/30 bg-olive-pale/30 text-olive-dark text-xs font-medium flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{message}</span>
          </div>
        )}

        {/* Submit Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-paper border border-line">
          <div className="text-xs text-muted">
            {!canSubmit ? (
              <span className="text-warning flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>สามารถบันทึกร่างได้ และจะส่งให้ผู้ดูแลตรวจสอบได้เมื่อร้านอนุมัติพร้อม subscription active</span>
              </span>
            ) : (
              <div className="space-y-0.5">
                <span className="block font-medium text-charcoal">พร้อมสำหรับการส่งให้ผู้ดูแลตรวจสอบ</span>
                <span className="block text-[11px] text-muted">ระบบจะตรวจสอบความครบถ้วนของข้อมูลก่อนส่งให้ผู้ดูแล โดยไม่มีการใช้ AI ตรวจเนื้อหาโฆษณา</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              className="px-6 py-3.5 border border-line text-charcoal hover:bg-background font-medium text-xs rounded-none transition-colors"
              disabled={pending}
              type="submit"
            >
              บันทึกร่าง
            </button>
            <button
              className="px-8 py-3.5 bg-charcoal text-white hover:bg-olive font-semibold text-xs rounded-none transition-colors disabled:opacity-50 inline-flex items-center gap-2"
              disabled={pending || !canSubmit || !coverPath || !title}
              type="button"
              onClick={(event) => submit(event.currentTarget.form!, "submit")}
            >
              <Check className="w-4 h-4 text-olive" />
              <span>ส่งให้ผู้ดูแลตรวจสอบ</span>
            </button>
          </div>
        </div>
      </form>

      {/* Live Preview Sidebar */}
      <aside className="space-y-6 sticky top-24">
        <div className="p-6 bg-paper border border-line space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-olive" />
              <h3 className="font-serif text-lg font-normal text-charcoal">ตัวอย่างการแสดงผลจริง</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-background border border-line">Live Preview</span>
          </div>

          {/* Render exact mock of Ad Card */}
          <div className="border border-line bg-background p-4 space-y-3">
            <div className="aspect-[4/5] relative bg-paper border border-line overflow-hidden">
              <Image src={coverUrl} alt="Preview" fill className="object-cover" unoptimized />
              <div className="absolute top-2 left-2">
                <span className="px-2 py-0.5 bg-black/80 backdrop-blur-xs text-white text-[10px] font-mono font-medium">
                  โฆษณา
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-olive uppercase block">สตูดิโอร้านค้าของคุณ</span>
              <h4 className="font-serif text-base font-normal text-charcoal line-clamp-1">
                {title || "ชื่อโฆษณาสินค้า"}
              </h4>
              <p className="text-xs text-muted line-clamp-2">{description || "รายละเอียดสินค้าจะแสดงที่นี่..."}</p>
            </div>

            <div className="pt-3 border-t border-line flex items-center justify-between">
              <span className="text-xs font-medium text-charcoal font-mono">{priceText || "฿ 1,290"}</span>
              {destinationUrl && destinationUrl.trim().startsWith("https://") ? (
                <span className="px-3 py-1.5 bg-charcoal text-white text-[10px] font-medium inline-flex items-center gap-1">
                  <span>ไปยังร้านค้า</span>
                  <ExternalLink className="w-3 h-3" />
                </span>
              ) : null}
            </div>
          </div>

          <p className="text-xs text-muted leading-relaxed">
            ตัวอย่างโฆษณาสินค้าเมื่อแสดงในหน้า Discover และหน้าคำแนะนำเพิ่มเติมสำหรับผู้ซื้อ
          </p>
        </div>
      </aside>
    </div>
  );
}

function move<T>(items: T[], from: number, to: number) {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
