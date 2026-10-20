-- Run once in the Supabase SQL Editor for the SAINTS PITCH private account backend.
-- The browser app must use only the project's public anon/publishable key.
-- Never place a service_role key in this site or its GitHub repository.

create table if not exists public.player_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.player_data enable row level security;

revoke all on public.player_data from anon;
grant select, insert, update, delete on public.player_data to authenticated;

drop policy if exists "Players can read their own data" on public.player_data;
create policy "Players can read their own data"
  on public.player_data for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Players can create their own data" on public.player_data;
create policy "Players can create their own data"
  on public.player_data for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Players can update their own data" on public.player_data;
create policy "Players can update their own data"
  on public.player_data for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Players can delete their own data" on public.player_data;
create policy "Players can delete their own data"
  on public.player_data for delete to authenticated
  using ((select auth.uid()) = user_id);
