"use client";

import { Heart } from "lucide-react";
import { useState } from "react";

export function LikeButton({ adId, initialLiked = false }: { adId: string; initialLiked?: boolean }) {
  const [liked, setLiked] = useState(initialLiked);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function toggle() {
    const before = liked;
    setLiked(!before);
    setPending(true);
    setError("");
    const response = await fetch(`/api/likes/${adId}`, { method: before ? "DELETE" : "POST" });
    setPending(false);
    if (!response.ok) {
      setLiked(before);
      setError(response.status === 401 ? "เข้าสู่ระบบลูกค้าก่อนกดถูกใจ" : "บันทึกไม่สำเร็จ ลองอีกครั้ง");
    }
  }
  return (
    <div>
      <button type="button" className="button button-ghost" disabled={pending} onClick={toggle} aria-pressed={liked}>
        <Heart className="w-4 h-4" fill={liked ? "currentColor" : "none"} aria-hidden="true" />
        {liked ? "ถูกใจแล้ว" : "ถูกใจ"}
      </button>
      {error ? <small className="field-error">{error}</small> : null}
    </div>
  );
}
