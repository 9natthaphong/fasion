"use client";

import { useState } from "react";
import { Loader2, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

interface Props {
  requestId: string;
  userId: string;
  createdAt: string;
  userDisplayName?: string | null;
}

export function AdminDeletionRequestCard({ requestId, userId, createdAt, userDisplayName }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleProcess = async () => {
    if (!confirm(`คุณต้องการประมวลผลลบบัญชีและทำลายข้อมูลส่วนตัวของผู้ใช้ ${userId} หรือไม่?`)) return;

    setIsProcessing(true);
    setMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/admin/account-deletion/${requestId}/process`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "ประมวลผลไม่สำเร็จ");
      }

      setMsg("ประมวลผลลบบัญชีและล้างข้อมูลส่วนตัวเรียบร้อยแล้ว");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการลบบัญชี");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 border border-line bg-paper space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <strong className="text-sm text-charcoal font-medium block">
            {userDisplayName || "ผู้ใช้ทั่วไป"} ({userId.slice(0, 8)}…)
          </strong>
          <span className="text-xs text-muted">
            ส่งคำขอเมื่อ: {new Date(createdAt).toLocaleDateString("th-TH")}
          </span>
        </div>

        {msg ? (
          <span className="text-xs text-success font-medium inline-flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>{msg}</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={handleProcess}
            disabled={isProcessing}
            className="px-4 py-2 bg-danger text-background text-xs font-medium hover:bg-danger/90 inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>กำลังทำลายข้อมูล...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>อนุมัติและทำลายข้อมูล (Stage 2)</span>
              </>
            )}
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="text-xs text-danger font-medium flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
