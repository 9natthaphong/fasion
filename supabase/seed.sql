-- FitToday safe demo content. No passwords or real brands.

insert into public.categories (name_th, slug, sort_order, is_active)
values
  ('เสื้อผู้ชาย', 'menswear', 1, true),
  ('เสื้อผู้หญิง', 'womenswear', 2, true),
  ('Unisex', 'unisex', 3, true),
  ('กางเกง', 'pants', 4, true),
  ('กระโปรง', 'skirts', 5, true),
  ('เดรส', 'dresses', 6, true),
  ('ชุดทำงาน', 'workwear', 7, true),
  ('Minimal', 'minimal', 8, true),
  ('Streetwear', 'streetwear', 9, true),
  ('กีฬา', 'sport', 10, true),
  ('รองเท้า', 'shoes', 11, true),
  ('กระเป๋า', 'bags', 12, true),
  ('เครื่องประดับ', 'accessories', 13, true),
  ('ชุดเซ็ต', 'outfit-sets', 14, true),
  ('โปรโมชัน', 'promotions', 15, true)
on conflict (slug) do update set
  name_th = excluded.name_th,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

insert into public.shops (
  id, owner_id, name, slug, description, logo_path, cover_path,
  status, subscription_status, subscription_ends_at, is_demo
)
values
  (
    '00000000-0000-4000-8000-000000000101', null, 'Quiet Form', 'quiet-form',
    'เสื้อผ้า everyday minimal ที่เน้นทรงสบาย เนื้อผ้าเหมาะกับอากาศร้อน และสีที่หยิบมาใส่ซ้ำได้ง่าย',
    '/demo/shop-quiet.svg', '/demo-assets/shop-quiet-cover.jpg', 'approved', 'active', '2027-12-31', true
  ),
  (
    '00000000-0000-4000-8000-000000000102', null, 'Everyday Edit', 'everyday-edit',
    'เสื้อผ้าทำงานแบบไม่เป็นทางการเกินไป จับคู่ได้ทั้งวันทำงาน คาเฟ่ และวันเดินทาง',
    '/demo/shop-edit.svg', '/demo-assets/shop-edit-cover.jpg', 'approved', 'active', '2027-12-31', true
  ),
  (
    '00000000-0000-4000-8000-000000000103', null, 'Morrow Studio', 'morrow-studio',
    'สตูดิโอแฟชั่นไร้เพศ โครงเสื้อชัด รายละเอียดน้อย และใช้พาเลตต์สีสงบสำหรับแต่งตัวทุกวัน',
    '/demo/shop-morrow.svg', '/demo-assets/shop-morrow-cover.jpg', 'approved', 'active', '2027-12-31', true
  ),
  (
    '00000000-0000-4000-8000-000000000104', null, 'Sunday Assembly', 'sunday-assembly',
    'ชุดเซ็ตและเดรสที่ออกแบบให้แต่งง่ายในครั้งเดียว เหมาะกับวันพักผ่อนและโอกาสพิเศษแบบเรียบๆ',
    '/demo/shop-sunday.svg', '/demo-assets/shop-sunday-cover.jpg', 'approved', 'active', '2027-12-31', true
  )
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  cover_path = excluded.cover_path,
  status = excluded.status,
  subscription_status = excluded.subscription_status,
  subscription_ends_at = excluded.subscription_ends_at;

