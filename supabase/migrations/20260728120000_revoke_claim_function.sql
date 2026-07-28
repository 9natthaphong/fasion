-- Fix security advisor warning by explicitly revoking execute from anon and authenticated
revoke execute on function public.claim_deletion_request(uuid, uuid) from anon, authenticated, public;
