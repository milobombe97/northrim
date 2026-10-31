# Duplicate the bank frontend (same Supabase + Resend)

This app is split on purpose:

| Layer | Where it lives | Clone a new site? |
|-------|----------------|-------------------|
| Database, auth, storage, RPCs | One Supabase project | **No** — reuse |
| Transactional email | Supabase Edge Function + **Resend secrets** | **No** — reuse |
| Marketing UI (Vite) | Vercel (or any static host) | **Yes** — copy & deploy |

Resend is never configured in the Vite app. After the first setup in [supabase/EMAIL_SETUP.md](../supabase/EMAIL_SETUP.md), additional domains only need the **same two frontend env vars**.

## Quick copy

From the repo root:

```bash
node scripts/duplicate-site.mjs ../my-new-bank-site
cd ../my-new-bank-site
npm install
npm run dev
```

The script copies the tree (excluding `node_modules`, `dist`, `.git`), copies your existing `.env` when present, and prints the Supabase Auth URL checklist.

## Environment variables

Copy **identical** values into each deployment:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

See [shared-backend.env.example](../shared-backend.env.example). Optional: `VITE_PUBLIC_SITE_URL` for per-site branding later.

On Vercel: Project → Settings → Environment Variables → Production (same keys as local `.env`).

## Supabase Auth (only step that mentions the new domain)

Dashboard → **Authentication** → **URL Configuration**:

1. **Site URL** — primary production URL (can stay on your main domain).
2. **Redirect URLs** — add each clone, e.g. `https://new-site.com/**`, `http://localhost:5173/**`.

No new Supabase project, no new Resend API key, no redeploy of email triggers unless you changed SQL migrations.

## Email links

Templates use `COMPANY_WEB_URL` / `DASHBOARD_URL` from Edge Function env (defaults in `supabase/functions/_shared/constants.ts`). Override once for all mail:

```bash
supabase secrets set COMPANY_WEB_URL=https://www.nevoluteinc.com
supabase secrets set DASHBOARD_URL=https://www.nevoluteinc.com/dashboard
```

## CI

Each Vercel project needs its own `VERCEL_PROJECT_ID` secret in GitHub if you use [.github/workflows/deploy-vercel.yml](../.github/workflows/deploy-vercel.yml). Supabase and Resend secrets stay in Supabase only.
