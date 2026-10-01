-- Phase 11 — profile, appearance/accessibility preferences, and private profile media.

alter table public.profiles add column if not exists avatar_path text;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'system' check (theme in ('system','light','dark')),
  reduced_motion boolean not null default false,
  text_scale text not null default 'standard' check (text_scale in ('standard','large')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;
create policy "user_preferences_own" on public.user_preferences for all to authenticated
using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

create or replace function public.phase11_set_updated_at() returns trigger
language plpgsql set search_path='' as $$ begin new.updated_at=now(); return new; end; $$;

drop trigger if exists profiles_phase11_updated_at on public.profiles;
create trigger profiles_phase11_updated_at before update on public.profiles
for each row execute function public.phase11_set_updated_at();

drop trigger if exists user_preferences_updated_at on public.user_preferences;
create trigger user_preferences_updated_at before update on public.user_preferences
for each row execute function public.phase11_set_updated_at();

insert into storage.buckets(id,name,public,file_size_limit)
values('kean-profile','kean-profile',false,5242880)
on conflict(id) do update set public=false,file_size_limit=5242880;

create policy "kean_profile_insert_own" on storage.objects for insert to authenticated
with check(bucket_id='kean-profile' and (storage.foldername(name))[1]=(select auth.uid()::text));
create policy "kean_profile_select_own" on storage.objects for select to authenticated
using(bucket_id='kean-profile' and (storage.foldername(name))[1]=(select auth.uid()::text));
create policy "kean_profile_update_own" on storage.objects for update to authenticated
using(bucket_id='kean-profile' and (storage.foldername(name))[1]=(select auth.uid()::text))
with check(bucket_id='kean-profile' and (storage.foldername(name))[1]=(select auth.uid()::text));
create policy "kean_profile_delete_own" on storage.objects for delete to authenticated
using(bucket_id='kean-profile' and (storage.foldername(name))[1]=(select auth.uid()::text));
