# Jointer — one-time setup

You need to do this once after slice 3 (auth) lands. Until it's done, sign-in won't work locally or in production.

## 1. Supabase project

1. Go to [supabase.com](https://supabase.com) → New project.
2. Pick a region close to Israel (Frankfurt `eu-central-1` is a good default).
3. Save the **database password** somewhere safe.
4. Wait ~2 minutes for provisioning.

In **Project Settings → API Keys** (new key model — `sb_publishable_*` / `sb_secret_*`, not the legacy anon/service_role JWTs):
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **Publishable key** (`sb_publishable_...`) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- **Secret key** (`sb_secret_...`) → `SUPABASE_SECRET_KEY`

> If your project still shows only the legacy "anon / service_role" keys, click **API Keys → New API Keys** to generate the publishable + secret pair. The legacy keys still work but are deprecated.

## 2. Local env vars

Create `.env.local` in the repo root (copy from `.env.example`):

```bash
cp .env.example .env.local
```

Fill in the values from step 1.

## 3. Push migrations to the project

```bash
supabase login                                # opens browser
supabase link --project-ref <YOUR-PROJECT-REF>   # from the Supabase URL
supabase db push
```

Verify in the Supabase dashboard → **Table Editor** that `profiles`, `links`, and `reserved_usernames` exist with RLS enabled (shield icon). `reserved_usernames` should have 20 rows seeded.

## 4. Resend for transactional emails

1. Sign up at [resend.com](https://resend.com).
2. Add a domain (or use the test sender for now). For the launch you'll want `jointer.co` verified — see [Resend docs on DNS setup](https://resend.com/docs/dashboard/domains/introduction).
3. **API Keys → Create** → copy.
4. In Supabase → **Project Settings → Authentication → SMTP Settings**:
   - Enable custom SMTP
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: your Resend API key
   - Sender email: `noreply@<your-domain>` (or use Resend's `onboarding@resend.dev` for testing)
   - Sender name: `Jointer`

Without this, Supabase's default SMTP rate-limits you to 3 emails/hour and magic links will start failing on day one.

## 5. Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com) → create a project (or reuse one).
2. **APIs & Services → OAuth consent screen** → External, fill required fields.
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID → Web application**.
4. **Authorized redirect URIs** — add:
   - `https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback`
5. Copy **Client ID** and **Client secret**.
6. In Supabase → **Authentication → Providers → Google** → enable, paste both values, save.

## 6. Supabase Auth URLs

In Supabase → **Authentication → URL Configuration**:

- **Site URL**: `https://jointer.co` (or your current production URL)
- **Redirect URLs** (add each one):
  - `https://jointer.co/auth/callback`
  - `https://*.vercel.app/auth/callback` (for preview deploys)
  - `http://localhost:3000/auth/callback` (for local dev)

Without correct Redirect URLs, OAuth and magic-link callbacks will be rejected.

## 7. Vercel env vars

In the Vercel dashboard → your project → **Settings → Environment Variables**, add the same three vars from step 1:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`

Plus `NEXT_PUBLIC_SITE_URL=https://jointer.co` (or your production domain).

Redeploy after adding. (Or push a commit — Vercel auto-redeploys.)

## 8. Verify

Local:
```bash
pnpm dev
# Open http://localhost:3000/login
# Try Google: should redirect to Google → back to /auth/callback → /onboarding/username
# Try magic link: enter your email → check inbox → click link → land on /onboarding/username
```

Production:
- Visit `https://jointer.co/login`, repeat.

Once both flows work, close GitHub issue #5.

## Troubleshooting

- **"redirect_uri_mismatch" on Google OAuth** → step 5 redirect URI must exactly match what Supabase generates (`<project-ref>.supabase.co/auth/v1/callback`, not your app's `/auth/callback`).
- **Magic link email never arrives** → check Resend dashboard logs first; if no record, Supabase isn't using your SMTP config (check step 4).
- **"Email not confirmed" error** → Supabase requires email confirmation by default. In **Authentication → Providers → Email**, disable "Confirm email" for dev, or keep it on for prod.
- **CORS errors in browser console** → Site URL in step 6 must match the origin you're hitting.
