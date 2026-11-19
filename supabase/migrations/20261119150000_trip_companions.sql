-- Trip companions (docs/specs/trip-companions/): members and invite links,
-- per-person checklist done marks, per-person suggestion records, expense tags,
-- and per-file sharing of documents. The old owner-only policies are replaced by
-- member-aware ones. The old `checklist_items.done` column stays so the build
-- already running in production keeps working until it is replaced.

-- ── members ───────────────────────────────────────────────────────────────────
create table public.trip_members (
  id bigint generated always as identity primary key,
  trip_id bigint not null references public.trips (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 10),
  role text not null check (role in ('owner', 'companion')),
  joined_at timestamptz not null default now(),
  left_at timestamptz
);

-- One active membership per account and per nickname (case-insensitive) in a trip.
create unique index trip_members_active_user_idx on public.trip_members (trip_id, user_id) where left_at is null;
create unique index trip_members_active_nickname_idx on public.trip_members (trip_id, lower(nickname)) where left_at is null;
create index trip_members_user_id_idx on public.trip_members (user_id);

-- The owner is a member from the moment a trip exists.
insert into public.trip_members (trip_id, user_id, nickname, role)
select t.id, t.user_id, left(coalesce(nullif(split_part(u.email, '@', 1), ''), '나'), 10), 'owner'
from public.trips t
join auth.users u on u.id = t.user_id;

-- ── access helpers (security definer so policies do not recurse) ─────────────
create function public.is_trip_owner(p_trip bigint) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.trips t where t.id = p_trip and t.user_id = (select auth.uid()));
$$;

create function public.is_trip_member(p_trip bigint) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_trip_owner(p_trip)
    or exists (
      select 1 from public.trip_members m
      where m.trip_id = p_trip and m.user_id = (select auth.uid()) and m.left_at is null
    );
$$;

revoke all on function public.is_trip_owner(bigint), public.is_trip_member(bigint) from public, anon;
grant execute on function public.is_trip_owner(bigint), public.is_trip_member(bigint) to authenticated;

-- A new trip gets its owner member (nickname defaults to the e-mail's local part).
create function public.add_owner_member() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.trip_members (trip_id, user_id, nickname, role)
  select new.id, new.user_id, left(coalesce(nullif(split_part(u.email, '@', 1), ''), '나'), 10), 'owner'
  from auth.users u where u.id = new.user_id
  on conflict do nothing;
  return new;
end $$;

create trigger trips_add_owner_member after insert on public.trips
  for each row execute function public.add_owner_member();

-- ── invite links: one per trip, 7 days ──────────────────────────────────────
create table public.trip_invites (
  trip_id bigint primary key references public.trips (id) on delete cascade,
  token uuid not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- ── per-person checklist done marks ───────────────────────────────────────────
create table public.checklist_done (
  item_id bigint not null references public.checklist_items (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  primary key (item_id, user_id)
);
create index checklist_done_user_id_idx on public.checklist_done (user_id);

-- Existing marks belong to the owner.
insert into public.checklist_done (item_id, user_id)
select i.id, i.user_id from public.checklist_items i where i.done;

-- ── expense tags ─────────────────────────────────────────────────────────────
alter table public.expenses
  add column category text not null default 'etc'
  check (category in ('food', 'transport', 'shopping', 'ticket', 'etc'));

create table public.expense_people (
  expense_id bigint not null references public.expenses (id) on delete cascade,
  member_id bigint not null references public.trip_members (id) on delete cascade,
  primary key (expense_id, member_id)
);
create index expense_people_member_id_idx on public.expense_people (member_id);

-- Existing expenses are tagged with the account that recorded them.
insert into public.expense_people (expense_id, member_id)
select e.id, m.id
from public.expenses e
join public.trip_members m on m.trip_id = e.trip_id and m.user_id = e.user_id and m.left_at is null;

-- ── per-person suggestion records and prep checks ────────────────────────────
alter table public.suggestion_records drop constraint suggestion_records_unique;
alter table public.suggestion_records
  add constraint suggestion_records_unique unique (trip_id, user_id, kind, for_date, context);
alter table public.suggestion_records drop constraint suggestion_records_kind_check;
alter table public.suggestion_records
  add constraint suggestion_records_kind_check
  check (kind in (
    'morning', 'evening', 'next_place', 'expense', 'location', 'nearby', 'budget_pace', 'flight', 'ticket',
    'fx', 'buy_pass', 'buy_transport', 'buy_ticket', 'buy_coupon'
  ));

alter table public.prep_checks drop constraint prep_checks_trip_date_key_unique;
alter table public.prep_checks
  add constraint prep_checks_trip_user_date_key_unique unique (trip_id, user_id, for_date, item_key);

-- ── documents: per-person slots, per-file sharing ────────────────────────────
drop index public.document_slots_trip_kind_unique;
create unique index document_slots_trip_user_kind_unique
  on public.document_slots (trip_id, user_id, kind) where kind <> 'custom';

alter table public.document_files add column shared boolean not null default false;

create function public.guard_shared_passport() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.shared and exists (select 1 from public.document_slots s where s.id = new.slot_id and s.kind = 'passport') then
    raise exception 'passport files cannot be shared';
  end if;
  return new;
end $$;

create trigger document_files_guard_shared before insert or update on public.document_files
  for each row execute function public.guard_shared_passport();

-- ── policies ──────────────────────────────────────────────────────────────────
drop policy "Owners manage their trips" on public.trips;
-- The owner branch reads the row itself: a helper function would not see a row
-- inserted by the same statement, which breaks INSERT ... RETURNING.
create policy "Members read trips" on public.trips for select to authenticated
  using ((select auth.uid()) = user_id or public.is_trip_member(id));
create policy "Owners create trips" on public.trips for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Owners change trips" on public.trips for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Owners delete trips" on public.trips for delete to authenticated
  using ((select auth.uid()) = user_id);

alter table public.trip_members enable row level security;
create policy "Members read members" on public.trip_members for select to authenticated
  using (public.is_trip_member(trip_id));
create policy "Members rename themselves" on public.trip_members for update to authenticated
  using (user_id = (select auth.uid()) and left_at is null)
  with check (user_id = (select auth.uid()) and left_at is null);

alter table public.trip_invites enable row level security;
create policy "Owners manage invites" on public.trip_invites for all to authenticated
  using (public.is_trip_owner(trip_id)) with check (public.is_trip_owner(trip_id));

drop policy "Owners manage their checklist items" on public.checklist_items;
create policy "Members read checklist items" on public.checklist_items for select to authenticated
  using (public.is_trip_member(trip_id));
create policy "Owners add checklist items" on public.checklist_items for insert to authenticated
  with check (public.is_trip_owner(trip_id));
create policy "Owners change checklist items" on public.checklist_items for update to authenticated
  using (public.is_trip_owner(trip_id)) with check (public.is_trip_owner(trip_id));
create policy "Owners delete checklist items" on public.checklist_items for delete to authenticated
  using (public.is_trip_owner(trip_id));

alter table public.checklist_done enable row level security;
create policy "Members manage their own done marks" on public.checklist_done for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.checklist_items i where i.id = item_id and public.is_trip_member(i.trip_id))
  );

drop policy "Owners manage their checklist suggestions" on public.checklist_suggestions;
create policy "Members read checklist suggestions" on public.checklist_suggestions for select to authenticated
  using (public.is_trip_member(trip_id));
create policy "Owners add checklist suggestions" on public.checklist_suggestions for insert to authenticated
  with check (public.is_trip_owner(trip_id));
create policy "Owners change checklist suggestions" on public.checklist_suggestions for update to authenticated
  using (public.is_trip_owner(trip_id)) with check (public.is_trip_owner(trip_id));

drop policy "Owners manage their prep checks" on public.prep_checks;
create policy "Members manage their own prep checks" on public.prep_checks for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.is_trip_member(trip_id));

