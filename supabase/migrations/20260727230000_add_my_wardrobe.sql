-- Add My Wardrobe schema and storage configuration

-- 1. Create wardrobe_items table
create table if not exists public.wardrobe_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_path text not null,
  item_type text not null check (item_type in ('top', 'bottom', 'skirt', 'dress', 'outerwear', 'shoes', 'bag', 'accessory')),
  subcategory text,
  name text,
  primary_colors text[] not null default '{}',
  styles text[] not null default '{}',
  material text,
  preferred_fit text check (preferred_fit is null or preferred_fit in ('fitted', 'regular', 'relaxed', 'oversized', 'unknown')),
  formality text check (formality is null or formality in ('casual', 'smart_casual', 'business', 'formal', 'sport', 'unknown')),
  weather_suitability text[] not null default '{}',
  ai_description text,
  ai_tags jsonb not null default '{}'::jsonb,
  analysis_status text not null default 'pending' check (analysis_status in ('pending', 'analyzing', 'completed', 'failed', 'manual')),
  availability_status text not null default 'available' check (availability_status in ('available', 'laundry', 'archived')),
  is_favorite boolean not null default false,
  last_worn_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Indexes for wardrobe_items
create index if not exists idx_wardrobe_items_user_id on public.wardrobe_items(user_id);
create index if not exists idx_wardrobe_items_type on public.wardrobe_items(user_id, item_type) where deleted_at is null;
create index if not exists idx_wardrobe_items_availability on public.wardrobe_items(user_id, availability_status) where deleted_at is null;
create index if not exists idx_wardrobe_items_active on public.wardrobe_items(user_id, created_at desc) where deleted_at is null;

-- Trigger for updated_at
create or replace function private.set_wardrobe_updated_at()
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

drop trigger if exists trg_wardrobe_items_updated_at on public.wardrobe_items;
create trigger trg_wardrobe_items_updated_at
before update on public.wardrobe_items
for each row execute function private.set_wardrobe_updated_at();

-- 2. Create outfit_result_items mapping table
create table if not exists public.outfit_result_items (
  id uuid primary key default gen_random_uuid(),
  outfit_result_id uuid not null references public.outfit_results(id) on delete cascade,
  wardrobe_item_id uuid references public.wardrobe_items(id) on delete set null,
  outfit_index integer not null check (outfit_index >= 0),
  item_role text not null,
  styling_instruction text,
  created_at timestamptz not null default now()
);

create index if not exists idx_outfit_result_items_result_id on public.outfit_result_items(outfit_result_id);
create index if not exists idx_outfit_result_items_item_id on public.outfit_result_items(wardrobe_item_id);

-- 3. Enable RLS
alter table public.wardrobe_items enable row level security;
alter table public.outfit_result_items enable row level security;

-- Policies for wardrobe_items
drop policy if exists wardrobe_items_owner_select on public.wardrobe_items;
create policy wardrobe_items_owner_select
on public.wardrobe_items for select to authenticated
using (
  user_id = (select auth.uid())
  and deleted_at is null
);

drop policy if exists wardrobe_items_owner_insert on public.wardrobe_items;
create policy wardrobe_items_owner_insert
on public.wardrobe_items for insert to authenticated
with check (
  user_id = (select auth.uid())
);

drop policy if exists wardrobe_items_owner_update on public.wardrobe_items;
create policy wardrobe_items_owner_update
on public.wardrobe_items for update to authenticated
using (
  user_id = (select auth.uid())
  and deleted_at is null
)
with check (
  user_id = (select auth.uid())
);

drop policy if exists wardrobe_items_owner_delete on public.wardrobe_items;
create policy wardrobe_items_owner_delete
on public.wardrobe_items for delete to authenticated
using (
  user_id = (select auth.uid())
);

-- Policies for outfit_result_items
drop policy if exists outfit_result_items_owner_select on public.outfit_result_items;
create policy outfit_result_items_owner_select
on public.outfit_result_items for select to authenticated
using (
  exists (
    select 1
    from public.outfit_results r
    join public.outfit_requests req on r.request_id = req.id
    where r.id = outfit_result_items.outfit_result_id
      and req.user_id = (select auth.uid())
  )
);

-- 4. Create Private Storage Bucket wardrobe-assets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wardrobe-assets',
  'wardrobe-assets',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Storage policies for wardrobe-assets
drop policy if exists wardrobe_assets_owner_select on storage.objects;
create policy wardrobe_assets_owner_select
on storage.objects for select to authenticated
using (
  bucket_id = 'wardrobe-assets'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists wardrobe_assets_owner_insert on storage.objects;
create policy wardrobe_assets_owner_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'wardrobe-assets'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists wardrobe_assets_owner_update on storage.objects;
create policy wardrobe_assets_owner_update
on storage.objects for update to authenticated
using (
  bucket_id = 'wardrobe-assets'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'wardrobe-assets'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists wardrobe_assets_owner_delete on storage.objects;
create policy wardrobe_assets_owner_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'wardrobe-assets'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
