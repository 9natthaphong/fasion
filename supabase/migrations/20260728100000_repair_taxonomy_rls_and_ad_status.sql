-- FitToday Targeted Repair Migration
-- 20260728100000_repair_taxonomy_rls_and_ad_status.sql

-- 1. Add privacy consent timestamp columns to customer_fit_profiles
alter table public.customer_fit_profiles
  add column if not exists personalized_ads_consent_at timestamptz,
  add column if not exists personalization_reset_at timestamptz;

-- Update default for enable_personalized_ads to false
alter table public.customer_fit_profiles
  alter column enable_personalized_ads set default false;

-- 2. Safely copy height/weight into customer_fit_profiles when null
insert into public.customer_fit_profiles (user_id, height_cm, weight_kg, updated_at)
select cp.user_id, cp.height_cm, cp.weight_kg, now()
from public.customer_preferences cp
where (cp.height_cm is not null or cp.weight_kg is not null)
on conflict (user_id) do update
set
  height_cm = coalesce(customer_fit_profiles.height_cm, excluded.height_cm),
  weight_kg = coalesce(customer_fit_profiles.weight_kg, excluded.weight_kg);

-- 3. Function & Trigger for Merchant Ad Tag Mutation Hardening
create or replace function private.enforce_merchant_ad_tag_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  ad_rec record;
  tag_active boolean;
  jwt_role text := coalesce(auth.jwt() ->> 'role', '');
begin
  -- Check tag is active
  select is_active into tag_active from public.fashion_tags where id = new.tag_id;
  if tag_active is not true then
    raise exception 'Cannot assign an inactive or non-existent fashion tag';
  end if;

  -- For merchant authenticated role, check ad status eligibility
  if jwt_role = 'authenticated' and not private.is_admin() then
    select status into ad_rec from public.ads where id = new.ad_id;
    if ad_rec.status not in ('draft'::public.ad_status, 'rejected'::public.ad_status) then
      raise exception 'Ad tags may only be modified while ad is in draft or rejected status';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists ad_fashion_tags_enforce_mutation on public.ad_fashion_tags;
create trigger ad_fashion_tags_enforce_mutation
before insert or update on public.ad_fashion_tags
for each row execute function private.enforce_merchant_ad_tag_mutation();

-- 4. Repair RLS Policies for shop_fashion_tags and ad_fashion_tags
drop policy if exists "Anyone can view shop fashion tags" on public.shop_fashion_tags;
drop policy if exists "Shop owners can write shop fashion tags" on public.shop_fashion_tags;
drop policy if exists "Shop owners can delete shop fashion tags" on public.shop_fashion_tags;
drop policy if exists shop_fashion_tags_select_public on public.shop_fashion_tags;
drop policy if exists shop_fashion_tags_select_member on public.shop_fashion_tags;
drop policy if exists shop_fashion_tags_write_member on public.shop_fashion_tags;
drop policy if exists shop_fashion_tags_public_read on public.shop_fashion_tags;
drop policy if exists shop_fashion_tags_member_read on public.shop_fashion_tags;
drop policy if exists shop_fashion_tags_member_insert on public.shop_fashion_tags;
drop policy if exists shop_fashion_tags_member_delete on public.shop_fashion_tags;

create policy shop_fashion_tags_public_read
on public.shop_fashion_tags for select to anon, authenticated
using (
  exists (
    select 1 from public.shops s
    where s.id = shop_fashion_tags.shop_id
      and s.status = 'approved'
      and s.subscription_status = 'active'
      and (s.subscription_ends_at is null or s.subscription_ends_at > now())
      and s.deleted_at is null
  )
);

create policy shop_fashion_tags_member_read
on public.shop_fashion_tags for select to authenticated
using (private.is_shop_member(shop_id));

create policy shop_fashion_tags_member_insert
on public.shop_fashion_tags for insert to authenticated
with check (private.is_shop_member(shop_id));

create policy shop_fashion_tags_member_delete
on public.shop_fashion_tags for delete to authenticated
using (private.is_shop_member(shop_id));

