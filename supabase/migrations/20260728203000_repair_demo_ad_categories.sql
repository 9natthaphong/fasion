-- Additive migration to accurately map all 16 demo advertisements to their proper public categories.
-- Idempotent and non-destructive for merchant-created data.

DO $$
DECLARE
  cat_accessories UUID;
  cat_bags UUID;
  cat_dresses UUID;
  cat_menswear UUID;
  cat_minimal UUID;
  cat_outfit_sets UUID;
  cat_pants UUID;
  cat_promotions UUID;
  cat_shoes UUID;
  cat_skirts UUID;
  cat_sport UUID;
  cat_streetwear UUID;
  cat_unisex UUID;
  cat_womenswear UUID;
  cat_workwear UUID;
BEGIN
  -- Get category IDs by slug
  SELECT id INTO cat_accessories FROM categories WHERE slug = 'accessories';
  SELECT id INTO cat_bags FROM categories WHERE slug = 'bags';
  SELECT id INTO cat_dresses FROM categories WHERE slug = 'dresses';
  SELECT id INTO cat_menswear FROM categories WHERE slug = 'menswear';
  SELECT id INTO cat_minimal FROM categories WHERE slug = 'minimal';
  SELECT id INTO cat_outfit_sets FROM categories WHERE slug = 'outfit-sets';
  SELECT id INTO cat_pants FROM categories WHERE slug = 'pants';
  SELECT id INTO cat_promotions FROM categories WHERE slug = 'promotions';
  SELECT id INTO cat_shoes FROM categories WHERE slug = 'shoes';
  SELECT id INTO cat_skirts FROM categories WHERE slug = 'skirts';
  SELECT id INTO cat_sport FROM categories WHERE slug = 'sport';
  SELECT id INTO cat_streetwear FROM categories WHERE slug = 'streetwear';
  SELECT id INTO cat_unisex FROM categories WHERE slug = 'unisex';
  SELECT id INTO cat_womenswear FROM categories WHERE slug = 'womenswear';
  SELECT id INTO cat_workwear FROM categories WHERE slug = 'workwear';

  -- Clean up incorrect demo relations only (for fixed demo ad UUIDs)
  DELETE FROM ad_categories
  WHERE ad_id IN (
    '00000000-0000-4000-8000-000000000201',
    '00000000-0000-4000-8000-000000000202',
    '00000000-0000-4000-8000-000000000203',
    '00000000-0000-4000-8000-000000000204',
    '00000000-0000-4000-8000-000000000205',
    '00000000-0000-4000-8000-000000000206',
    '00000000-0000-4000-8000-000000000207',
    '00000000-0000-4000-8000-000000000208',
    '00000000-0000-4000-8000-000000000209',
    '00000000-0000-4000-8000-000000000210',
    '00000000-0000-4000-8000-000000000211',
    '00000000-0000-4000-8000-000000000212',
    '00000000-0000-4000-8000-000000000213',
    '00000000-0000-4000-8000-000000000214',
    '00000000-0000-4000-8000-000000000215',
    '00000000-0000-4000-8000-000000000216'
  );

  -- Insert accurate ad-to-category associations
  -- 201: เสื้อลินิน Utility (Shirt) -> menswear, womenswear, unisex, minimal, workwear
  INSERT INTO ad_categories (ad_id, category_id) VALUES
    ('00000000-0000-4000-8000-000000000201', cat_menswear),
    ('00000000-0000-4000-8000-000000000201', cat_womenswear),
    ('00000000-0000-4000-8000-000000000201', cat_unisex),
    ('00000000-0000-4000-8000-000000000201', cat_minimal),
    ('00000000-0000-4000-8000-000000000201', cat_workwear);

  -- 202: Soft Tailored Set -> outfit-sets, workwear, minimal, pants, womenswear
  INSERT INTO ad_categories (ad_id, category_id) VALUES
    ('00000000-0000-4000-8000-000000000202', cat_outfit_sets),
    ('00000000-0000-4000-8000-000000000202', cat_workwear),
    ('00000000-0000-4000-8000-000000000202', cat_minimal),
    ('00000000-0000-4000-8000-000000000202', cat_pants),
    ('00000000-0000-4000-8000-000000000202', cat_womenswear);

  -- 203: City Walk Collection -> shoes, streetwear, unisex
  INSERT INTO ad_categories (ad_id, category_id) VALUES
    ('00000000-0000-4000-8000-000000000203', cat_shoes),
    ('00000000-0000-4000-8000-000000000203', cat_streetwear),
    ('00000000-0000-4000-8000-000000000203', cat_unisex);

  -- 204: Weekend Pairing -> outfit-sets, minimal, unisex
  INSERT INTO ad_categories (ad_id, category_id) VALUES
    ('00000000-0000-4000-8000-000000000204', cat_outfit_sets),
    ('00000000-0000-4000-8000-000000000204', cat_minimal),
    ('00000000-0000-4000-8000-000000000204', cat_unisex);

  -- 205: กางเกงจีบ Relaxed -> pants, menswear, womenswear, minimal, workwear
  INSERT INTO ad_categories (ad_id, category_id) VALUES
    ('00000000-0000-4000-8000-000000000205', cat_pants),
    ('00000000-0000-4000-8000-000000000205', cat_menswear),
    ('00000000-0000-4000-8000-000000000205', cat_womenswear),
    ('00000000-0000-4000-8000-000000000205', cat_minimal),
    ('00000000-0000-4000-8000-000000000205', cat_workwear);

  -- 206: Desk to Dinner -> workwear, skirts, womenswear
  INSERT INTO ad_categories (ad_id, category_id) VALUES
    ('00000000-0000-4000-8000-000000000206', cat_workwear),
    ('00000000-0000-4000-8000-000000000206', cat_skirts),
    ('00000000-0000-4000-8000-000000000206', cat_womenswear);

  -- 207: Mono Layer -> streetwear, unisex, minimal, outfit-sets
  INSERT INTO ad_categories (ad_id, category_id) VALUES
    ('00000000-0000-4000-8000-000000000207', cat_streetwear),
    ('00000000-0000-4000-8000-000000000207', cat_unisex),
    ('00000000-0000-4000-8000-000000000207', cat_minimal),
    ('00000000-0000-4000-8000-000000000207', cat_outfit_sets);

  -- 208: Summer Dress Edit -> dresses, womenswear, minimal
  INSERT INTO ad_categories (ad_id, category_id) VALUES
    ('00000000-0000-4000-8000-000000000208', cat_dresses),
    ('00000000-0000-4000-8000-000000000208', cat_womenswear),
    ('00000000-0000-4000-8000-000000000208', cat_minimal);

  -- 209: Lightweight Overshirt -> menswear, womenswear, unisex, workwear
  INSERT INTO ad_categories (ad_id, category_id) VALUES
    ('00000000-0000-4000-8000-000000000209', cat_menswear),
    ('00000000-0000-4000-8000-000000000209', cat_womenswear),
    ('00000000-0000-4000-8000-000000000209', cat_unisex),
    ('00000000-0000-4000-8000-000000000209', cat_workwear);

  -- 210: Workday Capsule -> workwear, pants, menswear
  INSERT INTO ad_categories (ad_id, category_id) VALUES
    ('00000000-0000-4000-8000-000000000210', cat_workwear),
    ('00000000-0000-4000-8000-000000000210', cat_pants),
    ('00000000-0000-4000-8000-000000000210', cat_menswear);

  -- 211: Motion Knit Set -> sport, outfit-sets, unisex
  INSERT INTO ad_categories (ad_id, category_id) VALUES
    ('00000000-0000-4000-8000-000000000211', cat_sport),
    ('00000000-0000-4000-8000-000000000211', cat_outfit_sets),
    ('00000000-0000-4000-8000-000000000211', cat_unisex);

  -- 212: Weekend Special ลด 15% -> promotions, minimal
  INSERT INTO ad_categories (ad_id, category_id) VALUES
    ('00000000-0000-4000-8000-000000000212', cat_promotions),
    ('00000000-0000-4000-8000-000000000212', cat_minimal);

  -- 213: Everyday Structure Tote -> bags, minimal, unisex
  INSERT INTO ad_categories (ad_id, category_id) VALUES
    ('00000000-0000-4000-8000-000000000213', cat_bags),
    ('00000000-0000-4000-8000-000000000213', cat_minimal),
    ('00000000-0000-4000-8000-000000000213', cat_unisex);

  -- 214: Quiet Accessories -> accessories, minimal
  INSERT INTO ad_categories (ad_id, category_id) VALUES
    ('00000000-0000-4000-8000-000000000214', cat_accessories),
    ('00000000-0000-4000-8000-000000000214', cat_minimal);

  -- 215: Travel Light Set -> outfit-sets, pants, unisex
  INSERT INTO ad_categories (ad_id, category_id) VALUES
    ('00000000-0000-4000-8000-000000000215', cat_outfit_sets),
    ('00000000-0000-4000-8000-000000000215', cat_pants),
    ('00000000-0000-4000-8000-000000000215', cat_unisex);

  -- 216: เปิดตัว Sunday Assembly -> promotions, womenswear, dresses, skirts
  INSERT INTO ad_categories (ad_id, category_id) VALUES
    ('00000000-0000-4000-8000-000000000216', cat_promotions),
    ('00000000-0000-4000-8000-000000000216', cat_womenswear),
    ('00000000-0000-4000-8000-000000000216', cat_dresses),
    ('00000000-0000-4000-8000-000000000216', cat_skirts);

END $$;
