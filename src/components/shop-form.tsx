"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

interface ShopFormProps {
  shop?: {
    name: string;
    slug: string;
    description: string;
    shopee_url: string | null;
    instagram_url: string | null;
  } | null;
  onboarding?: boolean;
}

export function ShopForm({ shop, onboarding = false }: ShopFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

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
      setMessage(result.error ?? "บันทึกร้านไม่สำเร็จ");
      return;
    }
    setMessage("บันทึกร้านเรียบร้อย");
    router.push(onboarding ? "/merchant" : "/merchant/shop");
    router.refresh();
  }

  return (
    <form className="stack-form" onSubmit={submit}>
      <label>
        ชื่อร้าน
        <input name="name" defaultValue={shop?.name} required minLength={2} maxLength={100} />
      </label>
      <label>
        Slug ร้าน
        <input
          name="slug"
          defaultValue={shop?.slug}
          required
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          placeholder="my-fashion-shop"
        />
        <small>ใช้ใน URL และแก้ได้ก่อนร้านเผยแพร่</small>
      </label>
      <label>
        เรื่องราวของร้าน
        <textarea name="description" defaultValue={shop?.description} rows={5} maxLength={1500} />
      </label>
      <label>
        ลิงก์ Shopee
        <input
          name="shopeeUrl"
          defaultValue={shop?.shopee_url ?? ""}
          type="url"
          placeholder="https://shopee.co.th/..."
        />
      </label>
      <label>
        ลิงก์ Instagram
        <input
          name="instagramUrl"
          defaultValue={shop?.instagram_url ?? ""}
          type="url"
          placeholder="https://instagram.com/..."
        />
      </label>
      {message ? <p className="form-message" role="status">{message}</p> : null}
      <button className="button button-solid" disabled={pending} type="submit">
        {pending ? "กำลังบันทึก…" : onboarding ? "สร้างโปรไฟล์ร้าน" : "บันทึกการเปลี่ยนแปลง"}
      </button>
    </form>
  );
}
