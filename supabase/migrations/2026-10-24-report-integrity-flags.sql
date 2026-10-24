-- Persistent account flags for explicitly admitted fabricated reports.
-- Only the server service role should set or clear these fields.
alter table public.profiles
  add column if not exists is_flagged boolean not null default false,
  add column if not exists flag_reason text,
  add column if not exists flagged_at timestamptz;
