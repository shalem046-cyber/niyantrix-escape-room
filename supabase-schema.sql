-- NIYANTRIX shared session storage
-- Run this file in your Supabase project's SQL Editor.

create table if not exists public.niyantrix_sessions (
  mission_id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  team_name text not null,
  status text not null default 'Active',
  started_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  finished_at timestamptz,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  errors integer not null default 0 check (errors >= 0),
  hints integer not null default 0 check (hints >= 0)
);

create index if not exists niyantrix_sessions_started_at_idx
  on public.niyantrix_sessions (started_at desc);

create table if not exists public.niyantrix_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.niyantrix_sessions enable row level security;
alter table public.niyantrix_admins enable row level security;

revoke all on public.niyantrix_sessions from anon, authenticated;
grant select, insert, update, delete on public.niyantrix_sessions to authenticated;
revoke all on public.niyantrix_admins from anon, authenticated;

create or replace function public.is_niyantrix_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.niyantrix_admins
    where user_id = auth.uid()
  );
$$;

grant execute on function public.is_niyantrix_admin() to authenticated;

drop policy if exists "Players insert their own sessions" on public.niyantrix_sessions;
create policy "Players insert their own sessions"
  on public.niyantrix_sessions
  for insert to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "Players read own sessions and admins read all" on public.niyantrix_sessions;
create policy "Players read own sessions and admins read all"
  on public.niyantrix_sessions
  for select to authenticated
  using (auth.uid() = owner_id or public.is_niyantrix_admin());

drop policy if exists "Players update own sessions and admins update all" on public.niyantrix_sessions;
create policy "Players update own sessions and admins update all"
  on public.niyantrix_sessions
  for update to authenticated
  using (auth.uid() = owner_id or public.is_niyantrix_admin())
  with check (auth.uid() = owner_id or public.is_niyantrix_admin());

drop policy if exists "Only admins delete sessions" on public.niyantrix_sessions;
create policy "Only admins delete sessions"
  on public.niyantrix_sessions
  for delete to authenticated
  using (public.is_niyantrix_admin());
