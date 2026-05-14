-- Phase 1 / Slice 3 — initial schema for profiles, links, reserved_usernames.

create extension if not exists citext;

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- reserved_usernames (created first; profiles trigger reads from it)
-- ---------------------------------------------------------------------------

create table public.reserved_usernames (
  name citext primary key
);

alter table public.reserved_usernames enable row level security;

create policy "reserved_usernames are publicly readable"
  on public.reserved_usernames for select
  to anon, authenticated
  using (true);

-- Mutations are service-role only — no policy needed because anon/authenticated
-- have no INSERT/UPDATE/DELETE policies and so are denied by default under RLS.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username citext not null unique,
  display_name text not null,
  bio text,
  avatar_url text,
  theme_id text not null default 'sunrise',
  language text not null default 'he' check (language in ('he','en')),
  plan text not null default 'free' check (plan in ('free','pro')),
  niche text,
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- CHECK can't reference other tables, so enforce reserved-username via trigger.
create or replace function public.enforce_username_not_reserved()
returns trigger
language plpgsql
as $$
begin
  if exists (select 1 from public.reserved_usernames where name = new.username) then
    raise exception 'Username "%" is reserved', new.username;
  end if;
  return new;
end;
$$;

create trigger no_reserved_username
  before insert or update of username on public.profiles
  for each row
  execute function public.enforce_username_not_reserved();

create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles are publicly readable"
  on public.profiles for select
  to anon, authenticated
  using (true);

create policy "users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "users can delete their own profile"
  on public.profiles for delete
  to authenticated
  using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- links
-- ---------------------------------------------------------------------------

create table public.links (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  url text not null,
  icon text,
  position int not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, position) deferrable initially deferred
);

create trigger links_updated_at
  before update on public.links
  for each row
  execute function public.set_updated_at();

create index links_profile_position_idx
  on public.links (profile_id, position)
  where is_active = true;

alter table public.links enable row level security;

create policy "active links are publicly readable"
  on public.links for select
  to anon
  using (is_active = true);

create policy "owners read their links; everyone else only sees active"
  on public.links for select
  to authenticated
  using (auth.uid() = profile_id or is_active = true);

create policy "owners can insert links"
  on public.links for insert
  to authenticated
  with check (auth.uid() = profile_id);

create policy "owners can update links"
  on public.links for update
  to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

create policy "owners can delete links"
  on public.links for delete
  to authenticated
  using (auth.uid() = profile_id);
