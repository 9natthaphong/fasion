"use client";

import { useState } from "react";
import { uploadPaymentSlip } from "./actions";

export default function PaymentForm({ requestId, expectedAmount, userId }: { requestId: string, expectedAmount: number, userId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) {
      setFile(null);
      setPreview(null);
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setError("ไฟล์มีขนาดเกิน 5MB");
      return;
    }
    
    if (!selected.type.startsWith("image/")) {
      setError("กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น");
      return;
    }

    setError("");
    setFile(selected);
    const objectUrl = URL.createObjectURL(selected);
    setPreview(objectUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("กรุณาแนบสลิป");
      return;
    }
    if (!confirmed) {
      setError("กรุณายืนยันว่าตรวจสอบข้อมูลแล้ว");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("slip", file);
      formData.append("requestId", requestId);
      formData.append("expectedAmount", expectedAmount.toString());

      const result = await uploadPaymentSlip(formData);
      
      if (result?.error) {
        setError(result.error);
        setIsSubmitting(false);
      }
      // If success, the server action will redirect or revalidate the page.
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการอัปโหลด กรุณาลองใหม่");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-sm rounded border border-destructive/20">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">อัปโหลดสลิปการโอนเงิน (ไม่เกิน 5MB)</label>
        <input 
          type="file" 
          accept="image/jpeg, image/png, image/webp" 
          onChange={handleFileChange}
          disabled={isSubmitting}
          className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80"
        />
      </div>

      {preview && (
        <div className="mt-4">
          <p className="text-sm font-medium mb-2">ภาพตัวอย่าง:</p>
          <div className="relative border rounded p-2 bg-muted/50 inline-block">
            <img src={preview} alt="Slip preview" className="max-w-[200px] h-auto object-contain rounded" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">ไฟล์: {file?.name} ({(file!.size / 1024).toFixed(1)} KB)</p>
        </div>
      )}

      <div className="flex items-start gap-2 pt-2">
        <input 
          type="checkbox" 
          id="confirm" 
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          disabled={isSubmitting}
          className="mt-1"
        />
        <label htmlFor="confirm" className="text-sm">
          ฉันตรวจสอบยอดและข้อมูลการโอนแล้ว
        </label>
      </div>

      <button 
        type="submit" 
        disabled={isSubmitting || !file || !confirmed}
        className="w-full py-2 px-4 bg-[var(--accent-color,theme(colors.olive.dark))] text-primary-foreground rounded font-medium disabled:opacity-50"
      >
        {isSubmitting ? "กำลังอัปโหลด..." : "ส่งเพื่อตรวจสอบ"}
      </button>
    </form>
  );
}
