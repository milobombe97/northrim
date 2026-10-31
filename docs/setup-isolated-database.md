# North Rim Inc. — isolated Supabase + Resend

This copy uses its **own** Supabase project (not the original Nevolute database).

## 1. Create Supabase project

1. [supabase.com/dashboard](https://supabase.com/dashboard) → **New project** (e.g. `north-rim-bank`).
2. Note **Project URL** and **anon** key (Settings → API).

Local frontend `.env`:

```env
VITE_SUPABASE_URL=https://YOUR_NEW_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-new-anon-key
VITE_PUBLIC_SITE_URL=https://northrimbankinc.com
```

## 2. Apply schema

```bash
cd north-rim-bank
npx supabase login
npx supabase link --project-ref YOUR_NEW_REF
npx supabase db push
```

## 3. Auth URLs

Dashboard → **Authentication** → **URL Configuration**:

- **Site URL:** `https://northrimbankinc.com`
- **Redirect URLs:** `https://northrimbankinc.com/**`, `http://localhost:5173/**`

## 4. Resend (once per project)

1. Verify domain **northrimbankinc.com** in Resend (SPF/DKIM).
2. Create a sending API key.

```bash
npx supabase secrets set RESEND_API_KEY=re_xxxx
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
npx supabase secrets set SUPABASE_URL=https://YOUR_NEW_REF.supabase.co
npx supabase secrets set EMAIL_WEBHOOK_SECRET=long_random_string
npx supabase secrets set COMPANY_WEB_URL=https://northrimbankinc.com
npx supabase secrets set DASHBOARD_URL=https://northrimbankinc.com/dashboard
```

Deploy email function:

```bash
npx supabase functions deploy transactional-email --no-verify-jwt
npx supabase functions deploy admin-staff
```

Configure dispatch (edit `supabase/scripts/configure-email-dispatch.local.sql` from the example, then):

```bash
npx supabase db query --linked -f supabase/scripts/configure-email-dispatch.local.sql
```

See [supabase/EMAIL_SETUP.md](../supabase/EMAIL_SETUP.md) for webhook/trigger details.

## 5. Vercel

New project for `northrimbankinc.com`, same three env vars as local `.env`, then deploy.

## 6. Staff admin

Create the first staff user in Supabase Auth, then set `profiles.role = 'admin'` (or use your existing staff signup flow).
