-- Phase 1 / Slice 3 — seed reserved usernames.
-- These names cannot be claimed as profile usernames because they collide
-- with current or planned application routes.

insert into public.reserved_usernames (name) values
  ('admin'),
  ('api'),
  ('app'),
  ('auth'),
  ('dashboard'),
  ('help'),
  ('login'),
  ('logout'),
  ('onboarding'),
  ('pricing'),
  ('settings'),
  ('signup'),
  ('support'),
  ('terms'),
  ('privacy'),
  ('blog'),
  ('about'),
  ('contact'),
  ('en'),
  ('he')
on conflict (name) do nothing;
