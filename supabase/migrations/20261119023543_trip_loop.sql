-- Osaka first trip loop: trips, pre-departure checklist, evening prep checks,
-- briefing dismissals, and daily expenses. Every row belongs to one auth user
-- and only that user may read or write it (docs/decisions/data-storage.md).
--
-- "Grant API access to new tables automatically" is off for this project, so
-- the authenticated role gets explicit table privileges below. anon gets none.

create table public.trips (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  city text not null default 'osaka' check (city = 'osaka'),
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  constraint trips_dates_order check (end_date >= start_date),
  constraint trips_max_14_days check (end_date - start_date <= 13)
);

create index trips_user_id_created_at_idx on public.trips (user_id, created_at desc);

create table public.checklist_items (
  id bigint generated always as identity primary key,
  trip_id bigint not null references public.trips (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_key text not null,
  label text not null,
  position smallint not null,
  done boolean not null default false,
  constraint checklist_items_trip_key_unique unique (trip_id, item_key)
);

create index checklist_items_user_id_idx on public.checklist_items (user_id);

-- Evening prep items that are not checklist items (umbrella, charging),
-- checked per trip and per target date (the "tomorrow" of the evening).
create table public.prep_checks (
  id bigint generated always as identity primary key,
  trip_id bigint not null references public.trips (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  for_date date not null,
  item_key text not null,
  done boolean not null default false,
  constraint prep_checks_trip_date_key_unique unique (trip_id, for_date, item_key)
);

create index prep_checks_user_id_idx on public.prep_checks (user_id);

-- Records that the morning or evening briefing was confirmed for a date,
-- so it does not show again that day.
create table public.briefing_dismissals (
  id bigint generated always as identity primary key,
  trip_id bigint not null references public.trips (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('morning', 'evening')),
  for_date date not null,
  created_at timestamptz not null default now(),
  constraint briefing_dismissals_unique unique (trip_id, kind, for_date)
);

create index briefing_dismissals_user_id_idx on public.briefing_dismissals (user_id);

create table public.expenses (
  id bigint generated always as identity primary key,
  trip_id bigint not null references public.trips (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day_number smallint not null check (day_number between 1 and 14),
  amount_yen integer not null check (amount_yen > 0),
  label text not null check (char_length(label) between 1 and 30),
  created_at timestamptz not null default now()
);

create index expenses_trip_id_day_idx on public.expenses (trip_id, day_number);
create index expenses_user_id_idx on public.expenses (user_id);

-- Row level security: owner-only on every table.
alter table public.trips enable row level security;
alter table public.checklist_items enable row level security;
alter table public.prep_checks enable row level security;
alter table public.briefing_dismissals enable row level security;
alter table public.expenses enable row level security;

create policy "Owners manage their trips" on public.trips
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Owners manage their checklist items" on public.checklist_items
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Owners manage their prep checks" on public.prep_checks
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Owners manage their briefing dismissals" on public.briefing_dismissals
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Owners manage their expenses" on public.expenses
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Data API access for signed-in users only.
grant select, insert, update, delete on public.trips to authenticated;
grant select, insert, update, delete on public.checklist_items to authenticated;
grant select, insert, update, delete on public.prep_checks to authenticated;
grant select, insert, update, delete on public.briefing_dismissals to authenticated;
grant select, insert, update, delete on public.expenses to authenticated;
