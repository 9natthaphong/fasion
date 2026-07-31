-- Migration: Add atomic approval RPC
-- Date: 2026-07-31

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
  v_price numeric(10,2);
  v_starts_at timestamptz := now();
  v_ends_at timestamptz := now() + interval '1 month';
BEGIN
  -- 1. Check if caller is admin
  IF NOT private.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: must be admin';
  END IF;

  -- 2. Claim the request with FOR UPDATE to prevent race conditions
  SELECT * INTO v_request 
  FROM public.customer_subscription_requests 
  WHERE id = p_request_id AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or invalid user';
  END IF;

  -- If already approved, just return (idempotency)
  IF v_request.status = 'approved' THEN
    RETURN jsonb_build_object('status', 'already_approved');
  END IF;

  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'Request is not pending';
  END IF;

  -- 3. Verify payment proof
  SELECT * INTO v_proof
  FROM public.subscription_payment_proofs
  WHERE request_id = p_request_id AND status = 'submitted'
  FOR UPDATE;

  IF NOT FOUND THEN
    SELECT * INTO v_proof
    FROM public.subscription_payment_proofs
    WHERE request_id = p_request_id AND status = 'verified'
    FOR UPDATE;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Payment proof is not ready for approval';
    END IF;
  END IF;

  -- 4. Calculate price
  v_price := CASE WHEN p_is_first_month THEN 9.00 ELSE 29.00 END;

  -- 5. Update payment proof to verified (if it was submitted)
  IF v_proof.status = 'submitted' THEN
    UPDATE public.subscription_payment_proofs
    SET status = 'verified',
        reviewed_by = p_admin_id,
        reviewed_at = now(),
        updated_at = now()
    WHERE id = v_proof.id;
  END IF;

  -- 6. Update request to approved
  UPDATE public.customer_subscription_requests
  SET status = 'approved',
      payment_status = 'verified',
      reviewed_by = p_admin_id,
      reviewed_at = now(),
      updated_at = now()
  WHERE id = v_request.id;

  -- 7. Upsert subscription
  SELECT * INTO v_existing_sub
  FROM public.customer_subscriptions
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF FOUND THEN
    UPDATE public.customer_subscriptions
    SET plan = 'pro',
        status = 'active',
        approved_price_thb = v_price,
        is_first_month_offer = p_is_first_month,
        starts_at = v_starts_at,
        ends_at = v_ends_at,
        approved_by = p_admin_id,
        approved_at = now(),
        updated_at = now()
    WHERE id = v_existing_sub.id;
  ELSE
    INSERT INTO public.customer_subscriptions (
      user_id, plan, status, approved_price_thb, is_first_month_offer, starts_at, ends_at, approved_by, approved_at
    ) VALUES (
      p_user_id, 'pro', 'active', v_price, p_is_first_month, v_starts_at, v_ends_at, p_admin_id, now()
    );
  END IF;

  -- 8. Write audit log
  INSERT INTO private.admin_audit_log (
    admin_user_id, action, entity_type, entity_id, previous_data, next_data
  ) VALUES (
    p_admin_id, 
    'approve_subscription', 
    'customer_subscription_requests', 
    p_request_id,
    jsonb_build_object('status', v_request.status),
    jsonb_build_object('status', 'approved', 'price', v_price)
  );

  RETURN jsonb_build_object('status', 'success');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approve_subscription_request(uuid, uuid, boolean, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_subscription_request(uuid, uuid, boolean, uuid) TO authenticated, service_role;
