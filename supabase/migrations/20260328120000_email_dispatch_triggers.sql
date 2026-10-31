-- Reliable email dispatch: Postgres triggers → pg_net → transactional-email Edge Function.
-- Replaces manual Supabase Dashboard "Database Webhooks" setup.
-- After migration, run supabase/scripts/configure-email-dispatch.sql on the linked project.

create extension if not exists pg_net with schema extensions;

create schema if not exists internal;

create table if not exists internal.email_dispatch_config (
  id int primary key default 1 check (id = 1),
  function_url text not null default '',
  webhook_secret text not null default ''
);

revoke all on schema internal from public, anon, authenticated;
revoke all on all tables in schema internal from public, anon, authenticated;

create or replace function internal.notify_transactional_email()
returns trigger
language plpgsql
security definer
set search_path = public, internal, extensions
as $$
declare
  cfg internal.email_dispatch_config%rowtype;
  payload jsonb;
begin
  select * into cfg from internal.email_dispatch_config where id = 1;
  if cfg.function_url = '' or cfg.webhook_secret = '' then
    return coalesce(NEW, OLD);
  end if;

  if TG_OP = 'DELETE' then
    return OLD;
  end if;

  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', to_jsonb(NEW),
    'old_record', case when TG_OP = 'UPDATE' then to_jsonb(OLD) else null end
  );

  perform net.http_post(
    url := cfg.function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', cfg.webhook_secret
    ),
    body := payload
  );

  return NEW;
end;
$$;

drop trigger if exists email_notify_profiles on public.profiles;
create trigger email_notify_profiles
  after insert or update on public.profiles
  for each row execute function internal.notify_transactional_email();

drop trigger if exists email_notify_kyc_submissions on public.kyc_submissions;
create trigger email_notify_kyc_submissions
  after insert or update on public.kyc_submissions
  for each row execute function internal.notify_transactional_email();

drop trigger if exists email_notify_receipts on public.receipts;
create trigger email_notify_receipts
  after insert or update on public.receipts
  for each row execute function internal.notify_transactional_email();

drop trigger if exists email_notify_transactions on public.transactions;
create trigger email_notify_transactions
  after insert on public.transactions
  for each row execute function internal.notify_transactional_email();