drop policy "Owners manage their suggestion records" on public.suggestion_records;
create policy "Members manage their own suggestion records" on public.suggestion_records for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.is_trip_member(trip_id));

drop policy "Owners manage their expenses" on public.expenses;
create policy "Members read expenses" on public.expenses for select to authenticated
  using (public.is_trip_member(trip_id));
create policy "Members add expenses" on public.expenses for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_trip_member(trip_id));
create policy "Authors change expenses" on public.expenses for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "Authors delete expenses" on public.expenses for delete to authenticated
  using (user_id = (select auth.uid()));

alter table public.expense_people enable row level security;
create policy "Members read expense tags" on public.expense_people for select to authenticated
  using (exists (select 1 from public.expenses e where e.id = expense_id and public.is_trip_member(e.trip_id)));
create policy "Authors tag their expenses" on public.expense_people for insert to authenticated
  with check (exists (select 1 from public.expenses e where e.id = expense_id and e.user_id = (select auth.uid())));
create policy "Authors untag their expenses" on public.expense_people for delete to authenticated
  using (exists (select 1 from public.expenses e where e.id = expense_id and e.user_id = (select auth.uid())));

drop policy "Owners manage their document slots" on public.document_slots;
create policy "People manage their own document slots" on public.document_slots for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and public.is_trip_member(trip_id));
create policy "Members read slots holding shared files" on public.document_slots for select to authenticated
  using (
    public.is_trip_member(trip_id)
    and exists (select 1 from public.document_files f where f.slot_id = document_slots.id and f.shared)
  );

drop policy "Owners manage their document files" on public.document_files;
create policy "People manage their own document files" on public.document_files for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and public.is_trip_member(trip_id));
create policy "Members read shared document files" on public.document_files for select to authenticated
  using (shared and public.is_trip_member(trip_id));

create policy "Members read shared trip documents" on storage.objects for select to authenticated
  using (
    bucket_id = 'trip-documents'
    and exists (
      select 1 from public.document_files f
      where f.storage_path = storage.objects.name and f.shared and public.is_trip_member(f.trip_id)
    )
  );

grant select, update on public.trip_members to authenticated;
grant select, insert, update, delete on public.trip_invites to authenticated;
grant select, insert, update, delete on public.checklist_done to authenticated;
grant select, insert, update, delete on public.expense_people to authenticated;

