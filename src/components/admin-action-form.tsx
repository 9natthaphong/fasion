"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminActionForm({
  endpoint,
  actions,
  withDate = false,
}: {
  endpoint: string;
  actions: { value: string; label: string; tone?: "danger" }[];
  withDate?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState("");
  const [message, setMessage] = useState("");

  async function run(action: string) {
    setPending(action);
    setMessage("");
    const date = document.querySelector<HTMLInputElement>("#subscription-ends-at")?.value;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action,
        subscriptionEndsAt: date ? new Date(date).toISOString() : null,
      }),
    });
    const result = await response.json();
    setPending("");
    setMessage(response.ok ? "อัปเดตสถานะเรียบร้อย" : result.error ?? "อัปเดตไม่สำเร็จ");
    if (response.ok) router.refresh();
  }

  return (
    <div className="admin-actions">
      {withDate ? <label>วันหมดอายุ subscription<input id="subscription-ends-at" type="date" /></label> : null}
      <div className="inline-actions">
        {actions.map((action) => (
          <button key={action.value} className={`button ${action.tone === "danger" ? "button-danger" : "button-ghost"}`} disabled={Boolean(pending)} type="button" onClick={() => run(action.value)}>
            {pending === action.value ? "กำลังทำ…" : action.label}
          </button>
        ))}
      </div>
      {message ? <p className="form-message" role="status">{message}</p> : null}
    </div>
  );
}
