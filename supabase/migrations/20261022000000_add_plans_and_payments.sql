-- Add plan tracking to profiles
alter table public.profiles
  add column if not exists plan text not null default 'free'
    check (plan in ('free', 'pro', 'founding')),
  add column if not exists plan_activated_at timestamptz;

-- Payments audit log (Paystack transactions)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  paystack_reference text not null unique,
  amount_kobo integer not null,
  currency text not null default 'NGN',
  status text not null default 'pending'
    check (status in ('pending', 'success', 'failed')),
  plan text not null default 'pro',
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

revoke all on public.payments from anon, public;
grant select on public.payments to authenticated;
-- Service role used by webhook and callback handlers to update plan
grant select, insert, update on public.payments to service_role;
grant select, update on public.profiles to service_role;

drop policy if exists "Users can view own payments" on public.payments;
create policy "Users can view own payments"
  on public.payments for select
  to authenticated
  using ((select auth.uid()) = user_id);

