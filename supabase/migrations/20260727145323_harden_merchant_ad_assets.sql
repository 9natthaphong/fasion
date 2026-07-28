-- Keep merchant-controlled ad state and Storage references inside the owning shop.
-- This is additive because the initial schema is already applied remotely.

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
    and p_path like p_shop_id::text || '/%'
    and substring(p_path from length(p_shop_id::text) + 2)
      ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpe?g|png|webp)$';
$$;

revoke all on function private.is_owned_ad_asset_path(uuid, text) from public;
grant execute on function private.is_owned_ad_asset_path(uuid, text)
  to authenticated, service_role;

create or replace function private.validate_ad_write()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_shop_eligible boolean;
begin
  if tg_op = 'UPDATE' and new.shop_id is distinct from old.shop_id then
    raise exception 'shop_id cannot be changed';
  end if;

  if new.cover_image_path is not null
    and not private.is_owned_ad_asset_path(new.shop_id, new.cover_image_path)
  then
    raise exception 'cover image must belong to the ad shop';
  end if;

  if new.status in ('pending_review', 'active') then
    if new.cover_image_path is null then
      raise exception 'cover image is required before review';
    end if;
    if new.destination_url !~* '^https://([a-z0-9-]+\.)*shopee\.co\.th(:443)?(/|$)' then
      raise exception 'destination must be an HTTPS shopee.co.th URL';
    end if;
    select exists (
      select 1
      from public.shops s
      where s.id = new.shop_id
        and s.status = 'approved'
        and s.subscription_status = 'active'
        and (s.subscription_ends_at is null or s.subscription_ends_at > now())
        and s.deleted_at is null
    ) into v_shop_eligible;
    if not v_shop_eligible then
      raise exception 'shop is not eligible to submit or activate ads';
    end if;
  end if;

  if (select auth.role()) = 'authenticated' then
    if tg_op = 'INSERT' and new.status <> 'draft' then
      raise exception 'merchant ads must be created as draft';
    end if;

    if tg_op = 'UPDATE' then
      if old.status = 'pending_review' then
        raise exception 'ads under review cannot be changed by merchants';
      elsif old.status = 'active' then
        if new.status <> 'paused'
          or new.title is distinct from old.title
          or new.slug is distinct from old.slug
          or new.description is distinct from old.description
          or new.ad_type is distinct from old.ad_type
          or new.price_text is distinct from old.price_text
          or new.destination_url is distinct from old.destination_url
          or new.cover_image_path is distinct from old.cover_image_path
          or new.starts_at is distinct from old.starts_at
          or new.ends_at is distinct from old.ends_at
          or new.deleted_at is distinct from old.deleted_at
        then
          raise exception 'active ads may only be paused by merchants';
        end if;
      elsif old.status not in ('draft', 'rejected', 'paused') then
        raise exception 'ad state cannot be changed by merchants';
      end if;

      if new.status not in ('draft', 'pending_review', 'paused') then
        raise exception 'merchant cannot activate or reject ads';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_ad_write on public.ads;
create trigger trg_validate_ad_write
before insert or update on public.ads
for each row execute function private.validate_ad_write();

create or replace function private.validate_ad_image_write()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_shop_id uuid;
begin
  select a.shop_id into v_shop_id
  from public.ads a
  where a.id = new.ad_id;

  if v_shop_id is null
    or not private.is_owned_ad_asset_path(v_shop_id, new.storage_path)
  then
    raise exception 'ad image must belong to the ad shop';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_validate_ad_image_write on public.ad_images;
create trigger trg_validate_ad_image_write
before insert or update on public.ad_images
for each row execute function private.validate_ad_image_write();

drop policy if exists ads_member_insert on public.ads;
create policy ads_member_insert
on public.ads for insert to authenticated
with check (
  private.is_shop_member(shop_id)
  and status = 'draft'
  and deleted_at is null
);

drop policy if exists ads_member_update on public.ads;
create policy ads_member_update
on public.ads for update to authenticated
using (
  private.is_shop_member(shop_id)
  and status in ('draft', 'rejected', 'paused', 'active')
  and deleted_at is null
)
with check (
  private.is_shop_member(shop_id)
  and status in ('draft', 'pending_review', 'paused')
  and deleted_at is null
);

drop policy if exists ad_categories_member_all on public.ad_categories;
create policy ad_categories_member_all
on public.ad_categories for all to authenticated
using (
  exists (
    select 1
    from public.ads a
    where a.id = ad_categories.ad_id
      and a.status in ('draft', 'rejected', 'paused')
      and private.is_shop_member(a.shop_id)
  )
)
with check (
  exists (
    select 1
    from public.ads a
    where a.id = ad_categories.ad_id
      and a.status in ('draft', 'rejected', 'paused')
      and private.is_shop_member(a.shop_id)
  )
);

drop policy if exists ad_images_member_all on public.ad_images;
create policy ad_images_member_all
on public.ad_images for all to authenticated
using (
  exists (
    select 1
    from public.ads a
    where a.id = ad_images.ad_id
      and a.status in ('draft', 'rejected', 'paused')
      and private.is_shop_member(a.shop_id)
  )
)
with check (
  exists (
    select 1
    from public.ads a
    where a.id = ad_images.ad_id
      and a.status in ('draft', 'rejected', 'paused')
      and private.is_shop_member(a.shop_id)
  )
);

drop policy if exists ad_asset_member_delete on storage.objects;
create policy ad_asset_member_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'ad-assets'
  and private.is_shop_member(((storage.foldername(name))[1])::uuid)
  and not exists (
    select 1
    from public.ads a
    left join public.ad_images ai on ai.ad_id = a.id
    where (a.cover_image_path = name or ai.storage_path = name)
      and a.status in ('pending_review', 'active')
      and a.deleted_at is null
  )
);
