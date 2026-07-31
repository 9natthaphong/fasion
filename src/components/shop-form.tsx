"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Store, Globe, Sparkles, Check } from "lucide-react";

interface ShopFormProps {
  shop?: {
    name: string;
    slug: string;
    description: string;
    website_url: string | null;
    instagram_url: string | null;
  } | null;
  onboarding?: boolean;
}

export function ShopForm({ shop, onboarding = false }: ShopFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [name, setName] = useState(shop?.name || "");
  const [slug, setSlug] = useState(shop?.slug || "");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/merchant/shop", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form.entries())),
    });
    const result = await response.json();
    setPending(false);
    if (!response.ok) {
      setMessage(result.error ?? "บันทึกข้อมูลร้านไม่สำเร็จ");
      return;
    }
    setMessage("บันทึกข้อมูลโปรไฟล์ร้านเรียบร้อยแล้ว");
    router.push(onboarding ? "/merchant" : "/merchant/shop");
    router.refresh();
  }

  return (
    <form className="space-y-6 max-w-2xl" onSubmit={submit}>
      {onboarding && (
        <div className="p-5 border border-olive/30 bg-olive-pale/30 text-xs text-charcoal space-y-2">
          <div className="flex items-center gap-2 font-mono uppercase font-semibold text-olive">
            <Store className="w-4 h-4" />
            <span>เริ่มต้นเปิดสตูดิโอร้านค้าบน YourStylist</span>
          </div>
          <p className="text-muted leading-relaxed">
            กรอกข้อมูลเบื้องต้นเกี่ยวกับสตูดิโอและแบรนด์ของคุณ ข้อมูลนี้จะใช้แสดงในหน้าโปรไฟล์ร้าน
          </p>
        </div>
      )}

      <div className="p-6 sm:p-8 bg-paper border border-line space-y-5">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-muted uppercase mb-1">ชื่อร้านค้า / สตูดิโอ *</label>
            <input
              name="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slug && e.target.value) {
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
                }
              }}
              required
              minLength={2}
              maxLength={100}
              placeholder="เช่น Quiet Form Studio"
              className="w-full px-4 py-3 border border-line bg-background text-sm text-charcoal focus:border-charcoal outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-muted uppercase mb-1">Slug URL ร้านค้า *</label>
            <input
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              placeholder="quiet-form"
              className="w-full px-4 py-3 border border-line bg-background text-sm text-charcoal focus:border-charcoal outline-none font-mono"
            />
            <small className="text-[11px] text-muted block mt-1">ใช้เป็นส่วนหนึ่งของที่อยู่ URL ร้านค้า เช่น yourstylist.app/shops/{slug || "shop-name"}</small>
          </div>

          <div>
            <label className="block text-xs font-mono text-muted uppercase mb-1">เรื่องราวและเอกลักษณ์ของร้าน</label>
            <textarea
              name="description"
              defaultValue={shop?.description}
              rows={4}
              maxLength={1500}
              placeholder="อธิบายปรัชญาการออกแบบ สไตล์เสื้อผ้า และจุดเด่นของแบรนด์"
              className="w-full p-4 border border-line bg-background text-sm text-charcoal focus:border-charcoal outline-none resize-none"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-muted uppercase mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-olive" />
                <span>เว็บไซต์ร้านค้า (ไม่บังคับ)</span>
              </label>
              <input
                name="websiteUrl"
                defaultValue={shop?.website_url ?? ""}
                type="url"
                placeholder="https://example.com"
                className="w-full px-4 py-3 border border-line bg-background text-sm text-charcoal focus:border-charcoal outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-muted uppercase mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-olive" />
                <span>ลิงก์ Instagram / โซเชียลร้านค้า</span>
              </label>
              <input
                name="instagramUrl"
                defaultValue={shop?.instagram_url ?? ""}
                type="url"
                placeholder="https://instagram.com/shop-name"
                className="w-full px-4 py-3 border border-line bg-background text-sm text-charcoal focus:border-charcoal outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className="p-4 border border-olive/30 bg-olive-pale/30 text-olive-dark text-xs font-medium flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      <div className="flex justify-end">
        <button
          className="px-8 py-4 bg-charcoal text-white hover:bg-olive font-semibold text-xs rounded-none transition-colors disabled:opacity-50 inline-flex items-center gap-2"
          disabled={pending}
          type="submit"
        >
          <Sparkles className="w-4 h-4 text-olive" />
          <span>{pending ? "กำลังบันทึก…" : onboarding ? "สร้างโปรไฟล์สตูดิโอร้านค้า" : "บันทึกการเปลี่ยนแปลง"}</span>
        </button>
      </div>
    </form>
  );
}
