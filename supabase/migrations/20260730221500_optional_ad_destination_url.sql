-- Make ads.destination_url optional (nullable) and remove Shopee-only domain restriction.
-- Preserves existing data, RLS, and ownership rules.

ALTER TABLE public.ads ALTER COLUMN destination_url DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ads_destination_url_length_check'
  ) THEN
    ALTER TABLE public.ads ADD CONSTRAINT ads_destination_url_length_check CHECK (destination_url IS NULL OR char_length(destination_url) <= 2048);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION private.validate_ad_write()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_shop_eligible boolean;
BEGIN
  IF tg_op = 'UPDATE' AND new.shop_id IS DISTINCT FROM old.shop_id THEN
    RAISE EXCEPTION 'shop_id cannot be changed';
  END IF;

  IF new.cover_image_path IS NOT NULL
    AND NOT private.is_owned_ad_asset_path(new.shop_id, new.cover_image_path)
  THEN
    RAISE EXCEPTION 'cover image must belong to the ad shop';
  END IF;

  IF new.status IN ('pending_review', 'active') THEN
    IF new.cover_image_path IS NULL THEN
      RAISE EXCEPTION 'cover image is required before review';
    END IF;

    IF new.destination_url IS NOT NULL AND new.destination_url !~* '^https://' THEN
      RAISE EXCEPTION 'destination must be an HTTPS URL';
    END IF;

    SELECT EXISTS (
      SELECT 1
      FROM public.shops s
      WHERE s.id = new.shop_id
        AND s.status = 'approved'
        AND s.subscription_status = 'active'
        AND (s.subscription_ends_at IS NULL OR s.subscription_ends_at > now())
        AND s.deleted_at IS NULL
    ) INTO v_shop_eligible;

    IF NOT v_shop_eligible THEN
      RAISE EXCEPTION 'shop is not eligible to submit or activate ads';
    END IF;
  END IF;

  IF (SELECT auth.role()) = 'authenticated' THEN
    IF tg_op = 'INSERT' AND new.status <> 'draft' THEN
      RAISE EXCEPTION 'merchant ads must be created as draft';
    END IF;

    IF tg_op = 'UPDATE' THEN
      IF old.status = 'pending_review' THEN
        RAISE EXCEPTION 'ads under review cannot be changed by merchants';
      ELSIF old.status = 'active' THEN
        IF new.status <> 'paused'
          OR new.title IS DISTINCT FROM old.title
          OR new.slug IS DISTINCT FROM old.slug
          OR new.description IS DISTINCT FROM old.description
          OR new.ad_type IS DISTINCT FROM old.ad_type
          OR new.price_text IS DISTINCT FROM old.price_text
          OR new.destination_url IS DISTINCT FROM old.destination_url
          OR new.cover_image_path IS DISTINCT FROM old.cover_image_path
          OR new.starts_at IS DISTINCT FROM old.starts_at
          OR new.ends_at IS DISTINCT FROM old.ends_at
          OR new.deleted_at IS DISTINCT FROM old.deleted_at
        THEN
          RAISE EXCEPTION 'active ads may only be paused by merchants';
        END IF;
      ELSIF old.status NOT IN ('draft', 'rejected', 'paused') THEN
        RAISE EXCEPTION 'ad state cannot be changed by merchants';
      END IF;

      IF new.status NOT IN ('draft', 'pending_review', 'paused') THEN
        RAISE EXCEPTION 'merchant cannot activate or reject ads';
      END IF;
    END IF;
  END IF;

  RETURN new;
END;
$$;
