-- Restrict repository-static ad images to the fixed demo catalogue.
-- Ordinary merchants must keep using their own shop-prefixed Storage paths.

create or replace function private.is_owned_ad_asset_path(
  p_shop_id uuid,
  p_path text
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    p_path is not null
    and (
      (
        p_shop_id in (
          '00000000-0000-4000-8000-000000000101'::uuid,
          '00000000-0000-4000-8000-000000000102'::uuid,
          '00000000-0000-4000-8000-000000000103'::uuid,
          '00000000-0000-4000-8000-000000000104'::uuid
        )
        and p_path = any (
          array[
            '/demo-assets/ad-linen-shirt.jpg',
            '/demo-assets/ad-tailored-set.jpg',
            '/demo-assets/ad-city-walk.jpg',
            '/demo-assets/ad-weekend-pairing.jpg',
            '/images/fittoday/ad-pleated-pants.jpg',
            '/images/fittoday/ad-soft-tailored-set-v1.webp',
            '/images/fittoday/ad-summer-dress.jpg',
            '/images/fittoday/ad-city-shoes.jpg',
            '/images/fittoday/ad-structure-tote.jpg',
            '/images/fittoday/ad-travel-light-set-v1.webp',
            '/images/fittoday/ad-workday-capsule-v1.webp'
          ]::text[]
        )
      )
      or (
        p_path like p_shop_id::text || '/%'
        and substring(p_path from length(p_shop_id::text) + 2)
          ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpe?g|png|webp)$'
      )
    );
$$;

revoke all on function private.is_owned_ad_asset_path(uuid, text) from public;
grant execute on function private.is_owned_ad_asset_path(uuid, text)
  to authenticated, service_role;

-- Correct the most visible fixed demo covers without changing merchant data.
update public.ads
set cover_image_path = case id
  when '00000000-0000-4000-8000-000000000202'::uuid
    then '/images/fittoday/ad-soft-tailored-set-v1.webp'
  when '00000000-0000-4000-8000-000000000203'::uuid
    then '/images/fittoday/ad-city-shoes.jpg'
  when '00000000-0000-4000-8000-000000000205'::uuid
    then '/images/fittoday/ad-pleated-pants.jpg'
  when '00000000-0000-4000-8000-000000000208'::uuid
    then '/images/fittoday/ad-summer-dress.jpg'
  when '00000000-0000-4000-8000-000000000210'::uuid
    then '/images/fittoday/ad-workday-capsule-v1.webp'
  when '00000000-0000-4000-8000-000000000213'::uuid
    then '/images/fittoday/ad-structure-tote.jpg'
  when '00000000-0000-4000-8000-000000000215'::uuid
    then '/images/fittoday/ad-travel-light-set-v1.webp'
  when '00000000-0000-4000-8000-000000000216'::uuid
    then '/images/fittoday/ad-summer-dress.jpg'
  else cover_image_path
end
where id in (
  '00000000-0000-4000-8000-000000000202'::uuid,
  '00000000-0000-4000-8000-000000000203'::uuid,
  '00000000-0000-4000-8000-000000000205'::uuid,
  '00000000-0000-4000-8000-000000000208'::uuid,
  '00000000-0000-4000-8000-000000000210'::uuid,
  '00000000-0000-4000-8000-000000000213'::uuid,
  '00000000-0000-4000-8000-000000000215'::uuid,
  '00000000-0000-4000-8000-000000000216'::uuid
)
and is_demo = true;
