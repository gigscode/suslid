create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text,
  portfolio_url text,
  skills text[] not null default '{}'::text[],
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists full_name text,
  add column if not exists role text,
  add column if not exists portfolio_url text,
  add column if not exists skills text[] not null default '{}'::text[],
  add column if not exists created_at timestamptz not null default now();

alter table public.profiles enable row level security;

-- Clean up any conflicting default or legacy triggers on auth.users
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_created_create_profile on auth.users;
drop function if exists public.handle_new_user();
drop function if exists public.handle_new_auth_user_profile();

-- Permissions
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to postgres, service_role;

-- RLS policies
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Trigger function that creates a profile row when a new auth user is created.
-- Exception handler ensures that an unexpected profile error never blocks user sign-up.
create or replace function public.handle_new_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    nullif(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), '')
  )
  on conflict (id) do nothing;

  return new;
exception
  when others then
    raise warning 'handle_new_auth_user_profile failed for user %: %', new.id, sqlerrm;
    return new;
end;
$$;

create trigger on_auth_user_created_create_profile
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user_profile();

-- Backfill any existing auth users who do not have a profile row
insert into public.profiles (id, full_name)
select
  users.id,
  nullif(coalesce(users.raw_user_meta_data ->> 'full_name', users.raw_user_meta_data ->> 'name', ''), '')
from auth.users as users
on conflict (id) do nothing;
