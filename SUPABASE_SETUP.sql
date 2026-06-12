-- =====================================================================
-- CapCut Creators Cup — Supabase setup
-- Run this entire file in: Supabase Dashboard → SQL Editor → New query
-- =====================================================================

-- 1) Submissions table -------------------------------------------------
create table if not exists public.submissions (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null,
  country       text not null,
  email         text not null,
  phone         text not null,
  portfolio     text not null,
  thumbnail_url text,
  video_url     text,
  created_at    timestamptz not null default now(),
  constraint submissions_has_media check (
    thumbnail_url is not null or video_url is not null
  )
);

-- Required for the Data API (PostgREST)
grant select, insert on public.submissions to anon;
grant select, insert, update, delete on public.submissions to authenticated;
grant all on public.submissions to service_role;

alter table public.submissions enable row level security;

drop policy if exists "Anyone can insert a submission" on public.submissions;
create policy "Anyone can insert a submission"
  on public.submissions for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Anyone can view submissions" on public.submissions;
create policy "Anyone can view submissions"
  on public.submissions for select
  to anon, authenticated
  using (true);

-- 2) Storage buckets ---------------------------------------------------
-- Both private; the admin page generates short-lived signed URLs.
insert into storage.buckets (id, name, public)
values ('thumbnails', 'thumbnails', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('videos', 'videos', false)
on conflict (id) do nothing;

-- 3) Storage policies --------------------------------------------------
drop policy if exists "Anyone can upload thumbnails" on storage.objects;
create policy "Anyone can upload thumbnails"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'thumbnails');

drop policy if exists "Anyone can read thumbnails" on storage.objects;
create policy "Anyone can read thumbnails"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'thumbnails');

drop policy if exists "Anyone can upload videos" on storage.objects;
create policy "Anyone can upload videos"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'videos');

drop policy if exists "Anyone can read videos" on storage.objects;
create policy "Anyone can read videos"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'videos');

-- Done. The submit page can now upload + insert, and the admin page can list.
