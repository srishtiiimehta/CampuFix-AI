-- Run this once in the Supabase SQL Editor.
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role text not null default 'student' check (role in ('student', 'staff')),
  category text not null default 'Student',
  staff_approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.tickets (
  ticket_id text primary key,
  record jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.tickets enable row level security;

-- The application server uses the service-role key. Browser clients receive no table policies.
revoke all on public.profiles from anon, authenticated;
revoke all on public.tickets from anon, authenticated;

grant all on public.profiles to service_role;
grant all on public.tickets to service_role;

create or replace function public.create_campusfix_profile()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (user_id, display_name, role, category, staff_approved)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    'student',
    'Student',
    false
  ) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists campusfix_profile_after_signup on auth.users;
create trigger campusfix_profile_after_signup
after insert on auth.users
for each row execute procedure public.create_campusfix_profile();