insert into public.ads (
  id, shop_id, title, slug, description, ad_type, price_text,
  purchase_info, destination_url, cover_image_path, status, starts_at, ends_at, is_demo, created_at
)
values
  ('00000000-0000-4000-8000-000000000201','00000000-0000-4000-8000-000000000101','เสื้อลินิน Utility','linen-utility-shirt','ชิ้นหลักที่ออกแบบให้ใส่ง่ายในอากาศร้อน','single_product','890 บาท','สินค้าตัวอย่าง — ติดต่อร้านค้าเพื่อสอบถามรายละเอียด',null,'/demo-assets/ad-linen-shirt.jpg','active','2026-07-01','2027-12-31',true,'2026-07-26'),
  ('00000000-0000-4000-8000-000000000202','00000000-0000-4000-8000-000000000102','Soft Tailored Set','soft-tailored-set','การจัดชุดที่บาลานซ์ความเรียบและรายละเอียด','outfit_set','1,790 บาท','สินค้าตัวอย่าง — ติดต่อร้านค้าเพื่อสอบถามรายละเอียด',null,'/images/fittoday/ad-soft-tailored-set-v1.webp','active','2026-07-01','2027-12-31',true,'2026-07-25'),
  ('00000000-0000-4000-8000-000000000203','00000000-0000-4000-8000-000000000103','City Walk Collection','city-walk-collection','คอลเลกชันสำหรับวันเดินทางในเมือง','collection','เริ่มต้น 690 บาท','สินค้าตัวอย่าง — ติดต่อร้านค้าเพื่อสอบถามรายละเอียด',null,'/images/fittoday/ad-city-shoes.jpg','active','2026-07-01','2027-12-31',true,'2026-07-24'),
  ('00000000-0000-4000-8000-000000000204','00000000-0000-4000-8000-000000000104','Weekend Pairing','weekend-pairing','ชุดวันหยุดที่แต่งได้ในครั้งเดียว','outfit_set','1,290 บาท','สินค้าตัวอย่าง — ติดต่อร้านค้าเพื่อสอบถามรายละเอียด',null,'/demo-assets/ad-weekend-pairing.jpg','active','2026-07-01','2027-12-31',true,'2026-07-23'),
  ('00000000-0000-4000-8000-000000000205','00000000-0000-4000-8000-000000000101','กางเกงจีบ Relaxed','relaxed-pleated-pants','ทรงสบายสำหรับวันทำงาน','single_product','990 บาท','สินค้าตัวอย่าง — ติดต่อร้านค้าเพื่อสอบถามรายละเอียด',null,'/images/fittoday/ad-pleated-pants.jpg','active','2026-07-01','2027-12-31',true,'2026-07-22'),
  ('00000000-0000-4000-8000-000000000206','00000000-0000-4000-8000-000000000102','Desk to Dinner','desk-to-dinner','ชุดทำงานที่ต่อเนื่องถึงมื้อเย็น','collection','เริ่มต้น 790 บาท','สินค้าตัวอย่าง — ติดต่อร้านค้าเพื่อสอบถามรายละเอียด',null,'/demo-assets/ad-tailored-set.jpg','active','2026-07-01','2027-12-31',true,'2026-07-21'),
  ('00000000-0000-4000-8000-000000000207','00000000-0000-4000-8000-000000000103','Mono Layer','mono-layer','เลเยอร์โทนเดียวสำหรับทุกวัน','outfit_set','1,590 บาท','สินค้าตัวอย่าง — ติดต่อร้านค้าเพื่อสอบถามรายละเอียด',null,'/demo-assets/ad-city-walk.jpg','active','2026-07-01','2027-12-31',true,'2026-07-20'),
  ('00000000-0000-4000-8000-000000000208','00000000-0000-4000-8000-000000000104','Summer Dress Edit','summer-dress-edit','เดรสสำหรับอากาศร้อน','collection','เริ่มต้น 1,090 บาท','สินค้าตัวอย่าง — ติดต่อร้านค้าเพื่อสอบถามรายละเอียด',null,'/images/fittoday/ad-summer-dress.jpg','active','2026-07-01','2027-12-31',true,'2026-07-19'),
  ('00000000-0000-4000-8000-000000000209','00000000-0000-4000-8000-000000000101','Lightweight Overshirt','lightweight-overshirt','เสื้อคลุมบางสำหรับห้องแอร์','single_product','850 บาท','สินค้าตัวอย่าง — ติดต่อร้านค้าเพื่อสอบถามรายละเอียด',null,'/demo-assets/ad-linen-shirt.jpg','active','2026-07-01','2027-12-31',true,'2026-07-18'),
  ('00000000-0000-4000-8000-000000000210','00000000-0000-4000-8000-000000000102','Workday Capsule','workday-capsule','แคปซูลชุดทำงานที่จับคู่ซ้ำได้','collection','เริ่มต้น 750 บาท','สินค้าตัวอย่าง — ติดต่อร้านค้าเพื่อสอบถามรายละเอียด',null,'/images/fittoday/ad-workday-capsule-v1.webp','active','2026-07-01','2027-12-31',true,'2026-07-17'),
  ('00000000-0000-4000-8000-000000000211','00000000-0000-4000-8000-000000000103','Motion Knit Set','motion-knit-set','ชุดนิตติ้งที่เคลื่อนไหวสบาย','outfit_set','1,390 บาท','สินค้าตัวอย่าง — ติดต่อร้านค้าเพื่อสอบถามรายละเอียด',null,'/demo-assets/ad-city-walk.jpg','active','2026-07-01','2027-12-31',true,'2026-07-16'),
  ('00000000-0000-4000-8000-000000000212','00000000-0000-4000-8000-000000000104','Weekend Special ลด 15%','weekend-special','โปรโมชันตัวอย่างสำหรับวันหยุด','promotion','ลด 15%','สินค้าตัวอย่าง — ติดต่อร้านค้าเพื่อสอบถามรายละเอียด',null,'/demo-assets/ad-weekend-pairing.jpg','active','2026-07-01','2027-12-31',true,'2026-07-15'),
  ('00000000-0000-4000-8000-000000000213','00000000-0000-4000-8000-000000000101','Everyday Structure Tote','everyday-tote','กระเป๋าทรงชัดสำหรับทุกวัน','single_product','790 บาท','สินค้าตัวอย่าง — ติดต่อร้านค้าเพื่อสอบถามรายละเอียด',null,'/images/fittoday/ad-structure-tote.jpg','active','2026-07-01','2027-12-31',true,'2026-07-14'),
  ('00000000-0000-4000-8000-000000000214','00000000-0000-4000-8000-000000000102','Quiet Accessories','quiet-accessories','เครื่องประดับรายละเอียดน้อย','collection','เริ่มต้น 290 บาท','สินค้าตัวอย่าง — ติดต่อร้านค้าเพื่อสอบถามรายละเอียด',null,'/demo-assets/ad-tailored-set.jpg','active','2026-07-01','2027-12-31',true,'2026-07-13'),
  ('00000000-0000-4000-8000-000000000215','00000000-0000-4000-8000-000000000103','Travel Light Set','travel-light-set','ชุดเดินทางน้ำหนักเบา','outfit_set','1,490 บาท','สินค้าตัวอย่าง — ติดต่อร้านค้าเพื่อสอบถามรายละเอียด',null,'/images/fittoday/ad-travel-light-set-v1.webp','active','2026-07-01','2027-12-31',true,'2026-07-12'),
  ('00000000-0000-4000-8000-000000000216','00000000-0000-4000-8000-000000000104','เปิดตัว Sunday Assembly','new-studio-opening','แนะนำร้านตัวอย่างและคอลเลกชันใหม่','shop_feature','ชมคอลเลกชัน','สินค้าตัวอย่าง — ติดต่อร้านค้าเพื่อสอบถามรายละเอียด',null,'/images/fittoday/ad-summer-dress.jpg','active','2026-07-01','2027-12-31',true,'2026-07-11')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  purchase_info = excluded.purchase_info,
  cover_image_path = excluded.cover_image_path,
  status = excluded.status,
  ends_at = excluded.ends_at;

