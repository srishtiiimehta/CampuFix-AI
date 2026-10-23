-- Add CampusFix's full-fidelity ticket store alongside the existing normalized tables.
-- Safe for projects that already have public.profiles and public.tickets.
create table if not exists public.campusfix_ticket_records (
  ticket_id text primary key,
  record jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.campusfix_ticket_records enable row level security;
revoke all on public.campusfix_ticket_records from anon, authenticated;
grant all on public.campusfix_ticket_records to service_role;

-- Existing profiles schema: id uuid, full_name text, role text.
create or replace function public.create_campusfix_profile()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'student'
  ) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists campusfix_profile_after_signup on auth.users;
create trigger campusfix_profile_after_signup
after insert on auth.users
for each row execute procedure public.create_campusfix_profile();
