-- Remediation: Secure public.has_active_pro function
-- Date: 2026-07-31
-- Description: Revokes public execution and enforces caller authorization 
-- to prevent information disclosure about other users' Pro status.

REVOKE EXECUTE ON FUNCTION public.has_active_pro(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_active_pro(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_pro(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.has_active_pro(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.customer_subscriptions
    WHERE user_id = p_user_id
      AND plan = 'pro'
      AND status = 'active'
      AND (ends_at IS NULL OR ends_at > now())
      AND (
        auth.uid() = p_user_id OR 
        private.is_admin()
      )
  )
$$;
