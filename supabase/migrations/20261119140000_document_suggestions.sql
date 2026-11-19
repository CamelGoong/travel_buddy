-- Flight and ticket suggestions from the document vault (docs/specs/trip-documents/).
alter table public.suggestion_records drop constraint suggestion_records_kind_check;
alter table public.suggestion_records
  add constraint suggestion_records_kind_check
  check (kind in ('morning', 'evening', 'next_place', 'expense', 'location', 'nearby', 'budget_pace', 'flight', 'ticket'));
