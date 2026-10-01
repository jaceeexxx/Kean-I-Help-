-- Phase 10 — notification preferences, Web Push subscriptions, and delivery history.

alter table public.cele_settings
  add column if not exists timezone text not null default 'Asia/Manila';

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  study_reminders boolean not null default true,
  due_review_reminders boolean not null default true,
  countdown_milestones boolean not null default true,
  special_jace_messages boolean not null default true,
  rest_day_suppression boolean not null default true,
  preferred_time time not null default '19:00',
  special_time time not null default '08:00',
  quiet_start time not null default '22:00',
  quiet_end time not null default '07:00',
  max_daily_notifications integer not null default 1 check (max_daily_notifications between 1 and 3),
  timezone text not null default 'Asia/Manila',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_key text not null,
  title text not null,
  body text not null,
  url text not null default '/',
  local_date date not null,
  status text not null check (status in ('sent','failed','skipped')),
  failure_count integer not null default 0,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id,event_key)
);

alter table public.notification_preferences enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notification_deliveries enable row level security;

create policy "notification_preferences_own" on public.notification_preferences for all to authenticated
using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "push_subscriptions_own" on public.push_subscriptions for all to authenticated
using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "notification_deliveries_read_own" on public.notification_deliveries for select to authenticated
using ((select auth.uid())=user_id);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions(user_id);
create index if not exists notification_deliveries_user_date_idx on public.notification_deliveries(user_id,local_date desc);
