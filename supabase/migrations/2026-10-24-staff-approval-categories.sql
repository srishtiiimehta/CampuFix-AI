-- CampusFix account categories and explicit staff approval.
-- Safe to apply to the existing CampusFix schema (public.profiles: id, full_name, role).
-- Existing accounts and ticket tables are preserved. Existing staff are grandfathered as approved.

alter table public.profiles
  add column if not exists category text;

-- Grandfather current staff only when this approval column is first introduced. This block is
-- deliberately idempotent: re-running the migration must never approve newer pending staff.
do $$
declare
  approval_column_exists boolean;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'staff_approved'
  ) into approval_column_exists;

  if not approval_column_exists then
    alter table public.profiles add column staff_approved boolean not null default false;
    update public.profiles set staff_approved = true where role = 'staff';
  end if;
end;
$$;

-- Give existing students a useful display category without overwriting any existing category.
update public.profiles
set category = 'Student'
where role = 'student' and (category is null or btrim(category) = '');

-- Never infer staff permission from auth metadata. New Auth users always start as students;
-- the server may set a requested staff role, but always with staff_approved = false.
create or replace function public.create_campusfix_profile()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role, category, staff_approved)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'student',
    'Student',
    false
  ) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists campusfix_profile_after_signup on auth.users;
create trigger campusfix_profile_after_signup
after insert on auth.users
for each row execute procedure public.create_campusfix_profile();

-- Profiles remain writable only by the server's service role; never grant approval rights to clients.
alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant all on public.profiles to service_role;
