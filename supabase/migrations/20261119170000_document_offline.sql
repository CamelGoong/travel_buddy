-- Offline switch for document files whose slot is not saved on the device by default
-- (passport, insurance, custom slots) (docs/specs/offline-documents/).

alter table public.document_files add column offline boolean not null default false;
