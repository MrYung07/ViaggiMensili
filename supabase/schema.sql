create extension if not exists pgcrypto;
create table if not exists public.trips (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 trip_date date not null,
 amount numeric(10,2) not null check(amount > 0),
 note text,
 created_at timestamptz not null default now()
);
create index if not exists trips_user_date_idx on public.trips(user_id,trip_date desc);
alter table public.trips enable row level security;
create policy "Users view own trips" on public.trips for select to authenticated using ((select auth.uid())=user_id);
create policy "Users add own trips" on public.trips for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Users update own trips" on public.trips for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "Users delete own trips" on public.trips for delete to authenticated using ((select auth.uid())=user_id);
grant select,insert,update,delete on public.trips to authenticated;

-- Impedisce più registrazioni per lo stesso utente nella stessa data.
create unique index if not exists trips_one_night_per_user_date on public.trips(user_id, trip_date);

create table if not exists public.user_settings (
 user_id uuid primary key references auth.users(id) on delete cascade,
 salary numeric(10,2) not null default 2000 check (salary >= 0),
 base_pay numeric(10,2) not null default 0 check (base_pay >= 0),
 fourteenth numeric(10,2) not null default 0 check (fourteenth >= 0),
 show_calendar_notes boolean not null default true,
 updated_at timestamptz not null default now()
);
alter table public.user_settings enable row level security;
drop policy if exists "Users view own settings" on public.user_settings;
create policy "Users view own settings" on public.user_settings for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users insert own settings" on public.user_settings;
create policy "Users insert own settings" on public.user_settings for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users update own settings" on public.user_settings;
create policy "Users update own settings" on public.user_settings for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update on public.user_settings to authenticated;
