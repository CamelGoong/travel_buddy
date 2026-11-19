-- Optional total trip budget in yen (docs/specs/osaka-trip-budget/).
-- Additive only, so the build already running in production keeps working.

alter table public.trips
  add column budget_yen integer
  check (budget_yen is null or (budget_yen > 0 and budget_yen <= 10000000));

-- Budget pace check-in joins the proactive suggestions.
alter table public.suggestion_records drop constraint suggestion_records_kind_check;
alter table public.suggestion_records
  add constraint suggestion_records_kind_check
  check (kind in ('morning', 'evening', 'next_place', 'expense', 'location', 'nearby', 'budget_pace'));
