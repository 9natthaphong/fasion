"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdRowActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, setPending] = useState("");
  async function run(action: "duplicate" | "pause") {
    setPending(action);
    const response = await fetch(`/api/merchant/ads/${id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setPending("");
    if (response.ok) router.refresh();
  }
  return (
    <>
      <button className="text-button" type="button" disabled={Boolean(pending)} onClick={() => run("duplicate")}>{pending === "duplicate" ? "กำลังทำสำเนา…" : "ทำสำเนา"}</button>
      {status === "active" ? <button className="text-button danger-text" type="button" disabled={Boolean(pending)} onClick={() => run("pause")}>{pending === "pause" ? "กำลัง Pause…" : "Pause"}</button> : null}
    </>
  );
}
