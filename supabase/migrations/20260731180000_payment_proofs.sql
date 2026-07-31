-- Migration: Add payment proofs and update subscription requests
-- Date: 2026-07-31

CREATE TYPE public.payment_proof_status AS ENUM ('submitted', 'verified', 'rejected', 'superseded');

-- Add payment_status to requests
CREATE TYPE public.request_payment_status AS ENUM ('not_submitted', 'submitted', 'verified', 'needs_resubmission');

ALTER TABLE public.customer_subscription_requests
  ADD COLUMN payment_status public.request_payment_status NOT NULL DEFAULT 'not_submitted';

-- Payment Proofs table
CREATE TABLE public.subscription_payment_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.customer_subscription_requests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  original_filename_safe text NOT NULL,
  mime_type text NOT NULL,
  file_size_bytes integer NOT NULL,
  expected_amount_thb numeric(10,2) NOT NULL,
  status public.payment_proof_status NOT NULL DEFAULT 'submitted',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

-- Unique index for the active submitted proof per request
CREATE UNIQUE INDEX unique_active_proof_per_request 
  ON public.subscription_payment_proofs(request_id) 
  WHERE status = 'submitted';

ALTER TABLE public.subscription_payment_proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own proofs"
  ON public.subscription_payment_proofs FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can insert their own proofs"
  ON public.subscription_payment_proofs FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (select auth.uid()) 
    AND status = 'submitted'
  );

CREATE POLICY "Admins can read all proofs"
  ON public.subscription_payment_proofs FOR SELECT
  TO authenticated
  USING (private.is_admin());

CREATE POLICY "Admins can update proofs"
  ON public.subscription_payment_proofs FOR UPDATE
  TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

CREATE TRIGGER subscription_payment_proofs_set_updated_at
BEFORE UPDATE ON public.subscription_payment_proofs
FOR EACH ROW EXECUTE FUNCTION private.set_updated_at();

-- Note: We must also update the request payment status appropriately from the server side.

-- Storage bucket for payment slips
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-slips',
  'payment-slips',
  false,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET 
  public = false, 
  file_size_limit = 5242880, 
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Storage policies
CREATE POLICY "Users can upload their own slips"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'payment-slips' 
    AND (auth.uid())::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "Users can view their own slips"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'payment-slips' 
    AND (auth.uid())::text = (string_to_array(name, '/'))[1]
  );

CREATE POLICY "Admins can view all slips"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'payment-slips' 
    AND private.is_admin()
  );
