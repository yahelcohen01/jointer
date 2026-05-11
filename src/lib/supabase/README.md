# Supabase clients

Three client factories live here, added in Phase 1 / Slice 3 (issue #5):

- `client.ts` — browser (cookies via `@supabase/ssr`'s `createBrowserClient`)
- `server.ts` — Server Components / Server Actions (`createServerClient` with `cookies()`)
- `middleware.ts` — Edge middleware (`createServerClient` with request/response cookie handling)

Phase 1 / Slice 1 only installs the dependencies; clients are wired up when auth lands.
