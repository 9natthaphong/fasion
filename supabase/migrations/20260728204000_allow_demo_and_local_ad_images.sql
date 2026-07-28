-- Allow /demo-assets/ and /images/ static paths for demo ads in database validation trigger.

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
      p_path like '/demo-assets/%'
      or p_path like '/images/%'
      or (
        p_path like p_shop_id::text || '/%'
        and substring(p_path from length(p_shop_id::text) + 2)
          ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpe?g|png|webp)$'
      )
    );
$$;
