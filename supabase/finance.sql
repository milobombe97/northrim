-- Financial features (also in schema.sql). Run after profiles + accounts exist.
-- Create a private Storage bucket named "receipts".

-- Posted balances on accounts (non-negative).
alter table public.accounts add column if not exists balance numeric not null default 0;
alter table public.accounts drop constraint if exists accounts_balance_nonneg;
alter table public.accounts add constraint accounts_balance_nonneg check (balance >= 0);

-- Top-up receipt submissions (image in storage at {user_id}/{transaction_id}).
-- withdrawal_requests + RPCs: review_receipt, review_pending_transaction,
-- transfer_between_own_accounts, transfer_between_users, request_withdrawal, review_withdrawal.
-- See schema.sql for full definitions, grants, and RLS.
