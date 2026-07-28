-- Migration: Add customer fit profiles, controlled fashion taxonomy, saved outfits, wear logs, outfit feedback, and RLS policies
-- Date: 2026-07-28

-- 1. Customer Fit Profiles Table
CREATE TABLE IF NOT EXISTS public.customer_fit_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  height_cm numeric CHECK (height_cm IS NULL OR (height_cm >= 50 AND height_cm <= 250)),
  weight_kg numeric CHECK (weight_kg IS NULL OR (weight_kg >= 20 AND weight_kg <= 300)),
  chest_cm numeric CHECK (chest_cm IS NULL OR (chest_cm >= 40 AND chest_cm <= 200)),
  bust_cm numeric CHECK (bust_cm IS NULL OR (bust_cm >= 40 AND bust_cm <= 200)),
  waist_cm numeric CHECK (waist_cm IS NULL OR (waist_cm >= 30 AND waist_cm <= 200)),
  hips_cm numeric CHECK (hips_cm IS NULL OR (hips_cm >= 40 AND hips_cm <= 200)),
  shoulder_width_cm numeric CHECK (shoulder_width_cm IS NULL OR (shoulder_width_cm >= 20 AND shoulder_width_cm <= 100)),
  inseam_cm numeric CHECK (inseam_cm IS NULL OR (inseam_cm >= 30 AND inseam_cm <= 150)),
  sleeve_length_cm numeric CHECK (sleeve_length_cm IS NULL OR (sleeve_length_cm >= 20 AND sleeve_length_cm <= 120)),
  shoe_length_cm numeric CHECK (shoe_length_cm IS NULL OR (shoe_length_cm >= 10 AND shoe_length_cm <= 50)),
  usual_top_size text,
  usual_bottom_size text,
  usual_shoe_size text,
  self_described_body_shape text CHECK (self_described_body_shape IS NULL OR self_described_body_shape IN ('straight', 'triangle', 'inverted_triangle', 'oval', 'hourglass', 'unsure', 'prefer_not_to_say')),
  skin_undertone text CHECK (skin_undertone IS NULL OR skin_undertone IN ('warm', 'cool', 'neutral', 'olive', 'unsure', 'prefer_not_to_say')),
  skin_depth text CHECK (skin_depth IS NULL OR skin_depth IN ('very_light', 'light', 'medium', 'tan', 'deep', 'very_deep', 'prefer_not_to_say')),
  color_contrast_preference text,
  fit_notes text,
  use_for_ai_styling boolean NOT NULL DEFAULT false,
  use_wardrobe_for_personalization boolean NOT NULL DEFAULT false,
  enable_personalized_ads boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customer_fit_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own fit profile"
  ON public.customer_fit_profiles
  FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));


-- 2. Controlled Fashion Taxonomy Table
CREATE TABLE IF NOT EXISTS public.fashion_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_type text NOT NULL CHECK (tag_type IN ('style', 'color', 'occasion', 'formality', 'fit', 'weather', 'season', 'item_type', 'audience')),
  name_th text NOT NULL,
  name_en text NOT NULL,
  slug text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_fashion_tags_type_slug UNIQUE (tag_type, slug),
  CONSTRAINT uq_fashion_tags_type_nameth UNIQUE (tag_type, name_th)
);

ALTER TABLE public.fashion_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active fashion tags"
  ON public.fashion_tags
  FOR SELECT
  TO public
  USING (is_active = true);


-- 3. Shop Fashion Tags Join Table
CREATE TABLE IF NOT EXISTS public.shop_fashion_tags (
  shop_id uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.fashion_tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (shop_id, tag_id)
);

ALTER TABLE public.shop_fashion_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shop fashion tags"
  ON public.shop_fashion_tags
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Shop owners can write shop fashion tags"
  ON public.shop_fashion_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shop_members sm
      WHERE sm.shop_id = shop_fashion_tags.shop_id
        AND sm.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Shop owners can delete shop fashion tags"
  ON public.shop_fashion_tags
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.shop_members sm
      WHERE sm.shop_id = shop_fashion_tags.shop_id
        AND sm.user_id = (select auth.uid())
    )
  );


-- 4. Ad Fashion Tags Join Table
CREATE TABLE IF NOT EXISTS public.ad_fashion_tags (
  ad_id uuid NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.fashion_tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (ad_id, tag_id)
);

ALTER TABLE public.ad_fashion_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ad fashion tags"
  ON public.ad_fashion_tags
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Shop owners can write ad fashion tags"
  ON public.ad_fashion_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ads a
      JOIN public.shop_members sm ON sm.shop_id = a.shop_id
      WHERE a.id = ad_fashion_tags.ad_id
        AND sm.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Shop owners can delete ad fashion tags"
  ON public.ad_fashion_tags
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ads a
      JOIN public.shop_members sm ON sm.shop_id = a.shop_id
      WHERE a.id = ad_fashion_tags.ad_id
        AND sm.user_id = (select auth.uid())
    )
  );


