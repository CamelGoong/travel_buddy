-- Trip document vault: document slots, uploaded files, and a private Storage
-- bucket. Owner-only everywhere (docs/decisions/data-storage.md).
-- Files live at "<user_id>/<trip_id>/<uuid>" in the private "trip-documents" bucket.

create table public.document_slots (
  id bigint generated always as identity primary key,
  trip_id bigint not null references public.trips (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('passport', 'flight', 'stay', 'transit-pass', 'ticket', 'insurance', 'custom')),
  name text not null check (char_length(name) between 1 and 20),
  position smallint not null,
  created_at timestamptz not null default now()
);

-- One default slot per kind per trip; custom slots can repeat.
create unique index document_slots_trip_kind_unique
  on public.document_slots (trip_id, kind) where kind <> 'custom';
create index document_slots_user_id_idx on public.document_slots (user_id);
create index document_slots_trip_id_idx on public.document_slots (trip_id);

create table public.document_files (
  id bigint generated always as identity primary key,
  slot_id bigint not null references public.document_slots (id) on delete cascade,
  trip_id bigint not null references public.trips (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  file_name text not null check (char_length(file_name) between 1 and 200),
  storage_path text not null unique,
  content_type text not null check (content_type in ('image/jpeg', 'image/png', 'application/pdf')),
  size_bytes integer not null check (size_bytes between 1 and 10485760),
  -- Place name from the course draft this ticket belongs to (tickets only)
  place_name text check (place_name is null or char_length(place_name) <= 60),
  created_at timestamptz not null default now()
);

create index document_files_slot_id_idx on public.document_files (slot_id);
create index document_files_user_id_idx on public.document_files (user_id);

alter table public.document_slots enable row level security;
alter table public.document_files enable row level security;

create policy "Owners manage their document slots" on public.document_slots
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Owners manage their document files" on public.document_files
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.document_slots to authenticated;
grant select, insert, update, delete on public.document_files to authenticated;

-- Private bucket: 10MB, JPG / PNG / PDF only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'trip-documents',
  'trip-documents',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'application/pdf']
)
on conflict (id) do nothing;

-- Each user reaches only the folder named after their own user id.
create policy "Owners read their trip documents" on storage.objects
  for select to authenticated
  using (bucket_id = 'trip-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Owners upload their trip documents" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'trip-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Owners delete their trip documents" on storage.objects
  for delete to authenticated
  using (bucket_id = 'trip-documents' and (storage.foldername(name))[1] = (select auth.uid())::text);
