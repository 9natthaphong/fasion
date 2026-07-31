-- Add 'approved' to customer_subscription_status enum
ALTER TYPE public.customer_subscription_status ADD VALUE IF NOT EXISTS 'approved';
