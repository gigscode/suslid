create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text,
  portfolio_url text,
  skills text[] not null default '{}',
  agency_name text,
  agency_type text,
  services text[] not null default '{}',
  target_markets text[] not null default '{}',
  ideal_client_description text,
  preferred_outreach_channel text not null default 'email',
  offer_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists agency_name text,
  add column if not exists agency_type text,
  add column if not exists services text[] not null default '{}',
  add column if not exists target_markets text[] not null default '{}',
  add column if not exists ideal_client_description text,
  add column if not exists preferred_outreach_channel text not null default 'email',
  add column if not exists offer_description text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.profiles
  add constraint profiles_agency_type_check
    check (agency_type is null or agency_type in ('branding', 'design', 'web', 'marketing', 'other')),
  add constraint profiles_outreach_channel_check
    check (preferred_outreach_channel in ('email', 'dm'));

create or replace function public.pitchpilot_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pitchpilot_profiles_updated_at on public.profiles;
create trigger pitchpilot_profiles_updated_at
  before update on public.profiles
  for each row execute function public.pitchpilot_set_updated_at();

create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null check (length(trim(business_name)) between 1 and 160),
  website_url text,
  country text,
  industry text,
  contact_name text,
  contact_email text,
  source text not null default 'manual',
  status text not null default 'new'
    check (status in ('new', 'researched', 'contacted', 'replied', 'meeting', 'won', 'lost')),
  notes text,
  next_follow_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create index if not exists prospects_user_created_idx
  on public.prospects (user_id, created_at desc);
create index if not exists prospects_user_follow_up_idx
  on public.prospects (user_id, next_follow_up_at)
  where next_follow_up_at is not null;
drop trigger if exists pitchpilot_prospects_updated_at on public.prospects;
create trigger pitchpilot_prospects_updated_at
  before update on public.prospects
  for each row execute function public.pitchpilot_set_updated_at();

create table if not exists public.website_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prospect_id uuid not null,
  business_summary text not null,
  findings jsonb not null check (jsonb_typeof(findings) = 'object'),
  analyzed_url text not null,
  model text not null,
  status text not null default 'complete' check (status in ('complete', 'failed')),
  error_category text,
  created_at timestamptz not null default now(),
  foreign key (prospect_id, user_id)
    references public.prospects (id, user_id) on delete cascade
);
create index if not exists website_analyses_prospect_created_idx
  on public.website_analyses (prospect_id, created_at desc);

create table if not exists public.outreach_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prospect_id uuid not null,
  channel text not null check (channel in ('email', 'dm')),
  subject text,
  body text not null check (length(trim(body)) > 0),
  status text not null default 'draft'
    check (status in ('draft', 'copied', 'sent', 'replied', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (prospect_id, user_id)
    references public.prospects (id, user_id) on delete cascade
);
create index if not exists outreach_drafts_prospect_created_idx
  on public.outreach_drafts (prospect_id, created_at desc);
drop trigger if exists pitchpilot_drafts_updated_at on public.outreach_drafts;
create trigger pitchpilot_drafts_updated_at
  before update on public.outreach_drafts
  for each row execute function public.pitchpilot_set_updated_at();

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prospect_id uuid not null,
  activity_type text not null
    check (activity_type in ('prospect_created', 'analysis_completed', 'draft_saved', 'status_changed', 'follow_up')),
  notes text,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (prospect_id, user_id)
    references public.prospects (id, user_id) on delete cascade
);
create index if not exists activities_prospect_created_idx
  on public.activities (prospect_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.prospects enable row level security;
alter table public.website_analyses enable row level security;
alter table public.outreach_drafts enable row level security;
alter table public.activities enable row level security;

revoke all on public.prospects, public.website_analyses, public.outreach_drafts, public.activities from anon;
revoke all on public.prospects, public.website_analyses, public.outreach_drafts, public.activities from public;
grant select, insert, update, delete on public.prospects to authenticated;
grant select, insert, update, delete on public.website_analyses, public.outreach_drafts, public.activities to authenticated;
grant select, insert, update on public.profiles to authenticated;

drop policy if exists "PitchPilot users manage own profile" on public.profiles;
create policy "PitchPilot users manage own profile"
  on public.profiles for all to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "PitchPilot users manage own prospects" on public.prospects;
create policy "PitchPilot users manage own prospects"
  on public.prospects for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "PitchPilot users manage own analyses" on public.website_analyses;
create policy "PitchPilot users manage own analyses"
  on public.website_analyses for all to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.prospects p
      where p.id = prospect_id and p.user_id = (select auth.uid())
    )
  )
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.prospects p
      where p.id = prospect_id and p.user_id = (select auth.uid())
    )
  );

drop policy if exists "PitchPilot users manage own drafts" on public.outreach_drafts;
create policy "PitchPilot users manage own drafts"
  on public.outreach_drafts for all to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.prospects p
      where p.id = prospect_id and p.user_id = (select auth.uid())
    )
  )
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.prospects p
      where p.id = prospect_id and p.user_id = (select auth.uid())
    )
  );

drop policy if exists "PitchPilot users manage own activities" on public.activities;
create policy "PitchPilot users manage own activities"
  on public.activities for all to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.prospects p
      where p.id = prospect_id and p.user_id = (select auth.uid())
    )
  )
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.prospects p
      where p.id = prospect_id and p.user_id = (select auth.uid())
    )
  );
