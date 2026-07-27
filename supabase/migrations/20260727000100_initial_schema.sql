-- FitToday initial schema
-- PostgreSQL 17 / Supabase

create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;

create type public.app_role as enum ('customer', 'merchant', 'admin');
create type public.shop_status as enum ('pending', 'approved', 'suspended', 'rejected');
create type public.subscription_status as enum ('inactive', 'active', 'expired');
create type public.shop_member_role as enum ('owner', 'manager', 'editor', 'analyst');
create type public.ad_type as enum (
  'single_product',
  'outfit_set',
  'collection',
  'promotion',
  'shop_feature'
);
create type public.ad_status as enum (
  'draft',
  'pending_review',
  'active',
  'rejected',
  'paused',
  'expired'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'customer',
  display_name text check (char_length(display_name) <= 100),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.customer_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  height_cm numeric(5,2) check (height_cm between 80 and 260),
  weight_kg numeric(5,2) check (weight_kg between 20 and 350),
  clothing_presentation text check (
    clothing_presentation in ('menswear', 'womenswear', 'unisex', 'unspecified')
  ),
  preferred_styles text[] not null default '{}',
  preferred_colors text[] not null default '{}',
  avoided_colors text[] not null default '{}',
  preferred_fit text check (preferred_fit in ('fitted', 'relaxed', 'unspecified')),
  default_budget numeric(10,2) check (default_budget is null or default_budget >= 0),
  save_body_information boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete restrict,
  name text not null check (char_length(name) between 2 and 100),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null default '' check (char_length(description) <= 1500),
  logo_path text,
  cover_path text,
  shopee_url text,
  instagram_url text,
  status public.shop_status not null default 'pending',
  subscription_status public.subscription_status not null default 'inactive',
  subscription_ends_at timestamptz,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.shop_members (
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  member_role public.shop_member_role not null default 'editor',
  created_at timestamptz not null default now(),
  primary key (shop_id, user_id)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name_th text not null unique,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  sort_order integer not null default 0,
  is_active boolean not null default true
);

create table public.ads (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 140),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null default '' check (char_length(description) <= 3000),
  ad_type public.ad_type not null,
  price_text text check (char_length(price_text) <= 80),
  destination_url text not null,
  cover_image_path text,
  status public.ad_status not null default 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (shop_id, slug),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table public.ad_categories (
  ad_id uuid not null references public.ads(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  primary key (ad_id, category_id)
);

create table public.ad_images (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references public.ads(id) on delete cascade,
  storage_path text not null unique,
  alt_text text not null check (char_length(alt_text) between 1 and 240),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.ad_likes (
  ad_id uuid not null references public.ads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (ad_id, user_id)
);

create table public.ad_impressions (
  id bigint generated always as identity primary key,
  ad_id uuid not null references public.ads(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  anonymous_session_id uuid,
  page_context text not null default 'unknown' check (char_length(page_context) <= 100),
  created_at timestamptz not null default now(),
  check (user_id is not null or anonymous_session_id is not null)
);

create table public.ad_clicks (
  id bigint generated always as identity primary key,
  ad_id uuid not null references public.ads(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  anonymous_session_id uuid,
  destination_host text not null check (char_length(destination_host) <= 255),
  created_at timestamptz not null default now(),
  check (user_id is not null or anonymous_session_id is not null)
);

create table public.shop_views (
  id bigint generated always as identity primary key,
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  anonymous_session_id uuid,
  created_at timestamptz not null default now(),
  check (user_id is not null or anonymous_session_id is not null)
);

create table public.outfit_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  input_data jsonb not null,
  created_at timestamptz not null default now()
);

create table public.outfit_results (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.outfit_requests(id) on delete cascade,
  model_name text not null check (char_length(model_name) <= 100),
  result_data jsonb not null,
  created_at timestamptz not null default now()
);

create table public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table private.admin_audit_log (
  id bigint generated always as identity primary key,
  admin_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  previous_data jsonb,
  next_data jsonb,
  created_at timestamptz not null default now()
);

create table private.api_rate_limits (
  scope text not null,
  identifier_hash text not null,
  window_started_at timestamptz not null,
  request_count integer not null default 1,
  primary key (scope, identifier_hash, window_started_at)
);

create index profiles_role_idx on public.profiles(role) where deleted_at is null;
create index shops_owner_idx on public.shops(owner_id) where deleted_at is null;
create index shops_public_idx on public.shops(status, subscription_status, subscription_ends_at)
  where deleted_at is null;
create index shop_members_user_idx on public.shop_members(user_id, shop_id);
create index categories_active_sort_idx on public.categories(is_active, sort_order);
create index ads_shop_status_idx on public.ads(shop_id, status, created_at desc)
  where deleted_at is null;
create index ads_public_idx on public.ads(status, starts_at, ends_at, created_at desc)
  where deleted_at is null;
create index ad_categories_category_idx on public.ad_categories(category_id, ad_id);
create index ad_images_ad_sort_idx on public.ad_images(ad_id, sort_order);
create index ad_likes_user_created_idx on public.ad_likes(user_id, created_at desc);
create index impressions_ad_created_idx on public.ad_impressions(ad_id, created_at desc);
create index impressions_session_dedupe_idx
  on public.ad_impressions(ad_id, anonymous_session_id, created_at desc)
  where anonymous_session_id is not null;
create index impressions_user_dedupe_idx
  on public.ad_impressions(ad_id, user_id, created_at desc)
  where user_id is not null;
create index clicks_ad_created_idx on public.ad_clicks(ad_id, created_at desc);
create index clicks_session_idx on public.ad_clicks(ad_id, anonymous_session_id, created_at desc)
  where anonymous_session_id is not null;
create index shop_views_shop_created_idx on public.shop_views(shop_id, created_at desc);
create index outfit_requests_user_created_idx on public.outfit_requests(user_id, created_at desc);
create index rate_limits_cleanup_idx on private.api_rate_limits(window_started_at);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();
create trigger customer_preferences_set_updated_at
before update on public.customer_preferences
for each row execute function private.set_updated_at();
create trigger shops_set_updated_at
before update on public.shops
for each row execute function private.set_updated_at();
create trigger ads_set_updated_at
before update on public.ads
for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text := coalesce(new.raw_user_meta_data ->> 'requested_role', 'customer');
  safe_role public.app_role;
begin
  safe_role := case
    when requested_role = 'merchant' then 'merchant'::public.app_role
    else 'customer'::public.app_role
  end;

  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    safe_role,
    nullif(left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 100), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create or replace function private.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.profiles
  where id = (select auth.uid()) and deleted_at is null
$$;

create or replace function private.is_shop_member(target_shop_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.shops s
    left join public.shop_members sm
      on sm.shop_id = s.id and sm.user_id = (select auth.uid())
    where s.id = target_shop_id
      and s.deleted_at is null
      and (s.owner_id = (select auth.uid()) or sm.user_id is not null)
  )
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.current_app_role() = 'admin'::public.app_role, false)
$$;

create or replace function private.add_shop_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.owner_id is not null then
    insert into public.shop_members (shop_id, user_id, member_role)
    values (new.id, new.owner_id, 'owner'::public.shop_member_role)
    on conflict (shop_id, user_id) do update set member_role = excluded.member_role;
  end if;
  return new;
end;
$$;

create trigger shops_add_owner_membership
after insert or update of owner_id on public.shops
for each row execute function private.add_shop_owner_membership();

create or replace function private.enforce_merchant_ad_status()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  jwt_role text := coalesce(auth.jwt() ->> 'role', '');
begin
  if jwt_role = 'authenticated' then
    if tg_op = 'INSERT' and new.status not in (
      'draft'::public.ad_status,
      'pending_review'::public.ad_status
    ) then
      raise exception 'Merchants may only create draft or pending review ads';
    end if;

    if tg_op = 'UPDATE' then
      if new.status in (
        'active'::public.ad_status,
        'rejected'::public.ad_status,
        'expired'::public.ad_status
      ) and new.status is distinct from old.status then
        raise exception 'This ad status is restricted to administrators';
      end if;
      if old.status = 'active'::public.ad_status
        and new.status not in ('active'::public.ad_status, 'paused'::public.ad_status) then
        raise exception 'An active ad may only be paused by a merchant';
      end if;
    end if;
  end if;
  return new;
end;
$$;

create trigger ads_enforce_merchant_status
before insert or update of status on public.ads
for each row execute function private.enforce_merchant_ad_status();

create or replace function private.enforce_ad_submission_eligibility()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'pending_review'::public.ad_status
    and new.status is distinct from coalesce(old.status, 'draft'::public.ad_status)
    and not exists (
      select 1
      from public.shops s
      where s.id = new.shop_id
        and s.status = 'approved'::public.shop_status
        and s.subscription_status = 'active'::public.subscription_status
        and (s.subscription_ends_at is null or s.subscription_ends_at > now())
        and s.deleted_at is null
    )
  then
    raise exception 'Shop must be approved with an active subscription before review';
  end if;
  return new;
end;
$$;

create trigger ads_enforce_submission_eligibility
before insert or update of status on public.ads
for each row execute function private.enforce_ad_submission_eligibility();

create or replace function public.consume_rate_limit(
  p_scope text,
  p_identifier_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  bucket timestamptz;
  current_count integer;
begin
  if p_limit < 1 or p_limit > 1000 or p_window_seconds < 1 or p_window_seconds > 86400 then
    return false;
  end if;
  bucket := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );
  insert into private.api_rate_limits(scope, identifier_hash, window_started_at, request_count)
  values (left(p_scope, 80), left(p_identifier_hash, 128), bucket, 1)
  on conflict (scope, identifier_hash, window_started_at)
  do update set request_count = private.api_rate_limits.request_count + 1
  returning request_count into current_count;
  return current_count <= p_limit;
end;
$$;

revoke all on function public.consume_rate_limit(text, text, integer, integer) from public;
grant execute on function public.consume_rate_limit(text, text, integer, integer) to service_role;

create or replace function public.record_admin_audit(
  p_actor_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_before_data jsonb default null,
  p_after_data jsonb default null
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into private.admin_audit_log(
    admin_user_id, action, entity_type, entity_id, previous_data, next_data
  )
  values (
    p_actor_id, left(p_action, 120), left(p_entity_type, 80),
    p_entity_id, p_before_data, p_after_data
  );
$$;

revoke all on function public.record_admin_audit(uuid, text, text, uuid, jsonb, jsonb) from public;
grant execute on function public.record_admin_audit(uuid, text, text, uuid, jsonb, jsonb) to service_role;

revoke all on schema private from public, anon, authenticated;
revoke all on function private.set_updated_at() from public, anon, authenticated;
revoke all on function private.handle_new_user() from public, anon, authenticated;
revoke all on function private.add_shop_owner_membership() from public, anon, authenticated;
revoke all on function private.enforce_merchant_ad_status() from public, anon, authenticated;
revoke all on function private.enforce_ad_submission_eligibility() from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.current_app_role() to authenticated;
grant execute on function private.is_shop_member(uuid) to authenticated;
grant execute on function private.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.customer_preferences enable row level security;
alter table public.shops enable row level security;
alter table public.shop_members enable row level security;
alter table public.categories enable row level security;
alter table public.ads enable row level security;
alter table public.ad_categories enable row level security;
alter table public.ad_images enable row level security;
alter table public.ad_likes enable row level security;
alter table public.ad_impressions enable row level security;
alter table public.ad_clicks enable row level security;
alter table public.shop_views enable row level security;
alter table public.outfit_requests enable row level security;
alter table public.outfit_results enable row level security;
alter table public.account_deletion_requests enable row level security;

create policy profiles_select_own
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy profiles_update_own
on public.profiles for update to authenticated
using ((select auth.uid()) = id and deleted_at is null)
with check ((select auth.uid()) = id and deleted_at is null);

create policy preferences_select_own
on public.customer_preferences for select to authenticated
using ((select auth.uid()) = user_id);
create policy preferences_insert_own
on public.customer_preferences for insert to authenticated
with check ((select auth.uid()) = user_id and private.current_app_role() = 'customer');
create policy preferences_update_own
on public.customer_preferences for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id and private.current_app_role() = 'customer');
create policy preferences_delete_own
on public.customer_preferences for delete to authenticated
using ((select auth.uid()) = user_id);

create policy categories_public_read
on public.categories for select to anon, authenticated
using (is_active);

create policy shops_public_read
on public.shops for select to anon, authenticated
using (
  status = 'approved'
  and subscription_status = 'active'
  and (subscription_ends_at is null or subscription_ends_at > now())
  and deleted_at is null
);
create policy shops_member_read
on public.shops for select to authenticated
using (private.is_shop_member(id));
create policy shops_merchant_insert
on public.shops for insert to authenticated
with check (
  owner_id = (select auth.uid())
  and private.current_app_role() = 'merchant'
  and status = 'pending'
  and subscription_status = 'inactive'
  and deleted_at is null
);
create policy shops_member_update
on public.shops for update to authenticated
using (private.is_shop_member(id) and deleted_at is null)
with check (private.is_shop_member(id) and deleted_at is null);

create policy shop_members_member_read
on public.shop_members for select to authenticated
using (
  user_id = (select auth.uid())
  or private.is_shop_member(shop_id)
);

create policy ads_public_read
on public.ads for select to anon, authenticated
using (
  status = 'active'
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now())
  and deleted_at is null
  and exists (
    select 1 from public.shops s
    where s.id = ads.shop_id
      and s.status = 'approved'
      and s.subscription_status = 'active'
      and (s.subscription_ends_at is null or s.subscription_ends_at > now())
      and s.deleted_at is null
  )
);
create policy ads_member_read
on public.ads for select to authenticated
using (private.is_shop_member(shop_id));
create policy ads_member_insert
on public.ads for insert to authenticated
with check (
  private.is_shop_member(shop_id)
  and status in ('draft', 'pending_review')
  and deleted_at is null
);
create policy ads_member_update
on public.ads for update to authenticated
using (private.is_shop_member(shop_id) and deleted_at is null)
with check (private.is_shop_member(shop_id) and deleted_at is null);
create policy ads_member_delete
on public.ads for delete to authenticated
using (private.is_shop_member(shop_id) and status = 'draft');

create policy ad_categories_public_read
on public.ad_categories for select to anon, authenticated
using (
  exists (
    select 1 from public.ads a
    join public.shops s on s.id = a.shop_id
    where a.id = ad_categories.ad_id
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
create policy ad_categories_member_all
on public.ad_categories for all to authenticated
using (
  exists (
    select 1 from public.ads a
    where a.id = ad_categories.ad_id and private.is_shop_member(a.shop_id)
  )
)
with check (
  exists (
    select 1 from public.ads a
    where a.id = ad_categories.ad_id and private.is_shop_member(a.shop_id)
  )
);

create policy ad_images_public_read
on public.ad_images for select to anon, authenticated
using (
  exists (
    select 1 from public.ads a
    join public.shops s on s.id = a.shop_id
    where a.id = ad_images.ad_id
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
create policy ad_images_member_all
on public.ad_images for all to authenticated
using (
  exists (
    select 1 from public.ads a
    where a.id = ad_images.ad_id and private.is_shop_member(a.shop_id)
  )
)
with check (
  exists (
    select 1 from public.ads a
    where a.id = ad_images.ad_id and private.is_shop_member(a.shop_id)
  )
);

create policy likes_read_own
on public.ad_likes for select to authenticated
using ((select auth.uid()) = user_id);
create policy likes_member_read
on public.ad_likes for select to authenticated
using (
  exists (
    select 1 from public.ads a
    where a.id = ad_likes.ad_id and private.is_shop_member(a.shop_id)
  )
);
create policy likes_insert_customer
on public.ad_likes for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and private.current_app_role() = 'customer'
  and exists (
    select 1 from public.ads a
    where a.id = ad_likes.ad_id and a.status = 'active' and a.deleted_at is null
  )
);
create policy likes_delete_own
on public.ad_likes for delete to authenticated
using ((select auth.uid()) = user_id);

create policy impressions_member_read
on public.ad_impressions for select to authenticated
using (
  exists (
    select 1 from public.ads a
    where a.id = ad_impressions.ad_id and private.is_shop_member(a.shop_id)
  )
);

create policy clicks_member_read
on public.ad_clicks for select to authenticated
using (
  exists (
    select 1 from public.ads a
    where a.id = ad_clicks.ad_id and private.is_shop_member(a.shop_id)
  )
);

create policy shop_views_member_read
on public.shop_views for select to authenticated
using (private.is_shop_member(shop_id));

create policy outfit_requests_read_own
on public.outfit_requests for select to authenticated
using ((select auth.uid()) = user_id);
create policy outfit_requests_delete_own
on public.outfit_requests for delete to authenticated
using ((select auth.uid()) = user_id);
create policy outfit_results_read_own
on public.outfit_results for select to authenticated
using (
  exists (
    select 1 from public.outfit_requests r
    where r.id = outfit_results.request_id and r.user_id = (select auth.uid())
  )
);
create policy outfit_results_delete_own
on public.outfit_results for delete to authenticated
using (
  exists (
    select 1 from public.outfit_requests r
    where r.id = outfit_results.request_id and r.user_id = (select auth.uid())
  )
);

create policy deletion_requests_read_own
on public.account_deletion_requests for select to authenticated
using ((select auth.uid()) = user_id);
create policy deletion_requests_insert_own
on public.account_deletion_requests for insert to authenticated
with check ((select auth.uid()) = user_id and status = 'pending');

grant usage on schema public to anon, authenticated;
grant select on public.categories, public.shops, public.ads, public.ad_categories, public.ad_images
  to anon, authenticated;
grant select on public.profiles, public.customer_preferences, public.shop_members,
  public.ad_likes, public.ad_impressions, public.ad_clicks, public.shop_views,
  public.outfit_requests, public.outfit_results,
  public.account_deletion_requests to authenticated;
grant insert on public.shops, public.ads, public.ad_categories, public.ad_images,
  public.ad_likes, public.customer_preferences, public.account_deletion_requests
  to authenticated;
grant delete on public.ads, public.ad_categories, public.ad_images,
  public.ad_likes, public.customer_preferences, public.outfit_requests,
  public.outfit_results to authenticated;
grant update (display_name, avatar_url, updated_at, deleted_at) on public.profiles to authenticated;
grant update (
  height_cm, weight_kg, clothing_presentation, preferred_styles, preferred_colors,
  avoided_colors, preferred_fit, default_budget, save_body_information, updated_at
) on public.customer_preferences to authenticated;
grant update (
  name, slug, description, logo_path, cover_path, shopee_url, instagram_url,
  updated_at, deleted_at
) on public.shops to authenticated;
grant update (
  title, slug, description, ad_type, price_text, destination_url, cover_image_path,
  status, starts_at, ends_at, updated_at, deleted_at
) on public.ads to authenticated;
grant update (alt_text, sort_order) on public.ad_images to authenticated;
grant usage, select on all sequences in schema public to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', false, 3145728, array['image/jpeg', 'image/png', 'image/webp']),
  ('shop-assets', 'shop-assets', false, 6291456, array['image/jpeg', 'image/png', 'image/webp']),
  ('ad-assets', 'ad-assets', false, 6291456, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy avatar_owner_select
on storage.objects for select to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy avatar_owner_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
);
create policy avatar_owner_update
on storage.objects for update to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy avatar_owner_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy shop_asset_member_select
on storage.objects for select to authenticated
using (
  bucket_id = 'shop-assets'
  and private.is_shop_member(((storage.foldername(name))[1])::uuid)
);
create policy shop_asset_member_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'shop-assets'
  and private.is_shop_member(((storage.foldername(name))[1])::uuid)
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
);
create policy shop_asset_member_update
on storage.objects for update to authenticated
using (
  bucket_id = 'shop-assets'
  and private.is_shop_member(((storage.foldername(name))[1])::uuid)
)
with check (
  bucket_id = 'shop-assets'
  and private.is_shop_member(((storage.foldername(name))[1])::uuid)
);
create policy shop_asset_member_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'shop-assets'
  and private.is_shop_member(((storage.foldername(name))[1])::uuid)
);

create policy ad_asset_member_select
on storage.objects for select to authenticated
using (
  bucket_id = 'ad-assets'
  and private.is_shop_member(((storage.foldername(name))[1])::uuid)
);
create policy ad_asset_member_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'ad-assets'
  and private.is_shop_member(((storage.foldername(name))[1])::uuid)
  and lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp')
);
create policy ad_asset_member_update
on storage.objects for update to authenticated
using (
  bucket_id = 'ad-assets'
  and private.is_shop_member(((storage.foldername(name))[1])::uuid)
)
with check (
  bucket_id = 'ad-assets'
  and private.is_shop_member(((storage.foldername(name))[1])::uuid)
);
create policy ad_asset_member_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'ad-assets'
  and private.is_shop_member(((storage.foldername(name))[1])::uuid)
);

create policy shop_asset_public_select
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'shop-assets'
  and exists (
    select 1 from public.shops s
    where (s.logo_path = name or s.cover_path = name)
      and s.status = 'approved'
      and s.subscription_status = 'active'
      and (s.subscription_ends_at is null or s.subscription_ends_at > now())
      and s.deleted_at is null
  )
);

create policy ad_asset_public_select
on storage.objects for select to anon, authenticated
using (
  bucket_id = 'ad-assets'
  and exists (
    select 1
    from public.ads a
    join public.shops s on s.id = a.shop_id
    left join public.ad_images ai on ai.ad_id = a.id
    where (a.cover_image_path = name or ai.storage_path = name)
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
