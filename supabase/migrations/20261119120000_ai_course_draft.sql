-- AI course draft: companion type and interests chosen when creating a trip, the
-- generated course stored on the trip, why a trip fell back to the default
-- course, and the "do you need this?" checklist suggestions.
-- Trips made before this feature keep course = null and show the default course.

alter table public.trips
  add column companion text check (companion in ('solo', 'friends', 'couple', 'family-kids', 'parents')),
  add column interests text[] not null default '{}' check (cardinality(interests) <= 3),
  -- [{ "places": [{ "name", "time", "lat", "lng" }] }, ...] one entry per day, in day order
  add column course jsonb,
  add column course_source text not null default 'default' check (course_source in ('ai', 'default')),
  add column fallback_reason text check (fallback_reason in ('error', 'timeout', 'quota', 'invalid', 'daily_limit'));

create table public.checklist_suggestions (
  id bigint generated always as identity primary key,
  trip_id bigint not null references public.trips (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label text not null check (char_length(label) between 1 and 20),
  status text not null default 'pending' check (status in ('pending', 'added', 'dismissed')),
  created_at timestamptz not null default now()
);

create index checklist_suggestions_trip_id_idx on public.checklist_suggestions (trip_id);
create index checklist_suggestions_user_id_idx on public.checklist_suggestions (user_id);

alter table public.checklist_suggestions enable row level security;

create policy "Owners manage their checklist suggestions" on public.checklist_suggestions
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.checklist_suggestions to authenticated;
