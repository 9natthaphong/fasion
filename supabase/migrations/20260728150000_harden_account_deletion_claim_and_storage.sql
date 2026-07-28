-- 20260728150000_harden_account_deletion_claim_and_storage.sql

-- 1. Harden claim_deletion_request
CREATE OR REPLACE FUNCTION public.claim_deletion_request(p_request_id UUID, p_admin_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated BOOLEAN;
BEGIN
    UPDATE public.account_deletion_requests
    SET 
        status = 'processing',
        processed_by = p_admin_id,
        processed_at = COALESCE(processed_at, NOW()),
        target_user_id = COALESCE(target_user_id, user_id),
        attempt_count = attempt_count + 1,
        last_attempt_at = NOW(),
        updated_at = NOW()
    WHERE id = p_request_id
      AND (
          status = 'pending' 
          OR status = 'failed' 
          OR (status = 'processing' AND last_attempt_at < NOW() - INTERVAL '15 minutes')
      )
    RETURNING TRUE INTO v_updated;

    RETURN COALESCE(v_updated, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Ensure execute is restricted
REVOKE ALL ON FUNCTION public.claim_deletion_request(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_deletion_request(UUID, UUID) FROM anon;
REVOKE ALL ON FUNCTION public.claim_deletion_request(UUID, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_deletion_request(UUID, UUID) TO service_role;

-- 2. Harden finalize_account_deletion
CREATE OR REPLACE FUNCTION public.finalize_account_deletion(
    p_request_id UUID,
    p_admin_id UUID
) RETURNS public.account_deletion_requests AS $$
DECLARE
    v_request public.account_deletion_requests;
    v_target_user_id UUID;
BEGIN
    -- Lock the row
    SELECT * INTO v_request
    FROM public.account_deletion_requests
    WHERE id = p_request_id
    FOR UPDATE;

    IF v_request IS NULL THEN
        RAISE EXCEPTION 'Request not found';
    END IF;

    -- Idempotent return
    IF v_request.status = 'completed' THEN
        RETURN v_request;
    END IF;

    IF v_request.status != 'processing' THEN
        RAISE EXCEPTION 'Request must be in processing state to finalize';
    END IF;

    IF v_request.processed_by != p_admin_id THEN
        RAISE EXCEPTION 'Request can only be finalized by the admin processing it';
    END IF;

    v_target_user_id := COALESCE(v_request.target_user_id, v_request.user_id);

    IF v_target_user_id IS NULL THEN
        RAISE EXCEPTION 'Target user ID is unknown';
    END IF;

    -- Record admin audit
    INSERT INTO private.admin_audit_log (
        admin_user_id,
        action,
        entity_type,
        entity_id,
        next_data,
        created_at
    ) VALUES (
        p_admin_id,
        'DELETE_ACCOUNT',
        'customer',
        v_target_user_id,
        jsonb_build_object('request_id', p_request_id),
        NOW()
    );

    -- Complete the request
    UPDATE public.account_deletion_requests
    SET
        status = 'completed',
        user_id = NULL,
        completed_at = COALESCE(completed_at, NOW()),
        processed_at = COALESCE(processed_at, NOW()),
        failure_code = NULL,
        failure_message = NULL,
        updated_at = NOW()
    WHERE id = p_request_id
    RETURNING * INTO v_request;

    RETURN v_request;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE ALL ON FUNCTION public.finalize_account_deletion(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.finalize_account_deletion(UUID, UUID) FROM anon;
REVOKE ALL ON FUNCTION public.finalize_account_deletion(UUID, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_account_deletion(UUID, UUID) TO service_role;