-- 5. Saved Outfits Table
CREATE TABLE IF NOT EXISTS public.saved_outfits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  outfit_result_id uuid REFERENCES public.outfit_results(id) ON DELETE SET NULL,
  name text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('safe', 'elevated', 'comfortable', 'custom')),
  notes text,
  is_favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

ALTER TABLE public.saved_outfits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own saved outfits"
  ON public.saved_outfits
  FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));


-- 6. Saved Outfit Items Table
CREATE TABLE IF NOT EXISTS public.saved_outfit_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_outfit_id uuid NOT NULL REFERENCES public.saved_outfits(id) ON DELETE CASCADE,
  wardrobe_item_id uuid REFERENCES public.wardrobe_items(id) ON DELETE SET NULL,
  item_role text NOT NULL,
  item_description text,
  styling_instruction text,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.saved_outfit_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage saved outfit items"
  ON public.saved_outfit_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.saved_outfits so
      WHERE so.id = saved_outfit_items.saved_outfit_id
        AND so.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.saved_outfits so
      WHERE so.id = saved_outfit_items.saved_outfit_id
        AND so.user_id = (select auth.uid())
    )
  );


-- 7. Wear Logs Table
CREATE TABLE IF NOT EXISTS public.wear_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  saved_outfit_id uuid REFERENCES public.saved_outfits(id) ON DELETE SET NULL,
  outfit_result_id uuid REFERENCES public.outfit_results(id) ON DELETE SET NULL,
  worn_on date NOT NULL DEFAULT CURRENT_DATE,
  occasion text,
  weather_note text,
  comfort_rating integer CHECK (comfort_rating IS NULL OR (comfort_rating >= 1 AND comfort_rating <= 5)),
  confidence_rating integer CHECK (confidence_rating IS NULL OR (confidence_rating >= 1 AND confidence_rating <= 5)),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wear_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own wear logs"
  ON public.wear_logs
  FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));


-- 8. Outfit Feedback Table
CREATE TABLE IF NOT EXISTS public.outfit_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  outfit_result_id uuid NOT NULL REFERENCES public.outfit_results(id) ON DELETE CASCADE,
  outfit_index integer NOT NULL,
  rating text NOT NULL CHECK (rating IN ('liked', 'neutral', 'disliked')),
  feedback_tags text[] NOT NULL DEFAULT '{}',
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_outfit_feedback_user_result_index UNIQUE (user_id, outfit_result_id, outfit_index)
);

ALTER TABLE public.outfit_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own outfit feedback"
  ON public.outfit_feedback
  FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));


