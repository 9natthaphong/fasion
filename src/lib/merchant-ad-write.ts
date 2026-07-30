import type { adSchema } from "@/lib/validation";

type ValidatedAdInput = ReturnType<typeof adSchema.parse>;

export function toAdUpdateRow(data: ValidatedAdInput) {
  return {
    title: data.title,
    description: data.description,
    ad_type: data.adType,
    price_text: data.priceText,
    purchase_info: data.purchaseInfo ?? null,
    cover_image_path: data.coverImagePath,
    starts_at: data.startsAt,
    ends_at: data.endsAt,
    status: "draft",
  };
}

export function toAdInsertRow(data: ValidatedAdInput) {
  return {
    shop_id: data.shopId,
    // The legacy column remains for already-reviewed outbound links. New ads
    // start without one because purchase information is optional plain text.
    destination_url: null,
    ...toAdUpdateRow(data),
  };
}
