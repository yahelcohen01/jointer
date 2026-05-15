-- Reserve `u` so it cannot be claimed as a profile username.
-- The application rewrites bare `/joe` → `/u/joe` at the proxy, so the
-- top-level `u` segment must not collide with a creator's profile slug.

insert into public.reserved_usernames (name) values
  ('u')
on conflict (name) do nothing;
