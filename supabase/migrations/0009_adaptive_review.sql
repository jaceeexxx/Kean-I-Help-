-- Phase 9 — adaptive review schedule, adaptive plans, and expanded AI review artifacts.

alter table public.ai_review_items drop constraint if exists ai_review_items_kind_check;
alter table public.ai_review_items
  add constraint ai_review_items_kind_check
  check (kind in ('ask-jace','material-study','similar-problem','quiz','adaptive-practice','remediation','source-practice'));

create table if not exists public.adaptive_review_states (
  user_id uuid not null references auth.users(id) on delete cascade,
  area_key text not null check (area_key in ('structural','mste','hge')),
  topic_slug text not null,
  last_reviewed_at timestamptz,
  next_due_at timestamptz,
  interval_days integer not null default 1 check (interval_days between 1 and 365),
  review_count integer not null default 0 check (review_count >= 0),
  last_rating text check (last_rating is null or last_rating in ('hard','okay','easy')),
  updated_at timestamptz not null default now(),
  primary key (user_id, area_key, topic_slug)
);

create table if not exists public.adaptive_study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_minutes integer not null check (target_minutes between 5 and 720),
  total_minutes integer not null check (total_minutes >= 0),
  items jsonb not null default '[]'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active','completed','replaced')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.adaptive_review_states enable row level security;
alter table public.adaptive_study_plans enable row level security;

create policy "adaptive_review_states_own" on public.adaptive_review_states for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "adaptive_study_plans_own" on public.adaptive_study_plans for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create index if not exists adaptive_review_due_idx on public.adaptive_review_states(user_id, next_due_at);
create index if not exists adaptive_plans_user_created_idx on public.adaptive_study_plans(user_id, created_at desc);
