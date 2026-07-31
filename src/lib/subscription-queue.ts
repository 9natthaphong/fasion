export type SubscriptionQueueState = "awaiting_slip" | "awaiting_review" | "needs_resubmission" | "active" | "history";

export function getSubscriptionQueueState(input: { status: string; payment_status?: string | null }): SubscriptionQueueState {
  if (input.status === "active") return "active";
  if (input.status === "rejected") return "history";
  if (input.status === "pending" && input.payment_status === "submitted") return "awaiting_review";
  if (input.status === "pending" && input.payment_status === "needs_resubmission") return "needs_resubmission";
  return "awaiting_slip";
}

export function canCancelInvalidSubscriptionRequest(input: { status: string; payment_status?: string | null; hasProof: boolean }) {
  return input.status === "pending" && input.payment_status === "not_submitted" && !input.hasProof;
}

export const SUBSCRIPTION_QUEUE_COPY = {
  awaiting_slip: {
    label: "รอลูกค้าแนบสลิป",
    explanation: "ลูกค้าส่งคำขอแล้ว แต่ยังไม่ได้อัปโหลดหลักฐานการชำระเงิน",
  },
  awaiting_review: {
    label: "รอตรวจสอบสลิป",
    explanation: "ลูกค้าอัปโหลดหลักฐานแล้ว รอผู้ดูแลตรวจสอบ",
  },
  needs_resubmission: {
    label: "ต้องส่งสลิปใหม่",
    explanation: "ผู้ดูแลขอหลักฐานใหม่จากลูกค้า",
  },
  active: { label: "สมาชิก Pro ที่ใช้งานอยู่", explanation: "" },
  history: { label: "ประวัติคำขอ", explanation: "" },
} as const;
