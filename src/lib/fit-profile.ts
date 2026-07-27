import { createClient } from "@/lib/supabase/server";
import { customerFitProfileSchema } from "@/lib/validation";
import type { CustomerFitProfile } from "@/lib/types";

export async function getFitProfile(userId: string): Promise<CustomerFitProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_fit_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching fit profile:", error);
    return null;
  }
  return data as CustomerFitProfile | null;
}

export async function upsertFitProfile(
  userId: string,
  input: unknown,
): Promise<CustomerFitProfile> {
  const parsed = customerFitProfileSchema.parse(input);
  const supabase = await createClient();

  const row = {
    user_id: userId,
    height_cm: parsed.heightCm ?? null,
    weight_kg: parsed.weightKg ?? null,
    chest_cm: parsed.chestCm ?? null,
    bust_cm: parsed.bustCm ?? null,
    waist_cm: parsed.waistCm ?? null,
    hips_cm: parsed.hipsCm ?? null,
    shoulder_width_cm: parsed.shoulderWidthCm ?? null,
    inseam_cm: parsed.inseamCm ?? null,
    sleeve_length_cm: parsed.sleeveLengthCm ?? null,
    shoe_length_cm: parsed.shoeLengthCm ?? null,
    usual_top_size: parsed.usualTopSize ?? null,
    usual_bottom_size: parsed.usualBottomSize ?? null,
    usual_shoe_size: parsed.usualShoeSize ?? null,
    self_described_body_shape: parsed.selfDescribedBodyShape ?? null,
    skin_undertone: parsed.skinUndertone ?? null,
    skin_depth: parsed.skinDepth ?? null,
    color_contrast_preference: parsed.colorContrastPreference ?? null,
    fit_notes: parsed.fitNotes ?? null,
    use_for_ai_styling: parsed.useForAiStyling,
    use_wardrobe_for_personalization: parsed.useWardrobeForPersonalization,
    enable_personalized_ads: parsed.enablePersonalizedAds,
    personalized_ads_consent_at: parsed.personalizedAdsConsentAt ?? null,
    personalization_reset_at: parsed.personalizationResetAt ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("customer_fit_profiles")
    .upsert(row, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save fit profile: ${error.message}`);
  }

  return data as CustomerFitProfile;
}

export async function deleteFitProfile(userId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("customer_fit_profiles")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to delete fit profile: ${error.message}`);
  }
}
