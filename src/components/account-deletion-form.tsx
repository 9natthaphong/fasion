"use client";

import { useState, type FormEvent } from "react";

export function AccountDeletionForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch("/api/account/delete-request", {
      method: "POST",
      headers: { accept: "application/json" },
      body: new FormData(event.currentTarget),
    });
    const body = (await response.json().catch(() => null)) as {
      error?: string;
      redirectTo?: string;
    } | null;
    if (!response.ok) {
      setPending(false);
      setError(body?.error ?? "ส่งคำขอไม่สำเร็จ กรุณาลองอีกครั้ง");
      return;
    }
    window.location.assign(body?.redirectTo ?? "/");
  }

  return (
    <form onSubmit={submit}>
      <label>
        พิมพ์ DELETE เพื่อยืนยัน
        <input name="confirmation" pattern="DELETE" required />
      </label>
      {error ? <div className="alert alert-error" role="alert">{error}</div> : null}
      <button type="submit" className="button button-danger" disabled={pending}>
        {pending ? "กำลังส่งคำขอ…" : "ส่งคำขอลบบัญชี"}
      </button>
    </form>
  );
}
