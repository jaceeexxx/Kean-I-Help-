-- Phase 8 — Ask Jace AI conversation + saved AI review cloud-ready schema.
create table if not exists public.ask_jace_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Ask Jace',
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ask_jace_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  thread_id uuid not null references public.ask_jace_threads(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  model text,
  sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_review_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('ask-jace','material-study','similar-problem','quiz')),
  title text not null,
  content text not null,
  source_library_item_id uuid references public.library_items(id) on delete set null,
  source_title text,
  area_key text check (area_key is null or area_key in ('structural','mste','hge')),
  topic_slug text,
  created_at timestamptz not null default now()
);

alter table public.ask_jace_threads enable row level security;
alter table public.ask_jace_messages enable row level security;
alter table public.ai_review_items enable row level security;

create policy "ask_jace_threads_own" on public.ask_jace_threads for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "ask_jace_messages_own" on public.ask_jace_messages for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "ai_review_items_own" on public.ai_review_items for all to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create index if not exists ask_jace_messages_thread_created_idx on public.ask_jace_messages(thread_id, created_at);
create index if not exists ai_review_items_user_created_idx on public.ai_review_items(user_id, created_at desc);
