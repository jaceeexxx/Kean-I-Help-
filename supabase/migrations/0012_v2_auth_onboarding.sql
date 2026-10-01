-- V2 Phase 2 — private auth/onboarding metadata.
-- Keeps the exact PRC date optional until an official schedule is known.

alter table public.cele_settings
  add column if not exists target_exam_period text not null default 'April 2027',
  add column if not exists first_message_seen boolean not null default false,
  add column if not exists onboarding_version integer not null default 2;
