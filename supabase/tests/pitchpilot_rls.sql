\set ON_ERROR_STOP on

-- Run against the PitchPilot Supabase database with psql. Supply two existing,
-- disposable auth.users UUIDs as psql variables:
-- psql "$PITCHPILOT_DATABASE_URL" -v user_a_id=... -v user_b_id=... -f supabase/tests/pitchpilot_rls.sql
begin;

insert into public.prospects (user_id, business_name)
values (:'user_a_id'::uuid, 'RLS test prospect A')
returning id as prospect_a_id \gset

insert into public.prospects (user_id, business_name)
values (:'user_b_id'::uuid, 'RLS test prospect B')
returning id as prospect_b_id \gset

insert into public.profiles (id, agency_name)
values
  (:'user_a_id'::uuid, 'RLS test agency A'),
  (:'user_b_id'::uuid, 'RLS test agency B')
on conflict (id) do update
set agency_name = excluded.agency_name;

insert into public.website_analyses
  (user_id, prospect_id, business_summary, findings, analyzed_url, model)
values
  (:'user_b_id'::uuid, :'prospect_b_id'::uuid, 'RLS test analysis',
   '{"business_summary":"RLS test","observations":[]}'::jsonb,
   'https://example.com', 'test-model')
returning id as analysis_b_id \gset

insert into public.outreach_drafts
  (user_id, prospect_id, channel, body)
values
  (:'user_b_id'::uuid, :'prospect_b_id'::uuid, 'email', 'RLS test draft')
returning id as draft_b_id \gset

insert into public.activities (user_id, prospect_id, activity_type, notes)
values (:'user_b_id'::uuid, :'prospect_b_id'::uuid, 'follow_up', 'RLS test activity B')
returning id as activity_b_id \gset

set local role authenticated;
select set_config('request.jwt.claim.sub', :'user_a_id', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('pitchpilot.test_prospect_b_id', :'prospect_b_id', true);

select 1 / case when count(*) = 1 then 1 else 0 end as user_a_can_read_own_prospect
from public.prospects
where id = :'prospect_a_id'::uuid;

select 1 / case when count(*) = 0 then 1 else 0 end as user_a_cannot_read_user_b_prospect
from public.prospects
where id = :'prospect_b_id'::uuid;

select 1 / case when count(*) = 1 then 1 else 0 end as user_a_can_read_own_profile
from public.profiles
where id = :'user_a_id'::uuid;

select 1 / case when count(*) = 0 then 1 else 0 end as user_a_cannot_read_user_b_profile
from public.profiles
where id = :'user_b_id'::uuid;

with changed as (
  update public.prospects
  set business_name = 'Unauthorized update'
  where id = :'prospect_b_id'::uuid
  returning id
)
select 1 / case when count(*) = 0 then 1 else 0 end as user_a_cannot_update_user_b_prospect
from changed;

select 1 / case when count(*) = 0 then 1 else 0 end as user_a_cannot_read_user_b_analysis
from public.website_analyses
where id = :'analysis_b_id'::uuid;

with changed as (
  update public.website_analyses
  set business_summary = 'Unauthorized update'
  where id = :'analysis_b_id'::uuid
  returning id
)
select 1 / case when count(*) = 0 then 1 else 0 end as user_a_cannot_update_user_b_analysis
from changed;

select 1 / case when count(*) = 0 then 1 else 0 end as user_a_cannot_read_user_b_draft
from public.outreach_drafts
where id = :'draft_b_id'::uuid;

with changed as (
  update public.outreach_drafts
  set body = 'Unauthorized update'
  where id = :'draft_b_id'::uuid
  returning id
)
select 1 / case when count(*) = 0 then 1 else 0 end as user_a_cannot_update_user_b_draft
from changed;

select 1 / case when count(*) = 0 then 1 else 0 end as user_a_cannot_read_user_b_activity
from public.activities
where id = :'activity_b_id'::uuid;

do $$
begin
  begin
    insert into public.activities (user_id, prospect_id, activity_type, notes)
    values (auth.uid(), current_setting('pitchpilot.test_prospect_b_id')::uuid, 'follow_up', 'Cross-account insert');
    raise exception 'RLS test failed: user A inserted an activity against user B prospect';
  exception
    when insufficient_privilege or foreign_key_violation then
      null;
  end;

  begin
    insert into public.website_analyses
      (user_id, prospect_id, business_summary, findings, analyzed_url, model)
    values
      (auth.uid(), current_setting('pitchpilot.test_prospect_b_id')::uuid,
       'Cross-account analysis', '{"observations":[]}'::jsonb,
       'https://example.com', 'test-model');
    raise exception 'RLS test failed: user A inserted an analysis against user B prospect';
  exception
    when insufficient_privilege or foreign_key_violation then
      null;
  end;

  begin
    insert into public.outreach_drafts (user_id, prospect_id, channel, body)
    values (
      auth.uid(),
      current_setting('pitchpilot.test_prospect_b_id')::uuid,
      'email',
      'Cross-account draft'
    );
    raise exception 'RLS test failed: user A inserted a draft against user B prospect';
  exception
    when insufficient_privilege or foreign_key_violation then
      null;
  end;
end;
$$;

rollback;
