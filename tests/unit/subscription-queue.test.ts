import { describe, expect, it } from "vitest";
import { canCancelInvalidSubscriptionRequest, getSubscriptionQueueState, SUBSCRIPTION_QUEUE_COPY } from "@/lib/subscription-queue";

describe("subscription queue states", () => {
  it.each([
    [{ status: "pending", payment_status: "not_submitted" }, "awaiting_slip"],
    [{ status: "pending", payment_status: "submitted" }, "awaiting_review"],
    [{ status: "pending", payment_status: "needs_resubmission" }, "needs_resubmission"],
    [{ status: "active", payment_status: "verified" }, "active"],
    [{ status: "rejected", payment_status: "not_submitted" }, "history"],
  ] as const)("maps %o to %s", (input, expected) => {
    expect(getSubscriptionQueueState(input)).toBe(expected);
  });

  it("uses the clarified Thai labels and explanations", () => {
    expect(SUBSCRIPTION_QUEUE_COPY.awaiting_slip.label).toBe("รอลูกค้าแนบสลิป");
    expect(SUBSCRIPTION_QUEUE_COPY.awaiting_review.explanation).toBe("ลูกค้าอัปโหลดหลักฐานแล้ว รอผู้ดูแลตรวจสอบ");
    expect(SUBSCRIPTION_QUEUE_COPY.needs_resubmission.label).toBe("ต้องส่งสลิปใหม่");
    expect(SUBSCRIPTION_QUEUE_COPY.active.label).toBe("สมาชิก Pro ที่ใช้งานอยู่");
  });

  it("only allows cancellation for pending requests without a proof", () => {
    expect(canCancelInvalidSubscriptionRequest({ status: "pending", payment_status: "not_submitted", hasProof: false })).toBe(true);
    expect(canCancelInvalidSubscriptionRequest({ status: "pending", payment_status: "submitted", hasProof: true })).toBe(false);
    expect(canCancelInvalidSubscriptionRequest({ status: "active", payment_status: "verified", hasProof: true })).toBe(false);
  });
});
