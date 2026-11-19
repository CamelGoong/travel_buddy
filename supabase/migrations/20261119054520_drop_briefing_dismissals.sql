-- Production now runs the suggestion-records build (PR #2), so the first
-- version's briefing_dismissals table is no longer read or written.
-- Copy anything the old build wrote after 20261119051815, then drop it.

insert into public.suggestion_records (trip_id, user_id, kind, for_date, created_at)
select trip_id, user_id, kind, for_date, created_at from public.briefing_dismissals
on conflict (trip_id, kind, for_date, context) do nothing;

drop table public.briefing_dismissals;