-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_fashion_tags_type_slug ON public.fashion_tags (tag_type, slug);
CREATE INDEX IF NOT EXISTS idx_shop_fashion_tags_shop ON public.shop_fashion_tags (shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_fashion_tags_tag ON public.shop_fashion_tags (tag_id);
CREATE INDEX IF NOT EXISTS idx_ad_fashion_tags_ad ON public.ad_fashion_tags (ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_fashion_tags_tag ON public.ad_fashion_tags (tag_id);
CREATE INDEX IF NOT EXISTS idx_saved_outfits_user ON public.saved_outfits (user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_wear_logs_user_date ON public.wear_logs (user_id, worn_on);
CREATE INDEX IF NOT EXISTS idx_outfit_feedback_user ON public.outfit_feedback (user_id);

CREATE INDEX IF NOT EXISTS idx_outfit_feedback_result ON public.outfit_feedback (outfit_result_id);
CREATE INDEX IF NOT EXISTS idx_saved_outfit_items_outfit ON public.saved_outfit_items (saved_outfit_id);
CREATE INDEX IF NOT EXISTS idx_saved_outfit_items_wardrobe ON public.saved_outfit_items (wardrobe_item_id);
CREATE INDEX IF NOT EXISTS idx_saved_outfits_result ON public.saved_outfits (outfit_result_id);
CREATE INDEX IF NOT EXISTS idx_wear_logs_result ON public.wear_logs (outfit_result_id);
CREATE INDEX IF NOT EXISTS idx_wear_logs_saved ON public.wear_logs (saved_outfit_id);


-- Seed Controlled Fashion Taxonomy
INSERT INTO public.fashion_tags (tag_type, name_th, name_en, slug, sort_order) VALUES
-- Styles
('style', 'มินิมอล', 'Minimal', 'minimal', 1),
('style', 'สมาร์ทลำลอง', 'Smart Casual', 'smart-casual', 2),
('style', 'สตรีตแวร์', 'Streetwear', 'streetwear', 3),
('style', 'เวิร์กแวร์', 'Workwear', 'workwear', 4),
('style', 'คลาสสิก', 'Classic', 'classic', 5),
('style', 'โรแมนติก', 'Romantic', 'romantic', 6),
('style', 'สปอร์ต', 'Sporty', 'sporty', 7),
('style', 'วินเทจ', 'Vintage', 'vintage', 8),
('style', 'เพรพพี', 'Preppy', 'preppy', 9),
('style', 'รีสอร์ต / ชายหาด', 'Resort', 'resort', 10),
('style', 'คุมโทนเดี่ยว', 'Monochrome', 'monochrome', 11),
('style', 'ลำลองสบายๆ', 'Casual', 'casual', 12),
('style', 'ร่วมสมัย', 'Contemporary', 'contemporary', 13),
('style', 'สไตล์เกาหลี', 'Korean Inspired', 'korean-inspired', 14),
('style', 'สไตล์ญี่ปุ่น', 'Japanese Inspired', 'japanese-inspired', 15),

-- Occasions
('occasion', 'ไปทำงาน', 'Work', 'work', 1),
('occasion', 'ไปมหาวิทยาลัย', 'University', 'university', 2),
('occasion', 'ไปคาเฟ่', 'Cafe', 'cafe', 3),
('occasion', 'ไปเดต', 'Date', 'date', 4),
('occasion', 'ไปงานแต่งงาน', 'Wedding', 'wedding', 5),
('occasion', 'ไปวัด / งานบุญ', 'Temple', 'temple', 6),
('occasion', 'ไปเที่ยวทะเล', 'Beach', 'beach', 7),
('occasion', 'ออกกำลังกาย', 'Exercise', 'exercise', 8),
('occasion', 'เดินทาง / ท่องเที่ยว', 'Travel', 'travel', 9),
('occasion', 'อยู่บ้าน', 'Home', 'home', 10),
('occasion', 'งานอีเวนต์', 'Event', 'event', 11),

-- Formalities
('formality', 'ลำลอง', 'Casual', 'casual', 1),
('formality', 'กึ่งทางการ', 'Smart Casual', 'smart-casual', 2),
('formality', 'ทางการทำงาน', 'Business', 'business', 3),
('formality', 'กึ่งทางการออกงาน', 'Semi Formal', 'semi-formal', 4),
('formality', 'ทางการเต็มขั้น', 'Formal', 'formal', 5),
('formality', 'สปอร์ต / กีฬา', 'Sport', 'sport', 6),

-- Fits
('fit', 'เข้ารูป', 'Fitted', 'fitted', 1),
('fit', 'ทรงปกติ', 'Regular', 'regular', 2),
('fit', 'ทรงสบาย', 'Relaxed', 'relaxed', 3),
('fit', 'โอเวอร์ไซซ์', 'Oversized', 'oversized', 4),

-- Weather
('weather', 'อากาศร้อน', 'Hot', 'hot', 1),
('weather', 'อบอุ่น / สบาย', 'Warm', 'warm', 2),
('weather', 'วันฝนตก', 'Rainy', 'rainy', 3),
('weather', 'อากาศเย็น', 'Cool', 'cool', 4),
('weather', 'ห้องแอร์ / ในร่ม', 'Indoor', 'indoor', 5),

-- Colors
('color', 'ขาว', 'White', 'white', 1),
('color', 'ดำ', 'Black', 'black', 2),
('color', 'กรมท่า', 'Navy', 'navy', 3),
('color', 'เบจ', 'Beige', 'beige', 4),
('color', 'เทา', 'Grey', 'grey', 5),
('color', 'เขียวมะกอก', 'Olive Green', 'olive', 6),
('color', 'น้ำตาล', 'Brown', 'brown', 7),
('color', 'ครีม', 'Cream', 'cream', 8),
('color', 'ฟ้า', 'Blue', 'blue', 9),
('color', 'ชมพู', 'Pink', 'pink', 10),
('color', 'แดง', 'Red', 'red', 11),
('color', 'สีพาสเทล', 'Pastel', 'pastel', 12)
ON CONFLICT DO NOTHING;


-- Seed initial ad and shop fashion tags for existing demo data
INSERT INTO public.shop_fashion_tags (shop_id, tag_id)
SELECT s.id, t.id
FROM public.shops s
CROSS JOIN public.fashion_tags t
WHERE t.slug IN ('minimal', 'smart-casual', 'casual', 'workwear', 'korean-inspired')
ON CONFLICT DO NOTHING;

INSERT INTO public.ad_fashion_tags (ad_id, tag_id)
SELECT a.id, t.id
FROM public.ads a
CROSS JOIN public.fashion_tags t
WHERE t.slug IN ('minimal', 'casual', 'white', 'black', 'navy', 'work', 'cafe', 'hot', 'indoor')
ON CONFLICT DO NOTHING;