insert into public.ad_categories (ad_id, category_id)
select a.id, c.id
from public.ads a
join public.categories c on c.slug = case
  when a.ad_type = 'outfit_set' then 'outfit-sets'
  when a.ad_type = 'promotion' then 'promotions'
  when a.slug in ('desk-to-dinner', 'workday-capsule', 'soft-tailored-set') then 'workwear'
  when a.slug in ('city-walk-collection', 'mono-layer') then 'streetwear'
  else 'minimal'
end
where a.is_demo
on conflict do nothing;

insert into public.ad_impressions (ad_id, anonymous_session_id, page_context, created_at)
select
  a.id,
  gen_random_uuid(),
  'seed_demo',
  now() - (n || ' days')::interval
from public.ads a
cross join generate_series(1, 30) as n
where a.is_demo;

insert into public.ad_clicks (ad_id, anonymous_session_id, destination_host, created_at)
select
  a.id,
  gen_random_uuid(),
  'demo.example',
  now() - ((n * 3) || ' days')::interval
from public.ads a
cross join generate_series(1, 8) as n
where a.is_demo;

insert into public.shop_views (shop_id, anonymous_session_id, created_at)
select
  s.id,
  gen_random_uuid(),
  now() - (n || ' days')::interval
from public.shops s
cross join generate_series(1, 24) as n
where s.is_demo;
