-- Migration: Add Pro Membership and Weekly Style Memory
-- Date: 2026-07-31

CREATE TYPE public.customer_plan AS ENUM ('free', 'pro');
CREATE TYPE public.customer_subscription_status AS ENUM ('pending', 'active', 'rejected', 'expired', 'revoked');
CREATE TYPE public.customer_subscription_billing_mode AS ENUM ('manual');

-- 1. Customer Subscriptions
CREATE TABLE public.customer_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan public.customer_plan NOT NULL DEFAULT 'free',
  status public.customer_subscription_status NOT NULL DEFAULT 'pending',
  billing_mode public.customer_subscription_billing_mode NOT NULL DEFAULT 'manual',
  listed_price_thb numeric(10,2),
  approved_price_thb numeric(10,2),
  is_first_month_offer boolean NOT NULL DEFAULT false,
  starts_at timestamptz,
  ends_at timestamptz,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  rejected_reason text,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own subscription"
  ON public.customer_subscriptions FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Admins can read all subscriptions"
  ON public.customer_subscriptions FOR SELECT
  TO authenticated
  USING (private.is_admin());

CREATE POLICY "Admins can update subscriptions"
  ON public.customer_subscriptions FOR UPDATE
  TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

CREATE POLICY "Admins can insert subscriptions"
  ON public.customer_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin());

CREATE TRIGGER customer_subscriptions_set_updated_at
BEFORE UPDATE ON public.customer_subscriptions
FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- 2. Customer Subscription Requests
CREATE TABLE public.customer_subscription_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_plan public.customer_plan NOT NULL,
  offer_code text,
  status public.customer_subscription_status NOT NULL DEFAULT 'pending',
  admin_note text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX unique_pending_subscription_request ON public.customer_subscription_requests(user_id) WHERE status = 'pending';

ALTER TABLE public.customer_subscription_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own requests"
  ON public.customer_subscription_requests FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert requests"
  ON public.customer_subscription_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()) AND status = 'pending');

CREATE POLICY "Admins can read all requests"
  ON public.customer_subscription_requests FOR SELECT
  TO authenticated
  USING (private.is_admin());

CREATE POLICY "Admins can update requests"
  ON public.customer_subscription_requests FOR UPDATE
  TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

CREATE TRIGGER customer_subscription_requests_set_updated_at
BEFORE UPDATE ON public.customer_subscription_requests
FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- 3. Weekly Style Memories
CREATE TABLE public.weekly_style_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  weekday smallint CHECK (weekday BETWEEN 1 AND 7), -- 1=Monday, 7=Sunday
  title text NOT NULL CHECK (char_length(title) <= 100),
  usual_activity text NOT NULL DEFAULT '',
  time_of_day text NOT NULL DEFAULT '',
  location_context text NOT NULL DEFAULT '',
  formality text NOT NULL DEFAULT '',
  preferred_styles text[] NOT NULL DEFAULT '{}',
  preferred_colors text[] NOT NULL DEFAULT '{}',
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  use_for_ai boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, weekday)
);

ALTER TABLE public.weekly_style_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own style memories"
  ON public.weekly_style_memories FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE TRIGGER weekly_style_memories_set_updated_at
BEFORE UPDATE ON public.weekly_style_memories
FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- 4. Weekly Style Memory Outfits
CREATE TABLE public.weekly_style_memory_outfits (
  memory_id uuid NOT NULL REFERENCES public.weekly_style_memories(id) ON DELETE CASCADE,
  saved_outfit_id uuid NOT NULL REFERENCES public.saved_outfits(id) ON DELETE CASCADE,
  PRIMARY KEY (memory_id, saved_outfit_id)
);

ALTER TABLE public.weekly_style_memory_outfits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own style memory outfits"
  ON public.weekly_style_memory_outfits FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.weekly_style_memories m WHERE m.id = memory_id AND m.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.weekly_style_memories m WHERE m.id = memory_id AND m.user_id = (select auth.uid())));

-- 5. Weekly Style Memory Items
CREATE TABLE public.weekly_style_memory_items (
  memory_id uuid NOT NULL REFERENCES public.weekly_style_memories(id) ON DELETE CASCADE,
  wardrobe_item_id uuid NOT NULL, -- references wardrobe_items
  PRIMARY KEY (memory_id, wardrobe_item_id)
);

ALTER TABLE public.weekly_style_memory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own style memory items"
  ON public.weekly_style_memory_items FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.weekly_style_memories m WHERE m.id = memory_id AND m.user_id = (select auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.weekly_style_memories m WHERE m.id = memory_id AND m.user_id = (select auth.uid())));

-- 6. Add Appearance Preferences to Customer Preferences
ALTER TABLE public.customer_preferences
  ADD COLUMN appearance_theme text DEFAULT 'system' CHECK (appearance_theme IN ('system', 'light', 'dark')),
  ADD COLUMN appearance_accent text DEFAULT 'olive' CHECK (appearance_accent IN ('olive', 'muted-indigo', 'burgundy')),
  ADD COLUMN appearance_density text DEFAULT 'editorial' CHECK (appearance_density IN ('editorial', 'compact')),
  ADD COLUMN appearance_reduced_imagery boolean NOT NULL DEFAULT false;

-- Utility Functions
CREATE OR REPLACE FUNCTION public.has_active_pro(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.customer_subscriptions
    WHERE user_id = p_user_id
      AND plan = 'pro'
      AND status = 'active'
      AND (ends_at IS NULL OR ends_at > now())
  )
$$;
