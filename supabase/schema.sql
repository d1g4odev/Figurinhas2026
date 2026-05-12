create table if not exists public.album_backups (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payload jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.album_backups enable row level security;

drop policy if exists "album_backups_select_own" on public.album_backups;
create policy "album_backups_select_own"
on public.album_backups
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "album_backups_insert_own" on public.album_backups;
create policy "album_backups_insert_own"
on public.album_backups
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "album_backups_update_own" on public.album_backups;
create policy "album_backups_update_own"
on public.album_backups
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
