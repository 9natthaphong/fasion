-- Create a partial unique index to prevent duplicate concurrent deletion requests for the same user
create unique index idx_account_deletion_requests_single_active 
  on public.account_deletion_requests (user_id) 
  where status in ('pending', 'processing', 'failed');
