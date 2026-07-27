"use client";

import { useState, useMemo, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
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
  destination_url: string;
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
      title: form.get("title"),
      slug: form.get("slug"),
      description: form.get("description"),
      adType: form.get("adType"),
      priceText: form.get("priceText") || null,
      destinationUrl: form.get("destinationUrl"),
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

  return (
    <form className="stack-form ad-editor" onSubmit={(event) => { event.preventDefault(); submit(event.currentTarget, "draft"); }}>
      <div className="form-grid">
        <label>ชื่อโฆษณา<input name="title" defaultValue={ad?.title} required maxLength={140} /></label>
        <label>Slug<input name="slug" defaultValue={ad?.slug} required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></label>
      </div>
      <label>รายละเอียด<textarea name="description" defaultValue={ad?.description} rows={6} maxLength={3000} /></label>
      <div className="form-grid">
        <label>
          ประเภท
          <select name="adType" defaultValue={ad?.ad_type ?? "single_product"}>
            <option value="single_product">เสื้อผ้าชิ้นเดียว</option>
            <option value="outfit_set">ชุดเซ็ต</option>
            <option value="collection">คอลเลกชัน</option>
            <option value="promotion">โปรโมชัน</option>
            <option value="shop_feature">โฆษณาร้าน</option>
          </select>
        </label>
        <label>ข้อความราคา<input name="priceText" defaultValue={ad?.price_text ?? ""} maxLength={80} /></label>
      </div>
      <label>ลิงก์ Shopee<input name="destinationUrl" type="url" defaultValue={ad?.destination_url} required /></label>
      <fieldset className="check-grid">
        <legend>หมวดหมู่ (1–5 หมวด)</legend>
        {categories.map((category) => (
          <label key={category.id}>
            <input type="checkbox" name="categoryIds" value={category.id} defaultChecked={selectedCategories.has(category.id)} />
            {category.name_th}
          </label>
        ))}
      </fieldset>

      <ControlledTagSelector
        allTags={allTags}
        selectedTagIds={selectedTagIds}
        onChange={setSelectedTagIds}
        label="แท็กแฟชั่นของโฆษณา (สไตล์, สี, โอกาส, ความเป็นทางการ)"
      />
      <div className="form-grid">
        <label>เริ่มเผยแพร่<input name="startsAt" type="datetime-local" defaultValue={toLocalValue(ad?.starts_at)} /></label>
        <label>สิ้นสุด<input name="endsAt" type="datetime-local" defaultValue={toLocalValue(ad?.ends_at)} /></label>
      </div>
      <section className="upload-panel">
        <div>
          <strong>รูปโฆษณา</strong>
          <p>JPEG, PNG หรือ WebP สูงสุด 6MB ต่อรูป ลากลำดับด้วยปุ่มซ้าย/ขวาหลังอัปโหลด</p>
        </div>
        <label className="button button-ghost upload-button">
          เลือกรูป
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={upload} />
        </label>
        {progress !== null ? <progress value={progress} max={100}>{progress}%</progress> : null}
        <div className="upload-grid">
          {uploaded.map((item, index) => (
            <div className="upload-item" key={item.storage_path}>
              <Image
                src={`/api/assets?bucket=ad-assets&path=${encodeURIComponent(item.storage_path)}`}
                alt={item.alt_text}
                width={180}
                height={220}
                unoptimized
              />
              <input
                aria-label={`Alt text รูป ${index + 1}`}
                value={item.alt_text}
                onChange={(event) => setUploaded((current) => current.map((image, imageIndex) => imageIndex === index ? { ...image, alt_text: event.target.value } : image))}
              />
              <div className="inline-actions">
                <button
                  type="button"
                  aria-label={`เลื่อนรูป ${index + 1} ไปซ้าย`}
                  disabled={index === 0}
                  onClick={() => setUploaded((current) => move(current, index, index - 1))}
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`เลื่อนรูป ${index + 1} ไปขวา`}
                  disabled={index === uploaded.length - 1}
                  onClick={() => setUploaded((current) => move(current, index, index + 1))}
                >
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
                <button type="button" aria-label={`ลบรูป ${index + 1}`} onClick={() => removeImage(index)}>
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
              <label><input type="radio" checked={coverPath === item.storage_path} onChange={() => setCoverPath(item.storage_path)} /> รูปหน้าปก</label>
            </div>
          ))}
        </div>
      </section>
      {message ? <p className="form-message" role="status">{message}</p> : null}
      <div className="inline-actions">
        <button className="button button-ghost" disabled={pending} type="submit">บันทึกร่าง</button>
        <button
          className="button button-solid"
          disabled={pending || !canSubmit || !coverPath}
          type="button"
          onClick={(event) => submit(event.currentTarget.form!, "submit")}
        >
          ส่งตรวจ
        </button>
      </div>
      {!canSubmit ? <p className="muted">ส่งตรวจได้เมื่อร้านอนุมัติและ subscription active แล้ว แต่ยังบันทึกร่างได้</p> : null}
    </form>
  );
}

function move<T>(items: T[], from: number, to: number) {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
