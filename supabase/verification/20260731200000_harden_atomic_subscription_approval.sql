-- Read-only verification for the additive atomic approval forward fix.
-- Run after supabase/migrations/20260731200000_harden_atomic_subscription_approval.sql.

select p.oid::regprocedure as function_signature,
       has_function_privilege('public', p.oid, 'execute') as public_execute,
       has_function_privilege('anon', p.oid, 'execute') as anon_execute,
       has_function_privilege('authenticated', p.oid, 'execute') as authenticated_execute,
       pg_get_functiondef(p.oid) like '%p_admin_id IS DISTINCT FROM auth.uid()%' as binds_admin_id,
       pg_get_functiondef(p.oid) like '%v_has_prior_pro%' as derives_price_from_subscription
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'approve_subscription_request';

select pg_get_functiondef('private.is_admin()'::regprocedure) like '%role::text = ''admin''%' as type_safe_admin_check;
