-- Generalize briefing dismissals into records of every proactive suggestion
-- the user acted on or put off (docs/specs/osaka-contextual-suggestions/).
-- Existing morning/evening rows keep working: their context is ''.

alter table public.briefing_dismissals rename to suggestion_records;

alter table public.suggestion_records
  drop constraint briefing_dismissals_kind_check;
alter table public.suggestion_records
  add constraint suggestion_records_kind_check
  check (kind in ('morning', 'evening', 'next_place', 'expense', 'location', 'nearby'));

-- Which instance of the suggestion: target place index, meal, spot key, ...
alter table public.suggestion_records
  add column context text not null default '';
-- Osaka local time when it was resolved, 'YYYY-MM-DDTHH:MM' (cool-down rules).
alter table public.suggestion_records
  add column local_at text;

alter table public.suggestion_records
  drop constraint briefing_dismissals_unique;
alter table public.suggestion_records
  add constraint suggestion_records_unique unique (trip_id, kind, for_date, context);

alter table public.suggestion_records
  rename constraint briefing_dismissals_pkey to suggestion_records_pkey;
alter index public.briefing_dismissals_user_id_idx rename to suggestion_records_user_id_idx;

alter policy "Owners manage their briefing dismissals" on public.suggestion_records
  rename to "Owners manage their suggestion records";
