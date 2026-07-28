-- Additive migration for repairing account deletion

-- 1. Drop the existing constraint for status
alter table public.account_deletion_requests drop constraint account_deletion_requests_status_check;

-- 2. Add new columns
alter table public.account_deletion_requests
add column processed_at timestamptz,
add column processed_by uuid references auth.users(id) on delete set null,
add column failure_code text,
add column failure_message text,
add column updated_at timestamptz default now(),
add column attempt_count integer not null default 0,
add column last_attempt_at timestamptz;

-- 3. Add the new constraint for status
alter table public.account_deletion_requests add constraint account_deletion_requests_status_check
check (status in ('pending', 'processing', 'completed', 'failed', 'rejected', 'cancelled'));

-- 4. Fix user_id foreign key to ON DELETE SET NULL and allow nulls
alter table public.account_deletion_requests alter column user_id drop not null;
alter table public.account_deletion_requests drop constraint account_deletion_requests_user_id_fkey;
alter table public.account_deletion_requests add constraint account_deletion_requests_user_id_fkey
foreign key (user_id) references public.profiles(id) on delete set null;

-- 5. Update RLS policies
-- Drop old policies
drop policy if exists deletion_requests_read_own on public.account_deletion_requests;
drop policy if exists deletion_requests_insert_own on public.account_deletion_requests;

-- Customers can only read their own pending/processing requests (before deletion)
create policy deletion_requests_read_own
on public.account_deletion_requests for select to authenticated
using ((select auth.uid()) = user_id);

-- Customers can only insert their own pending request
create policy deletion_requests_insert_own
on public.account_deletion_requests for insert to authenticated
with check ((select auth.uid()) = user_id and status = 'pending');

-- 6. Atomic claim function
create or replace function public.claim_deletion_request(p_request_id uuid, p_admin_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated boolean;
begin
  update public.account_deletion_requests
  set status = 'processing',
      attempt_count = attempt_count + 1,
      last_attempt_at = now(),
      processed_by = p_admin_id
  where id = p_request_id
    and status in ('pending', 'failed')
  returning true into v_updated;

  return coalesce(v_updated, false);
end;
$$;

revoke all on function public.claim_deletion_request(uuid, uuid) from public;
grant execute on function public.claim_deletion_request(uuid, uuid) to service_role;
