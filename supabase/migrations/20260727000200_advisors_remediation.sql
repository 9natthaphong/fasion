-- FitToday advisor remediation migration

-- 1. Security: Revoke execute on SECURITY DEFINER functions in public schema from public, anon, authenticated
revoke execute on function public.consume_rate_limit(text, text, integer, integer) from public, anon, authenticated;
revoke execute on function public.record_admin_audit(uuid, text, text, uuid, jsonb, jsonb) from public, anon, authenticated;

-- 2. Performance: Unindexed foreign keys
create index if not exists admin_audit_log_admin_user_idx on private.admin_audit_log(admin_user_id);
create index if not exists deletion_requests_user_idx on public.account_deletion_requests(user_id);
create index if not exists ad_clicks_user_idx on public.ad_clicks(user_id) where user_id is not null;
create index if not exists ad_impressions_user_idx on public.ad_impressions(user_id) where user_id is not null;
create index if not exists shop_views_user_idx on public.shop_views(user_id) where user_id is not null;
