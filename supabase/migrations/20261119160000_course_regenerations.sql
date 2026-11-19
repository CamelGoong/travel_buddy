-- Each "AI로 다시 짜기" counts toward the same daily AI limit as creating a trip
-- (docs/specs/trip-course-edit/). Only the owner who asked can read their own rows.

create table public.course_regenerations (
  id bigint generated always as identity primary key,
  trip_id bigint not null references public.trips (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index course_regenerations_user_id_created_at_idx on public.course_regenerations (user_id, created_at desc);
create index course_regenerations_trip_id_idx on public.course_regenerations (trip_id);

alter table public.course_regenerations enable row level security;

create policy "Owners manage their regenerations" on public.course_regenerations
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and public.is_trip_owner(trip_id));

grant select, insert, delete on public.course_regenerations to authenticated;
