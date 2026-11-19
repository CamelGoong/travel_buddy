-- The previous migration renamed briefing_dismissals, which broke the build
-- already running in production. Restore that table exactly as it was and
-- keep suggestion records in a table of their own instead.

alter table public.suggestion_records rename to briefing_dismissals;
alter table public.briefing_dismissals
  rename constraint suggestion_records_pkey to briefing_dismissals_pkey;
alter index public.suggestion_records_user_id_idx rename to briefing_dismissals_user_id_idx;
alter policy "Owners manage their suggestion records" on public.briefing_dismissals
  rename to "Owners manage their briefing dismissals";

alter table public.briefing_dismissals drop constraint suggestion_records_unique;
alter table public.briefing_dismissals drop constraint suggestion_records_kind_check;
delete from public.briefing_dismissals where kind not in ('morning', 'evening') or context <> '';
alter table public.briefing_dismissals
  add constraint briefing_dismissals_kind_check check (kind in ('morning', 'evening'));
alter table public.briefing_dismissals
  add constraint briefing_dismissals_unique unique (trip_id, kind, for_date);
alter table public.briefing_dismissals drop column context, drop column local_at;

-- Every proactive suggestion the user acted on or put off
-- (docs/specs/osaka-contextual-suggestions/).
create table public.suggestion_records (
  id bigint generated always as identity primary key,
  trip_id bigint not null references public.trips (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null
    check (kind in ('morning', 'evening', 'next_place', 'expense', 'location', 'nearby')),
  for_date date not null,
  -- Which instance of the suggestion: target place index, meal, spot key, ...
  context text not null default '',
  -- Osaka local time when it was resolved, 'YYYY-MM-DDTHH:MM' (cool-down rules).
  local_at text,
  created_at timestamptz not null default now(),
  constraint suggestion_records_unique unique (trip_id, kind, for_date, context)
);

create index suggestion_records_user_id_idx on public.suggestion_records (user_id);

alter table public.suggestion_records enable row level security;

create policy "Owners manage their suggestion records" on public.suggestion_records
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.suggestion_records to authenticated;

-- Carry over morning/evening briefings already confirmed in the first version.
insert into public.suggestion_records (trip_id, user_id, kind, for_date, created_at)
select trip_id, user_id, kind, for_date, created_at from public.briefing_dismissals;
