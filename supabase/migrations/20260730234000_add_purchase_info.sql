-- Add purchase_info free-text field to ads table.
-- This replaces the destination-URL-only merchant experience with an open
-- plain-text field where merchants can describe their purchase channel.
--
-- BACKWARD COMPATIBILITY:
--   - destination_url is preserved as a legacy field.
--   - Existing destination_url values are copied into purchase_info where
--     purchase_info is currently null, so legacy ads keep displayable info.
--   - New ads write purchase_info; destination_url is no longer required.
--   - RLS remains unchanged.
--   - The ads table is NOT recreated.

-- 1. Add the column (idempotent via DO block).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ads'
      AND column_name = 'purchase_info'
  ) THEN
    ALTER TABLE public.ads
      ADD COLUMN purchase_info text NULL;
  END IF;
END $$;

-- 2. Add length constraint (idempotent).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ads_purchase_info_length_check'
      AND conrelid = 'public.ads'::regclass
  ) THEN
    ALTER TABLE public.ads
      ADD CONSTRAINT ads_purchase_info_length_check
      CHECK (purchase_info IS NULL OR char_length(purchase_info) <= 500);
  END IF;
END $$;

-- Reject ASCII control characters. PostgreSQL text already rejects null bytes,
-- while this constraint also covers the remaining control range.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ads_purchase_info_safe_text_check'
      AND conrelid = 'public.ads'::regclass
  ) THEN
    ALTER TABLE public.ads
      ADD CONSTRAINT ads_purchase_info_safe_text_check
      CHECK (purchase_info IS NULL OR purchase_info !~ '[[:cntrl:]]');
  END IF;
END $$;

-- 3. Copy existing destination_url values into purchase_info for legacy ads
--    that do not yet have a purchase_info value.
--    URLs longer than the new field limit remain readable through the legacy
--    fallback and are not truncated or overwritten.
UPDATE public.ads
SET purchase_info = destination_url
WHERE purchase_info IS NULL
  AND destination_url IS NOT NULL
  AND char_length(destination_url) <= 500;

-- 4. Update the write trigger so purchase_info follows the same moderation
--    boundary as other merchant-authored ad content.
--    The trigger is replaced in full; all other logic is identical to
--    the 20260730221500 migration version.
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
        -- Active ads may be paused, but reviewed content cannot change.
        IF new.status <> 'paused'
          OR new.title IS DISTINCT FROM old.title
          OR new.slug IS DISTINCT FROM old.slug
          OR new.description IS DISTINCT FROM old.description
          OR new.ad_type IS DISTINCT FROM old.ad_type
          OR new.price_text IS DISTINCT FROM old.price_text
          OR new.purchase_info IS DISTINCT FROM old.purchase_info
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

-- Verification queries (run manually after this complete file succeeds):
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'ads'
--   AND column_name IN ('purchase_info', 'destination_url')
-- ORDER BY column_name;
--
-- SELECT conname, pg_get_constraintdef(oid) AS definition
-- FROM pg_constraint
-- WHERE conrelid = 'public.ads'::regclass
--   AND conname IN (
--     'ads_purchase_info_length_check',
--     'ads_purchase_info_safe_text_check'
--   )
-- ORDER BY conname;
--
-- SELECT
--   count(*) FILTER (WHERE destination_url IS NOT NULL) AS legacy_urls_preserved,
--   count(*) FILTER (
--     WHERE destination_url IS NOT NULL AND purchase_info IS NOT NULL
--   ) AS legacy_rows_with_purchase_info,
--   count(*) FILTER (
--     WHERE purchase_info IS NOT NULL AND char_length(purchase_info) > 500
--   ) AS over_limit_rows
-- FROM public.ads;
--
-- SELECT pg_get_functiondef('private.validate_ad_write()'::regprocedure);
