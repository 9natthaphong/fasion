-- Forward fix for 20260731190000_atomic_approval.sql.
-- This migration must be applied after the original function migration.

-- The live project currently has a stale private.is_admin definition that
-- references a removed role enum. Keep the existing role policy,
-- but make the check type-safe against the actual profiles table.
CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role::text = 'admin'
      AND deleted_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.approve_subscription_request(
  p_request_id uuid,
  p_user_id uuid,
  p_is_first_month boolean,
  p_admin_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_request public.customer_subscription_requests%ROWTYPE;
  v_proof public.subscription_payment_proofs%ROWTYPE;
  v_existing_sub public.customer_subscriptions%ROWTYPE;
  v_has_prior_pro boolean;
  v_price numeric(10,2);
  v_now timestamptz := now();
BEGIN
  -- The server action uses the authenticated SSR client. Never trust the
  -- caller-supplied admin id or the legacy first-month hint for authorization
  -- or pricing decisions.
  IF auth.uid() IS NULL
     OR NOT private.is_admin()
     OR p_admin_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: must be admin';
  END IF;

  SELECT * INTO v_request
  FROM public.customer_subscription_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND OR v_request.user_id IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Request not found or invalid user';
  END IF;

  -- Repeated approval is a no-op and must not create another audit event.
  IF v_request.status = 'approved'::public.customer_subscription_status THEN
    RETURN jsonb_build_object('status', 'already_approved');
  END IF;

  IF v_request.status <> 'pending'::public.customer_subscription_status THEN
    RAISE EXCEPTION 'Request is not pending';
  END IF;

  SELECT * INTO v_proof
  FROM public.subscription_payment_proofs
  WHERE request_id = v_request.id
    AND user_id = v_request.user_id
    AND status = 'submitted'::public.payment_proof_status
  FOR UPDATE;

  IF NOT FOUND THEN
    SELECT * INTO v_proof
    FROM public.subscription_payment_proofs
    WHERE request_id = v_request.id
      AND user_id = v_request.user_id
      AND status = 'verified'::public.payment_proof_status
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Payment proof is not ready for approval';
    END IF;
  END IF;

  -- A subscription row whose plan is already pro proves that the customer
  -- has used the first-month offer before. The client hint is intentionally
  -- ignored so the amount cannot be changed by a forged request.
  SELECT * INTO v_existing_sub
  FROM public.customer_subscriptions
  WHERE user_id = v_request.user_id
  FOR UPDATE;

  v_has_prior_pro := COALESCE(v_existing_sub.plan = 'pro'::public.customer_plan, false);
  v_price := CASE WHEN v_has_prior_pro THEN 29.00 ELSE 9.00 END;

  IF v_proof.status = 'submitted'::public.payment_proof_status THEN
    UPDATE public.subscription_payment_proofs
    SET status = 'verified'::public.payment_proof_status,
        reviewed_by = auth.uid(),
        reviewed_at = v_now,
        updated_at = v_now
    WHERE id = v_proof.id;
  END IF;

  UPDATE public.customer_subscription_requests
  SET status = 'approved'::public.customer_subscription_status,
      payment_status = 'verified'::public.request_payment_status,
      reviewed_by = auth.uid(),
      reviewed_at = v_now,
      updated_at = v_now
  WHERE id = v_request.id;

  IF v_existing_sub.id IS NOT NULL THEN
    UPDATE public.customer_subscriptions
    SET plan = 'pro'::public.customer_plan,
        status = 'active'::public.customer_subscription_status,
        approved_price_thb = v_price,
        is_first_month_offer = NOT v_has_prior_pro,
        starts_at = v_now,
        ends_at = v_now + interval '1 month',
        approved_by = auth.uid(),
        approved_at = v_now,
        updated_at = v_now
    WHERE id = v_existing_sub.id;
  ELSE
    INSERT INTO public.customer_subscriptions (
      user_id, plan, status, approved_price_thb, is_first_month_offer,
      starts_at, ends_at, approved_by, approved_at
    ) VALUES (
      v_request.user_id,
      'pro'::public.customer_plan,
      'active'::public.customer_subscription_status,
      v_price,
      NOT v_has_prior_pro,
      v_now,
      v_now + interval '1 month',
      auth.uid(),
      v_now
    );
  END IF;

  INSERT INTO private.admin_audit_log (
    admin_user_id, action, entity_type, entity_id, previous_data, next_data
  ) VALUES (
    auth.uid(),
    'approve_subscription',
    'customer_subscription_requests',
    v_request.id,
    jsonb_build_object('status', v_request.status),
    jsonb_build_object('status', 'approved', 'price', v_price)
  );

  RETURN jsonb_build_object('status', 'success', 'price_thb', v_price);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approve_subscription_request(uuid, uuid, boolean, uuid)
  FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.approve_subscription_request(uuid, uuid, boolean, uuid)
  TO authenticated;

-- Verification (read-only; do not run as part of the migration):
-- select p.oid::regprocedure, has_function_privilege('public', p.oid, 'execute'),
--   has_function_privilege('anon', p.oid, 'execute'),
--   has_function_privilege('authenticated', p.oid, 'execute')
-- from pg_proc p join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public' and p.proname = 'approve_subscription_request';
