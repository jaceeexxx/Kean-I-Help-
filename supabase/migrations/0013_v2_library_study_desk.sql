-- V2 Phase 4 — Library + Study Desk metadata and private storage access.
alter table public.library_items add column if not exists study_notes text not null default '';
alter table public.library_items add column if not exists area_key text check (area_key is null or area_key in ('structural','mste','hge'));
alter table public.library_items add column if not exists topic_slug text;
alter table public.library_items add column if not exists page_count integer check (page_count is null or page_count >= 0);
alter table public.library_items add column if not exists extraction_status text check (extraction_status is null or extraction_status in ('pending','ready','needs-review','unsupported'));

create index if not exists library_items_user_created_idx on public.library_items(user_id, created_at desc);
create index if not exists library_items_user_area_topic_idx on public.library_items(user_id, area_key, topic_slug);

-- Files in kean-library are private and namespaced by auth.uid().
drop policy if exists "kean_library_select_own" on storage.objects;
create policy "kean_library_select_own" on storage.objects for select to authenticated
using (bucket_id = 'kean-library' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "kean_library_insert_own" on storage.objects;
create policy "kean_library_insert_own" on storage.objects for insert to authenticated
with check (bucket_id = 'kean-library' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "kean_library_update_own" on storage.objects;
create policy "kean_library_update_own" on storage.objects for update to authenticated
using (bucket_id = 'kean-library' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'kean-library' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "kean_library_delete_own" on storage.objects;
create policy "kean_library_delete_own" on storage.objects for delete to authenticated
using (bucket_id = 'kean-library' and (storage.foldername(name))[1] = (select auth.uid())::text);