drop policy if exists "Anyone can view ad fashion tags" on public.ad_fashion_tags;
drop policy if exists "Shop owners can write ad fashion tags" on public.ad_fashion_tags;
drop policy if exists "Shop owners can delete ad fashion tags" on public.ad_fashion_tags;
drop policy if exists ad_fashion_tags_select_public on public.ad_fashion_tags;
drop policy if exists ad_fashion_tags_select_member on public.ad_fashion_tags;
drop policy if exists ad_fashion_tags_write_member on public.ad_fashion_tags;
drop policy if exists ad_fashion_tags_public_read on public.ad_fashion_tags;
drop policy if exists ad_fashion_tags_member_read on public.ad_fashion_tags;
drop policy if exists ad_fashion_tags_member_insert on public.ad_fashion_tags;
drop policy if exists ad_fashion_tags_member_delete on public.ad_fashion_tags;

create policy ad_fashion_tags_public_read
on public.ad_fashion_tags for select to anon, authenticated
using (
  exists (
    select 1 from public.ads a
    join public.shops s on s.id = a.shop_id
    where a.id = ad_fashion_tags.ad_id
      and a.status = 'active'
      and (a.starts_at is null or a.starts_at <= now())
      and (a.ends_at is null or a.ends_at > now())
      and a.deleted_at is null
      and s.status = 'approved'
      and s.subscription_status = 'active'
      and (s.subscription_ends_at is null or s.subscription_ends_at > now())
      and s.deleted_at is null
  )
);

create policy ad_fashion_tags_member_read
on public.ad_fashion_tags for select to authenticated
using (
  exists (
    select 1 from public.ads a
    where a.id = ad_fashion_tags.ad_id and private.is_shop_member(a.shop_id)
  )
);

create policy ad_fashion_tags_member_insert
on public.ad_fashion_tags for insert to authenticated
with check (
  exists (
    select 1 from public.ads a
    where a.id = ad_fashion_tags.ad_id
      and private.is_shop_member(a.shop_id)
      and a.status in ('draft', 'rejected')
  )
);

create policy ad_fashion_tags_member_delete
on public.ad_fashion_tags for delete to authenticated
using (
  exists (
    select 1 from public.ads a
    where a.id = ad_fashion_tags.ad_id
      and private.is_shop_member(a.shop_id)
      and a.status in ('draft', 'rejected')
  )
);

-- 5. Fix Demo Taxonomy Quality (Distinct assignments for demo shops and demo ads)

-- Clear existing generic demo tag assignments
delete from public.shop_fashion_tags
where shop_id in (select id from public.shops where is_demo = true);

delete from public.ad_fashion_tags
where ad_id in (select id from public.ads where is_demo = true);

-- Assign Shop 1 (Minimal Studio): Minimal, Contemporary, Workwear
insert into public.shop_fashion_tags (shop_id, tag_id)
select s.id, t.id
from public.shops s
cross join public.fashion_tags t
where s.slug = 'minimal-studio' and t.slug in ('minimal', 'contemporary', 'workwear', 'monochrome', 'white', 'black', 'regular-fit');

-- Assign Shop 2 (Street Vibe): Streetwear, Casual, Oversized
insert into public.shop_fashion_tags (shop_id, tag_id)
select s.id, t.id
from public.shops s
cross join public.fashion_tags t
where s.slug = 'street-vibe' and t.slug in ('streetwear', 'casual', 'oversized', 'graphic', 'navy', 'gray', 'cold-air');

-- Assign Shop 3 (Gentle Craft): Smart Casual, Linen, Elevated, Earth Tone
insert into public.shop_fashion_tags (shop_id, tag_id)
select s.id, t.id
from public.shops s
cross join public.fashion_tags t
where s.slug = 'gentle-craft' and t.slug in ('smart-casual', 'linen', 'beige-brown', 'hot-sunny', 'relaxed-fit', 'cafe-chill');

-- Assign Shop 4 (Charming Day): Romantic, Pastel, Resort, Feminine
insert into public.shop_fashion_tags (shop_id, tag_id)
select s.id, t.id
from public.shops s
cross join public.fashion_tags t
where s.slug = 'charming-day' and t.slug in ('romantic', 'pastel', 'beach-resort', 'wedding-party', 'slim-fit');

-- Assign Specific Ad Tags for Minimal Studio Ads
insert into public.ad_fashion_tags (ad_id, tag_id)
select a.id, t.id
from public.ads a
cross join public.fashion_tags t
where a.slug = 'minimal-linen-shirt' and t.slug in ('minimal', 'linen', 'hot-sunny', 'white', 'casual');