-- ── joining and leaving ──────────────────────────────────────────────────────
-- What the join screen shows for an invite link (any signed-in account).
create function public.invite_info(p_token uuid)
returns table (status text, trip_id bigint, start_date date, end_date date, owner_nickname text, default_nickname text)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_invite record;
  v_trip record;
  v_email text;
begin
  select * into v_invite from public.trip_invites i where i.token = p_token;
  if not found then
    return query select 'invalid'::text, null::bigint, null::date, null::date, null::text, null::text;
    return;
  end if;
  select t.id, t.start_date, t.end_date into v_trip from public.trips t where t.id = v_invite.trip_id;
  select split_part(u.email, '@', 1) into v_email from auth.users u where u.id = (select auth.uid());
  return query
    select
      case
        when exists (select 1 from public.trip_members m where m.trip_id = v_trip.id and m.user_id = (select auth.uid()) and m.left_at is null) then 'joined'
        when v_invite.expires_at < now() then 'expired'
        when (select count(*) from public.trip_members m where m.trip_id = v_trip.id and m.left_at is null) >= 6 then 'full'
        else 'ok'
      end,
      v_trip.id, v_trip.start_date, v_trip.end_date,
      (select m.nickname from public.trip_members m where m.trip_id = v_trip.id and m.role = 'owner' limit 1),
      left(coalesce(nullif(v_email, ''), '나'), 10);
end $$;

create function public.join_trip(p_token uuid, p_nickname text)
returns table (status text, trip_id bigint)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_invite record;
  v_nick text := btrim(coalesce(p_nickname, ''));
begin
  select * into v_invite from public.trip_invites i where i.token = p_token;
  if not found then
    return query select 'invalid'::text, null::bigint; return;
  end if;
  if exists (select 1 from public.trip_members m where m.trip_id = v_invite.trip_id and m.user_id = (select auth.uid()) and m.left_at is null) then
    return query select 'joined'::text, v_invite.trip_id; return;
  end if;
  if v_invite.expires_at < now() then
    return query select 'expired'::text, null::bigint; return;
  end if;
  if char_length(v_nick) not between 1 and 10 then
    return query select 'bad_name'::text, null::bigint; return;
  end if;
  if (select count(*) from public.trip_members m where m.trip_id = v_invite.trip_id and m.left_at is null) >= 6 then
    return query select 'full'::text, null::bigint; return;
  end if;
  if exists (select 1 from public.trip_members m where m.trip_id = v_invite.trip_id and m.left_at is null and lower(m.nickname) = lower(v_nick)) then
    return query select 'taken'::text, null::bigint; return;
  end if;
  insert into public.trip_members (trip_id, user_id, nickname, role)
  values (v_invite.trip_id, (select auth.uid()), v_nick, 'companion');
  return query select 'ok'::text, v_invite.trip_id;
end $$;

-- Deletes what a person put on a trip other than expenses; returns their stored file paths.
create function public.purge_member_data(p_trip bigint, p_user uuid) returns text[]
language plpgsql security definer set search_path = '' as $$
declare
  v_paths text[];
begin
  select coalesce(array_agg(f.storage_path), '{}') into v_paths
  from public.document_files f where f.trip_id = p_trip and f.user_id = p_user;
  delete from public.document_files where trip_id = p_trip and user_id = p_user;
  delete from public.document_slots where trip_id = p_trip and user_id = p_user;
  delete from public.checklist_done d using public.checklist_items i
    where d.item_id = i.id and i.trip_id = p_trip and d.user_id = p_user;
  delete from public.prep_checks where trip_id = p_trip and user_id = p_user;
  delete from public.suggestion_records where trip_id = p_trip and user_id = p_user;
  return v_paths;
end $$;
revoke all on function public.purge_member_data(bigint, uuid) from public, anon, authenticated;

create function public.leave_trip(p_trip bigint) returns text[]
language plpgsql security definer set search_path = '' as $$
declare
  v_paths text[];
begin
  if not exists (
    select 1 from public.trip_members m
    where m.trip_id = p_trip and m.user_id = (select auth.uid()) and m.role = 'companion' and m.left_at is null
  ) then
    return '{}';
  end if;
  v_paths := public.purge_member_data(p_trip, (select auth.uid()));
  update public.trip_members set left_at = now()
    where trip_id = p_trip and user_id = (select auth.uid()) and left_at is null;
  return v_paths;
end $$;

create function public.remove_member(p_member bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_member record;
begin
  select * into v_member from public.trip_members m where m.id = p_member and m.left_at is null;
  if not found or v_member.role = 'owner' or not public.is_trip_owner(v_member.trip_id) then
    return;
  end if;
  perform public.purge_member_data(v_member.trip_id, v_member.user_id);
  update public.trip_members set left_at = now() where id = p_member;
end $$;

revoke all on function
  public.invite_info(uuid), public.join_trip(uuid, text), public.leave_trip(bigint), public.remove_member(bigint)
  from public, anon;
grant execute on function
  public.invite_info(uuid), public.join_trip(uuid, text), public.leave_trip(bigint), public.remove_member(bigint)
  to authenticated;
