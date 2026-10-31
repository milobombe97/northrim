-- Copy to configure-email-dispatch.local.sql (gitignored), fill values, then:
-- npx supabase db query --linked -f supabase/scripts/configure-email-dispatch.local.sql

insert into internal.email_dispatch_config (id, function_url, webhook_secret)
values (
  1,
  'https://zgixrjmjhyyivdxwwvvc.supabase.co/functions/v1/transactional-email',
  'YOUR_EMAIL_WEBHOOK_SECRET'
)
on conflict (id) do update set
  function_url = excluded.function_url,
  webhook_secret = excluded.webhook_secret;
