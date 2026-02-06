alter table public.users_roles enable row level security;

create or replace function public.is_master(uid uuid)
returns boolean
language sql
security definer
set row_security = off
as $$
  select exists (
    select 1 from public.users_roles
    where user_id = uid and role = 'master'
  );
$$;

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set row_security = off
as $$
  select exists (
    select 1 from public.users_roles
    where user_id = uid and role in ('master', 'operator')
  );
$$;

do $$
begin
  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'users_roles' and policyname = 'users_roles_master_select'
  ) then
    drop policy users_roles_master_select on public.users_roles;
  end if;

  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'users_roles' and policyname = 'users_roles_master_insert'
  ) then
    drop policy users_roles_master_insert on public.users_roles;
  end if;

  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'users_roles' and policyname = 'users_roles_master_update'
  ) then
    drop policy users_roles_master_update on public.users_roles;
  end if;

  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'users_roles' and policyname = 'users_roles_master_delete'
  ) then
    drop policy users_roles_master_delete on public.users_roles;
  end if;

  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'users_roles' and policyname = 'users_roles_self_select'
  ) then
    drop policy users_roles_self_select on public.users_roles;
  end if;

  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'users_roles' and policyname = 'users_roles_admin_select'
  ) then
    drop policy users_roles_admin_select on public.users_roles;
  end if;

  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'users_roles' and policyname = 'users_roles_master_all'
  ) then
    drop policy users_roles_master_all on public.users_roles;
  end if;

  create policy users_roles_self_select on public.users_roles
    for select using (auth.uid() = user_id);

  create policy users_roles_admin_select on public.users_roles
    for select using (public.is_admin(auth.uid()));

  create policy users_roles_master_all on public.users_roles
    for all using (public.is_master(auth.uid()))
    with check (public.is_master(auth.uid()));
end $$;

alter table public.user_profiles
  add column if not exists is_banned boolean not null default false;

alter table public.user_profiles
  add column if not exists deleted_at timestamptz;

alter table public.user_profiles enable row level security;

do $$
begin
  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'user_profiles_master_select'
  ) then
    drop policy user_profiles_master_select on public.user_profiles;
  end if;

  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'user_profiles_master_update'
  ) then
    drop policy user_profiles_master_update on public.user_profiles;
  end if;

  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'user_profiles_self_select'
  ) then
    drop policy user_profiles_self_select on public.user_profiles;
  end if;

  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'user_profiles_admin_select'
  ) then
    drop policy user_profiles_admin_select on public.user_profiles;
  end if;

  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'user_profiles_self_insert'
  ) then
    drop policy user_profiles_self_insert on public.user_profiles;
  end if;

  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'user_profiles_self_update'
  ) then
    drop policy user_profiles_self_update on public.user_profiles;
  end if;

  if exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'user_profiles_master_update'
  ) then
    drop policy user_profiles_master_update on public.user_profiles;
  end if;

  create policy user_profiles_self_select on public.user_profiles
    for select using (auth.uid() = user_id);

  create policy user_profiles_admin_select on public.user_profiles
    for select using (public.is_admin(auth.uid()));

  create policy user_profiles_self_insert on public.user_profiles
    for insert with check (auth.uid() = user_id);

  create policy user_profiles_self_update on public.user_profiles
    for update using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

  create policy user_profiles_master_update on public.user_profiles
    for update using (public.is_master(auth.uid()))
    with check (public.is_master(auth.uid()));
end $$;

create or replace function public.get_users_auth_info(uids uuid[])
returns table (
  user_id uuid,
  email text,
  last_sign_in_at timestamptz
)
language sql
security definer
set row_security = off
as $$
  select u.id as user_id,
         u.email,
         u.last_sign_in_at
  from auth.users u
  where public.is_admin(auth.uid())
    and u.id = any(uids);
$$;