insert into public.ad_fashion_tags (ad_id, tag_id)
select a.id, t.id
from public.ads a
cross join public.fashion_tags t
where a.slug = 'tailored-blazer-black' and t.slug in ('workwear', 'smart-casual', 'black', 'formal', 'office');

insert into public.ad_fashion_tags (ad_id, tag_id)
select a.id, t.id
from public.ads a
cross join public.fashion_tags t
where a.slug = 'straight-chino-trousers' and t.slug in ('smart-casual', 'beige-brown', 'regular-fit', 'office');

insert into public.ad_fashion_tags (ad_id, tag_id)
select a.id, t.id
from public.ads a
cross join public.fashion_tags t
where a.slug = 'monochrome-capsule-set' and t.slug in ('minimal', 'monochrome', 'casual', 'black', 'white');

-- Assign Specific Ad Tags for Street Vibe Ads
insert into public.ad_fashion_tags (ad_id, tag_id)
select a.id, t.id
from public.ads a
cross join public.fashion_tags t
where a.slug = 'oversized-graphic-tee' and t.slug in ('streetwear', 'oversized', 'casual', 'gray');

insert into public.ad_fashion_tags (ad_id, tag_id)
select a.id, t.id
from public.ads a
cross join public.fashion_tags t
where a.slug = 'utility-cargo-pants' and t.slug in ('streetwear', 'casual', 'navy', 'relaxed-fit');

insert into public.ad_fashion_tags (ad_id, tag_id)
select a.id, t.id
from public.ads a
cross join public.fashion_tags t
where a.slug = 'vintage-denim-jacket' and t.slug in ('streetwear', 'casual', 'cold-air', 'navy');

insert into public.ad_fashion_tags (ad_id, tag_id)
select a.id, t.id
from public.ads a
cross join public.fashion_tags t
where a.slug = 'street-lookbook-2026' and t.slug in ('streetwear', 'oversized', 'casual');

-- Assign Specific Ad Tags for Gentle Craft Ads
insert into public.ad_fashion_tags (ad_id, tag_id)
select a.id, t.id
from public.ads a
cross join public.fashion_tags t
where a.slug = 'premium-oxford-shirt' and t.slug in ('smart-casual', 'white', 'office', 'regular-fit');

insert into public.ad_fashion_tags (ad_id, tag_id)
select a.id, t.id
from public.ads a
cross join public.fashion_tags t
where a.slug = 'pleated-smart-trousers' and t.slug in ('smart-casual', 'beige-brown', 'office', 'regular-fit');

insert into public.ad_fashion_tags (ad_id, tag_id)
select a.id, t.id
from public.ads a
cross join public.fashion_tags t
where a.slug = 'lightweight-trench-coat' and t.slug in ('smart-casual', 'rainy', 'cold-air', 'beige-brown');

insert into public.ad_fashion_tags (ad_id, tag_id)
select a.id, t.id
from public.ads a
cross join public.fashion_tags t
where a.slug = 'earth-tone-summer-collection' and t.slug in ('linen', 'earth-tone', 'hot-sunny', 'cafe-chill');

-- Assign Specific Ad Tags for Charming Day Ads
insert into public.ad_fashion_tags (ad_id, tag_id)
select a.id, t.id
from public.ads a
cross join public.fashion_tags t
where a.slug = 'floral-chiffon-dress' and t.slug in ('romantic', 'pastel', 'date-night', 'hot-sunny');

insert into public.ad_fashion_tags (ad_id, tag_id)
select a.id, t.id
from public.ads a
cross join public.fashion_tags t
where a.slug = 'pastel-knit-cardigan' and t.slug in ('romantic', 'pastel', 'cold-air', 'cafe-chill');

insert into public.ad_fashion_tags (ad_id, tag_id)
select a.id, t.id
from public.ads a
cross join public.fashion_tags t
where a.slug = 'resort-maxi-skirt' and t.slug in ('beach-resort', 'pastel', 'hot-sunny');

insert into public.ad_fashion_tags (ad_id, tag_id)
select a.id, t.id
from public.ads a
cross join public.fashion_tags t
where a.slug = 'romantic-date-night-set' and t.slug in ('romantic', 'wedding-party', 'date-night', 'pastel');
