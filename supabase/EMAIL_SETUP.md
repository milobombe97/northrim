# North Rim Inc. — transactional email (Resend + Supabase Edge Functions)

Emails are sent **only** from the Supabase Edge Function `transactional-email`. The Vite app never calls Resend.

**Flow:** Database change → **Database Webhook** → Edge Function → **Resend** → customer (+ CC `info@nevoluteinc.com` on user-facing mail).

---

## 1. Resend setup

1. Create an account at [resend.com](https://resend.com).
2. Add and verify your sending domain (e.g. `nevoluteinc.com`) with the DNS records Resend provides (SPF, DKIM, optional DMARC).
3. Create an API key with **Sending access** only.
4. Set the default sender to match your verified domain, e.g. `info@nevoluteinc.com`.

Until the domain is verified you can test with Resend’s sandbox `onboarding@resend.dev` (only delivers to your Resend account email). For production, set `FROM_EMAIL` via `supabase secrets set FROM_EMAIL="Your Brand <info@yourdomain.com>"` (or edit defaults in `supabase/functions/_shared/constants.ts` once).

---

## Duplicate frontends (same Resend + same Supabase)

Additional marketing sites or Vercel projects **do not** repeat Resend or Supabase setup. Copy the repo (`npm run duplicate-site -- ../new-folder`), reuse `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, deploy the static build, and add the new origin under **Authentication → URL Configuration → Redirect URLs**. Details: [docs/duplicate-site.md](../docs/duplicate-site.md).

---

## 2. Supabase secrets (Edge Function only)

Install the [Supabase CLI](https://supabase.com/docs/guides/cli) and link the project:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

Set secrets (never put these in the frontend or `.env` committed to git):

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxx
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
supabase secrets set SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
supabase secrets set EMAIL_WEBHOOK_SECRET=choose_a_long_random_string
# Optional branding (shared by all site clones using this project):
# supabase secrets set COMPANY_WEB_URL=https://www.nevoluteinc.com
# supabase secrets set DASHBOARD_URL=https://www.nevoluteinc.com/dashboard
```

| Secret | Purpose |
|--------|---------|
| `RESEND_API_KEY` | Resend API (Edge Function only) |
| `SUPABASE_SERVICE_ROLE_KEY` | Look up profile emails / related rows |
| `SUPABASE_URL` | Project URL for admin client |
| `EMAIL_WEBHOOK_SECRET` | Validates Database Webhook requests (`x-webhook-secret` header). Do not use the `SUPABASE_` prefix — CLI rejects it. |
| `COMPANY_WEB_URL`, `DASHBOARD_URL`, `FROM_EMAIL`, … | Optional overrides; defaults in `functions/_shared/constants.ts` |

`SUPABASE_URL` and service role are also available in the Edge runtime in hosted projects; setting them explicitly keeps local `supabase functions serve` working.

---

## 3. Deploy the Edge Function

```bash
supabase functions deploy transactional-email --no-verify-jwt
```

Function URL:

```text
https://YOUR_PROJECT_REF.supabase.co/functions/v1/transactional-email
```

`supabase/config.toml` sets `verify_jwt = false` so Database Webhooks can call the function with the shared secret instead of a user JWT.

---

## 4. Wire the database to the Edge Function

### Option A (recommended): SQL triggers + pg_net

This repo includes migration `supabase/migrations/*_email_dispatch_triggers.sql`. It posts the same JSON payload as Dashboard webhooks when rows change.

```bash
npx supabase db push
```

Configure the function URL and webhook secret (must match `EMAIL_WEBHOOK_SECRET`):

```bash
# Copy supabase/scripts/configure-email-dispatch.example.sql → configure-email-dispatch.local.sql, edit, then:
npx supabase db query --linked -f supabase/scripts/configure-email-dispatch.local.sql
```

Tables wired: `profiles`, `kyc_submissions`, `receipts`, `transactions` (INSERT only).

### Option B: Dashboard Database Webhooks

If you prefer the UI, use **Database → Webhooks** with the same URL, header `x-webhook-secret`, and tables/events listed in `supabase/webhooks.example.json`. Do **not** use both Option A and B on the same tables (duplicate emails).

---

## 5. Events covered

| Event | Trigger | Recipients |
|-------|---------|------------|
| Sign up | `profiles` INSERT | User + CC admin |
| KYC submitted | `kyc_submissions` INSERT | User + CC admin; admin copy email |
| KYC approved / rejected | `kyc_submissions` UPDATE (`status`) | User + CC admin |
| Receipt submitted | `receipts` INSERT | User + CC admin; admin copy |
| Receipt approved / rejected | `receipts` UPDATE (`status`) | User + CC admin |
| Transfer | `transactions` INSERT (`Transfer`, approved, outgoing leg) | Sender + receiver + admin (P2P); user + admin (internal) |
| Account suspended | `profiles` UPDATE → `suspended` | User + CC admin; admin notice |
| Account deleted | `profiles` UPDATE → `deleted` | User + CC admin; admin notice |

Templates live in `supabase/functions/_shared/templates/`.

---

## 6. Testing

### Local serve (optional)

```bash
supabase functions serve transactional-email --no-verify-jwt --env-file supabase/.env.local
```

Create `supabase/.env.local` (gitignored) with the same secrets as above.

### Sample curl (welcome)

```bash
curl -X POST "http://localhost:54321/functions/v1/transactional-email" \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: YOUR_SECRET" \
  -d '{
    "type": "INSERT",
    "table": "profiles",
    "record": {
      "id": "00000000-0000-4000-8000-000000000001",
      "email": "you@example.com",
      "first_name": "Test",
      "last_name": "User",
      "status": "active"
    }
  }'
```

### Test matrix (production)

1. **Welcome** — Register a new user (profile row inserted).
2. **KYC** — Submit KYC; approve/reject in admin.
3. **Receipt** — Top-up + upload receipt; approve/decline in admin payments.
4. **Transfer** — P2P transfer by email; check sender, receiver, and `info@nevoluteinc.com`.
5. **Suspend / delete** — Admin client page → Suspend or Soft delete.

Check **Edge Functions → transactional-email → Logs** in Supabase and **Resend → Emails** for delivery.

---

## 7. Security notes

- Resend key and service role **only** in Supabase secrets.
- Webhook secret required on every request; rotate if leaked.
- Do not enable JWT verification on this function for DB webhooks; use the shared secret instead.
- Remove or disable the legacy Vercel route `api/supabase-webhook.ts` if you still have it deployed.

---

## 9. Deliverability (banking / transactional standards)

Code in `supabase/functions/_shared/` implements practices used by financial institutions to reduce spam scoring and blacklisting:

| Requirement | Implementation |
|-------------|----------------|
| **Authenticated sending** | Verify domain in Resend with **SPF**, **DKIM**, and **DMARC** (DNS at your registrar). Without these, inbox placement fails regardless of content. |
| **Aligned From / Reply-To** | `FROM_EMAIL` and `REPLY_TO_EMAIL` on the same verified domain (`info@nevoluteinc.com`). |
| **Multipart alternative** | Every send includes **HTML + plain text** (`emailStandards.ts` → `buildPlainBody`). |
| **RFC 3834 auto-generated** | Header `Auto-Submitted: auto-generated` on all transactional mail. |
| **No auto-replies to customers** | `X-Auto-Response-Suppress: All`. |
| **List-Unsubscribe (mailto)** | Header for notification preference contact (transactional, not marketing lists). |
| **Reference tracing** | `X-Entity-Ref-ID` + Resend tags (`category`, `stream=transactional`) per message type. |
| **Institutional footer** | Company name, postal address (`REGISTERED_POSTAL_ADDRESS` in `constants.ts`), website, confidentiality notice. |
| **Security copy** | No password/PIN requests; misdirected-mail instructions. |

**You must:** set `REGISTERED_POSTAL_ADDRESS` in `constants.ts` to your real registered business address (CAN-SPAM and many banking compliance checklists require a valid postal address).

**Recommended DNS:** DMARC policy `p=quarantine` or `p=reject` after monitoring; keep SPF include to Resend only; enable Resend click/open tracking **off** for banking mail if your policy requires minimal tracking pixels.

Redeploy after template or standards changes:

```bash
supabase functions deploy transactional-email --no-verify-jwt
```

---

## 8. Maintenance

- Edit copy/layout in `supabase/functions/_shared/templates/`.
- Redeploy after changes: `supabase functions deploy transactional-email --no-verify-jwt`.
- Admin CC address: `ADMIN_EMAIL` in `supabase/functions/_shared/constants.ts`.
