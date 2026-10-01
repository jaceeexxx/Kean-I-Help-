-- Phase 7 — Jace personality preferences + cross-device reaction receipts.
-- The UI has a local-first fallback; these tables make the same behavior
-- cloud-syncable without coupling personality to study correctness data.

create table if not exists public.jace_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  daily_messages_enabled boolean not null default true,
  sticker_reactions_enabled boolean not null default true,
  reaction_intensity text not null default 'balanced' check (reaction_intensity in ('quiet','balanced','playful')),
  sound_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.jace_reaction_receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction_key text not null,
  reaction_event text not null,
  shown_at timestamptz not null default now(),
  unique (user_id, reaction_key)
);

alter table public.jace_preferences enable row level security;
alter table public.jace_reaction_receipts enable row level security;

create policy "jace_preferences_own"
on public.jace_preferences for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "jace_reaction_receipts_own"
on public.jace_reaction_receipts for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create index if not exists jace_reaction_receipts_user_shown_idx
on public.jace_reaction_receipts(user_id, shown_at desc);
