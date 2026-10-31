-- Promote known North Rim staff emails (must already exist as auth users + profiles).
update public.profiles
set role = 'super', updated_at = now()
where lower(trim(email)) in ('info@nevoluteinc.com', 'admin@nevolute.inc')
  and role = 'customer';

-- One pending receipt row per user + pending transaction id.
create unique index if not exists receipts_user_tx_pending_uidx
  on public.receipts (user_id, transaction_id)
  where status = 'pending' and transaction_id is not null;
