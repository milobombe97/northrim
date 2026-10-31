-- North Rim Inc banking schema.
-- Run the whole script once in the Supabase SQL Editor.
-- Safe to run again: it adds missing columns and replaces policies.
-- Afterward, create private Storage buckets named "receipts" and "kyc".

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Profiles. One row per auth user.
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  phone text not null default '',
  email text not null default '',
  role text not null default 'customer',
  status text not null default 'active',
  kyc_status text not null default 'not_started',
  kyc jsonb,
  settings jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text not null default '';
alter table public.profiles add column if not exists phone text not null default '';
alter table public.profiles add column if not exists status text;
alter table public.profiles add column if not exists kyc_status text not null default 'not_started';
alter table public.profiles add column if not exists kyc jsonb;
alter table public.profiles add column if not exists settings jsonb;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

-- Older installs used role "client" and a suspended boolean.
update public.profiles set role = 'customer' where role = 'client';

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'suspended'
  ) then
    execute 'update public.profiles set status = case when suspended then ''suspended'' else ''active'' end where status is null';
  end if;
  update public.profiles set status = 'active' where status is null;
end $$;

alter table public.profiles alter column status set default 'active';
alter table public.profiles alter column status set not null;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('customer', 'admin', 'super'));

alter table public.profiles drop constraint if exists profiles_status_check;
alter table public.profiles
  add constraint profiles_status_check check (status in ('active', 'suspended', 'deleted'));

alter table public.profiles drop constraint if exists profiles_kyc_status_check;
alter table public.profiles
  add constraint profiles_kyc_status_check
  check (kyc_status in ('not_started', 'in_review', 'verified', 'rejected'));

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_status_idx on public.profiles (status);
create index if not exists profiles_kyc_status_idx on public.profiles (kyc_status);

-- ---------------------------------------------------------------------------
-- Accounts. One row per currency account owned by a profile.
-- code matches the app: personal, savings, euro, usd.
-- ---------------------------------------------------------------------------

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  code text not null,
  name text not null,
  currency text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, code)
);

alter table public.accounts drop constraint if exists accounts_currency_check;
alter table public.accounts
  add constraint accounts_currency_check check (currency in ('USD', 'GBP', 'EUR'));

create index if not exists accounts_user_id_idx on public.accounts (user_id);

alter table public.accounts add column if not exists balance numeric not null default 0;
alter table public.accounts drop constraint if exists accounts_balance_nonneg;
alter table public.accounts
  add constraint accounts_balance_nonneg check (balance >= 0);

-- Backfill posted balance from approved ledger rows (safe to re-run).
update public.accounts a
set balance = coalesce(
  (
    select sum(t.amount)
    from public.transactions t
    where t.user_id = a.user_id
      and t.account_id = a.code
      and (t.status is null or t.status = 'approved')
  ),
  0
);

-- ---------------------------------------------------------------------------
-- Transactions. account_id stores the account code and points at accounts.
-- ---------------------------------------------------------------------------

create table if not exists public.transactions (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  account_id text not null,
  name text not null,
  category text not null,
  amount numeric not null,
  date date not null,
  status text,
  method text,
  receipt_name text,
  receipt_path text,
  receipt_sent boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.transactions add column if not exists status text;
alter table public.transactions add column if not exists method text;
alter table public.transactions add column if not exists receipt_name text;
alter table public.transactions add column if not exists receipt_path text;
alter table public.transactions add column if not exists receipt_sent boolean not null default false;
alter table public.transactions add column if not exists created_at timestamptz not null default now();
alter table public.transactions add column if not exists updated_at timestamptz not null default now();

alter table public.transactions drop constraint if exists transactions_status_check;
alter table public.transactions
  add constraint transactions_status_check
  check (status is null or status in ('pending', 'approved', 'declined'));

create index if not exists transactions_user_date_idx on public.transactions (user_id, date desc);
create index if not exists transactions_user_account_idx on public.transactions (user_id, account_id);
create index if not exists transactions_status_idx on public.transactions (status);

-- Give every profile the four accounts, then any extra codes already on the ledger.
insert into public.accounts (user_id, code, name, currency)
select p.id, v.code, v.name, v.currency
from public.profiles p
cross join (
  values
    ('personal', 'Personal', 'GBP'),
    ('savings', 'Savings', 'GBP'),
    ('euro', 'Euro', 'EUR'),
    ('usd', 'US Dollar', 'USD')
) as v(code, name, currency)
on conflict (user_id, code) do nothing;

insert into public.accounts (user_id, code, name, currency)
select distinct t.user_id, t.account_id, initcap(t.account_id), 'USD'
from public.transactions t
where not exists (
  select 1 from public.accounts a
  where a.user_id = t.user_id and a.code = t.account_id
)
on conflict (user_id, code) do nothing;

alter table public.transactions drop constraint if exists transactions_account_fkey;
alter table public.transactions
  add constraint transactions_account_fkey
  foreign key (user_id, account_id) references public.accounts (user_id, code) on delete cascade;

-- ---------------------------------------------------------------------------
-- Timestamps and role protection
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists accounts_set_updated_at on public.accounts;
create trigger accounts_set_updated_at
  before update on public.accounts
  for each row execute function public.set_updated_at();

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'super') and status = 'active'
  );
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'active'
  );
$$;

create or replace function public.assert_active_caller()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if public.is_staff() then
    return;
  end if;
  if not public.is_active_user() then
    raise exception 'Account is not active';
  end if;
end;
$$;

create or replace function public.admin_set_profile_status(p_user_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'Not authorized';
  end if;
  if p_status not in ('active', 'suspended', 'deleted') then
    raise exception 'Invalid status';
  end if;

  update public.profiles
  set status = p_status, updated_at = now()
  where id = p_user_id
    and role = 'customer';

  if not found then
    raise exception 'Customer profile not found';
  end if;
end;
$$;

grant execute on function public.admin_set_profile_status(uuid, text) to authenticated;

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null and not public.is_staff() then
    if new.role is distinct from old.role then
      raise exception 'Only staff can change a role';
    end if;
    if new.status is distinct from old.status then
      raise exception 'Only staff can change account status';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- ---------------------------------------------------------------------------
-- New signup: profile plus the four accounts.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, email, phone, role, status, kyc_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    'customer',
    'active',
    'not_started'
  )
  on conflict (id) do nothing;

  insert into public.accounts (user_id, code, name, currency)
  values
    (new.id, 'personal', 'Personal', 'GBP'),
    (new.id, 'savings', 'Savings', 'GBP'),
    (new.id, 'euro', 'Euro', 'EUR'),
    (new.id, 'usd', 'US Dollar', 'USD')
  on conflict (user_id, code) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS. A customer sees only their own rows. Staff see every row.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "read own or staff profile" on public.profiles;
create policy "read own or staff profile" on public.profiles
  for select using (auth.uid() = id or public.is_staff());

drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile" on public.profiles
  for insert with check (auth.uid() = id and role = 'customer' and status = 'active');

drop policy if exists "update own or staff profile" on public.profiles;
create policy "update own or staff profile" on public.profiles
  for update using (auth.uid() = id or public.is_staff())
  with check (auth.uid() = id or public.is_staff());

drop policy if exists "read own or staff accounts" on public.accounts;
create policy "read own or staff accounts" on public.accounts
  for select using (auth.uid() = user_id or public.is_staff());

drop policy if exists "insert own accounts" on public.accounts;
create policy "insert own accounts" on public.accounts
  for insert with check (auth.uid() = user_id);

drop policy if exists "read own or staff transactions" on public.transactions;
create policy "read own or staff transactions" on public.transactions
  for select using (auth.uid() = user_id or public.is_staff());

drop policy if exists "insert own or staff transactions" on public.transactions;
create policy "insert own or staff transactions" on public.transactions
  for insert with check (
    public.is_staff()
    or (auth.uid() = user_id and public.is_active_user())
  );

drop policy if exists "update own or staff transactions" on public.transactions;
create policy "update own or staff transactions" on public.transactions
  for update using (auth.uid() = user_id or public.is_staff())
  with check (auth.uid() = user_id or public.is_staff());

drop policy if exists "delete own or staff transactions" on public.transactions;
create policy "delete own or staff transactions" on public.transactions
  for delete using (auth.uid() = user_id or public.is_staff());

-- ---------------------------------------------------------------------------
-- KYC submissions. One pending row per customer; staff approve or reject.
-- Files live in the private "kyc" bucket under {user_id}/front|back|selfie|proof_of_address.
-- ---------------------------------------------------------------------------

create table if not exists public.kyc_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  id_type text not null,
  id_document_path text,
  id_document_back_path text,
  selfie_path text not null,
  proof_of_address_path text not null,
  status text not null default 'pending',
  rejection_reason text,
  payload jsonb,
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.kyc_submissions drop constraint if exists kyc_submissions_id_type_check;
alter table public.kyc_submissions
  add constraint kyc_submissions_id_type_check
  check (id_type in ('passport', 'driving_licence', 'national_id'));

alter table public.kyc_submissions drop constraint if exists kyc_submissions_status_check;
alter table public.kyc_submissions
  add constraint kyc_submissions_status_check
  check (status in ('pending', 'approved', 'rejected'));

create index if not exists kyc_submissions_user_id_idx on public.kyc_submissions (user_id);
create index if not exists kyc_submissions_status_idx on public.kyc_submissions (status);
create unique index if not exists kyc_submissions_one_pending_per_user
  on public.kyc_submissions (user_id)
  where status = 'pending';

drop trigger if exists set_kyc_submissions_updated_at on public.kyc_submissions;
create trigger set_kyc_submissions_updated_at
  before update on public.kyc_submissions
  for each row execute function public.set_updated_at();

create or replace function public.sync_kyc_submission_to_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  merged jsonb;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  if new.status = 'approved' then
    update public.profiles
    set
      kyc_status = 'verified',
      kyc = case
        when new.payload is not null then new.payload
        else kyc
      end,
      updated_at = now()
    where id = new.user_id;
  elsif new.status = 'rejected' then
    merged := coalesce(new.payload, '{}'::jsonb);
    if new.rejection_reason is not null then
      merged := merged || jsonb_build_object('rejectionReason', new.rejection_reason);
    end if;
    update public.profiles
    set kyc_status = 'rejected', kyc = merged, updated_at = now()
    where id = new.user_id;
  end if;

  return new;
end;
$$;

drop trigger if exists kyc_submission_sync_profile on public.kyc_submissions;
create trigger kyc_submission_sync_profile
  after update of status on public.kyc_submissions
  for each row execute function public.sync_kyc_submission_to_profile();

alter table public.kyc_submissions enable row level security;

drop policy if exists "read own or staff kyc submissions" on public.kyc_submissions;
create policy "read own or staff kyc submissions" on public.kyc_submissions
  for select using (auth.uid() = user_id or public.is_staff());

drop policy if exists "insert own kyc submission" on public.kyc_submissions;
create policy "insert own kyc submission" on public.kyc_submissions
  for insert with check (
    auth.uid() = user_id
    and status = 'pending'
    and public.is_active_user()
  );

drop policy if exists "staff review kyc submissions" on public.kyc_submissions;
create policy "staff review kyc submissions" on public.kyc_submissions
  for update using (public.is_staff())
  with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- Top-up receipts (storage path + review workflow).
-- ---------------------------------------------------------------------------

create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  account_code text not null,
  amount numeric not null,
  currency text not null,
  storage_path text not null,
  file_name text,
  transaction_id text,
  status text not null default 'pending',
  rejection_reason text,
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (user_id, account_code) references public.accounts (user_id, code) on delete cascade
);

alter table public.receipts drop constraint if exists receipts_amount_positive;
alter table public.receipts add constraint receipts_amount_positive check (amount > 0);

alter table public.receipts drop constraint if exists receipts_status_check;
alter table public.receipts
  add constraint receipts_status_check check (status in ('pending', 'approved', 'rejected'));

create index if not exists receipts_user_id_idx on public.receipts (user_id);
create index if not exists receipts_status_idx on public.receipts (status);
create index if not exists receipts_transaction_id_idx on public.receipts (transaction_id);

drop trigger if exists receipts_set_updated_at on public.receipts;
create trigger receipts_set_updated_at
  before update on public.receipts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Withdrawal requests.
-- ---------------------------------------------------------------------------

create table if not exists public.withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  account_code text not null,
  amount numeric not null,
  currency text not null,
  payee_name text not null,
  method text not null default '',
  country text not null default '',
  transaction_id text not null,
  status text not null default 'pending',
  rejection_reason text,
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (user_id, account_code) references public.accounts (user_id, code) on delete cascade
);

alter table public.withdrawal_requests drop constraint if exists withdrawal_requests_amount_positive;
alter table public.withdrawal_requests add constraint withdrawal_requests_amount_positive check (amount > 0);

alter table public.withdrawal_requests drop constraint if exists withdrawal_requests_status_check;
alter table public.withdrawal_requests
  add constraint withdrawal_requests_status_check check (status in ('pending', 'approved', 'rejected'));

create index if not exists withdrawal_requests_user_id_idx on public.withdrawal_requests (user_id);
create index if not exists withdrawal_requests_status_idx on public.withdrawal_requests (status);

drop trigger if exists withdrawal_requests_set_updated_at on public.withdrawal_requests;
create trigger withdrawal_requests_set_updated_at
  before update on public.withdrawal_requests
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Ledger helpers (non-negative balances, staff review).
-- ---------------------------------------------------------------------------

create or replace function public.available_account_balance(p_user_id uuid, p_account_code text)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select a.balance - coalesce(
    (
      select sum(abs(t.amount))
      from public.transactions t
      where t.user_id = p_user_id
        and t.account_id = p_account_code
        and t.status = 'pending'
        and t.amount < 0
    ),
    0
  )
  from public.accounts a
  where a.user_id = p_user_id and a.code = p_account_code;
$$;

create or replace function public.apply_account_delta(
  p_user_id uuid,
  p_account_code text,
  p_delta numeric
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric;
begin
  if p_delta = 0 then
    raise exception 'Amount must be non-zero';
  end if;

  select balance into v_balance
  from public.accounts
  where user_id = p_user_id and code = p_account_code
  for update;

  if not found then
    raise exception 'Account not found';
  end if;

  if v_balance + p_delta < 0 then
    raise exception 'Insufficient balance';
  end if;

  update public.accounts
  set balance = balance + p_delta, updated_at = now()
  where user_id = p_user_id and code = p_account_code
  returning balance into v_balance;

  return v_balance;
end;
$$;

create or replace function public.review_receipt(
  p_receipt_id uuid,
  p_decision text,
  p_reason text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.receipts%rowtype;
  tx_id text;
begin
  if not public.is_staff() then
    raise exception 'Not authorized';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception 'Invalid decision';
  end if;

  select * into r from public.receipts where id = p_receipt_id for update;
  if not found then
    raise exception 'Receipt not found';
  end if;
  if r.status <> 'pending' then
    raise exception 'Receipt already reviewed';
  end if;

  if p_decision = 'approved' then
    tx_id := coalesce(r.transaction_id, 'rcpt-' || replace(r.id::text, '-', ''));
    insert into public.transactions (
      id, user_id, account_id, name, category, amount, date, status, method, receipt_path, receipt_name, receipt_sent
    )
    values (
      tx_id,
      r.user_id,
      r.account_code,
      'Top up',
      'Top up',
      r.amount,
      current_date,
      'approved',
      'Receipt',
      r.storage_path,
      coalesce(r.file_name, 'Receipt'),
      true
    )
    on conflict (id) do update set
      status = 'approved',
      amount = excluded.amount,
      receipt_path = excluded.receipt_path,
      receipt_name = excluded.receipt_name,
      receipt_sent = true;

    perform public.apply_account_delta(r.user_id, r.account_code, r.amount);

    update public.receipts
    set
      status = 'approved',
      rejection_reason = null,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      transaction_id = tx_id
    where id = p_receipt_id;
  else
    if r.transaction_id is not null then
      update public.transactions
      set status = 'declined'
      where id = r.transaction_id and user_id = r.user_id;
    end if;

    update public.receipts
    set
      status = 'rejected',
      rejection_reason = p_reason,
      reviewed_by = auth.uid(),
      reviewed_at = now()
    where id = p_receipt_id;
  end if;

  return coalesce(tx_id, r.transaction_id);
end;
$$;

create or replace function public.review_pending_transaction(
  p_user_id uuid,
  p_transaction_id text,
  p_decision text,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  t public.transactions%rowtype;
  incoming public.transactions%rowtype;
  v_in_id text;
begin
  if not public.is_staff() then
    raise exception 'Not authorized';
  end if;
  if p_decision not in ('approved', 'rejected') then
    raise exception 'Invalid decision';
  end if;

  select * into t
  from public.transactions
  where id = p_transaction_id and user_id = p_user_id
  for update;

  if not found then
    raise exception 'Transaction not found';
  end if;
  if t.status is distinct from 'pending' then
    raise exception 'Transaction is not pending';
  end if;

  v_in_id := p_transaction_id || '-in';

  if t.category = 'Transfer' and t.amount < 0 and t.id not like '%-in' then
    select * into incoming from public.transactions where id = v_in_id for update;
    if p_decision = 'approved' then
      perform public.apply_account_delta(t.user_id, t.account_id, t.amount);
      update public.transactions set status = 'approved' where id = p_transaction_id;
      if incoming.id is not null then
        perform public.apply_account_delta(incoming.user_id, incoming.account_id, incoming.amount);
        update public.transactions set status = 'approved' where id = v_in_id;
      end if;
    else
      update public.transactions set status = 'declined' where id = p_transaction_id;
      if incoming.id is not null then
        update public.transactions set status = 'declined' where id = v_in_id;
      end if;
    end if;
    return;
  end if;

  if p_decision = 'approved' then
    if t.amount > 0 then
      perform public.apply_account_delta(p_user_id, t.account_id, t.amount);
      update public.transactions set status = 'approved' where id = p_transaction_id;
    elsif t.amount < 0 then
      perform public.apply_account_delta(p_user_id, t.account_id, t.amount);
      update public.transactions set status = 'approved' where id = p_transaction_id;
    else
      update public.transactions set status = 'approved' where id = p_transaction_id;
    end if;
  else
    update public.transactions set status = 'declined' where id = p_transaction_id;
  end if;
end;
$$;

create or replace function public.transfer_between_own_accounts(
  p_from_account_code text,
  p_to_account_code text,
  p_amount numeric,
  p_memo text default 'Transfer'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_stamp text;
  v_out_id text;
  v_in_id text;
  v_available numeric;
begin
  perform public.assert_active_caller();
  v_user_id := auth.uid();
  if p_from_account_code = p_to_account_code then
    raise exception 'Choose two different accounts';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be positive';
  end if;

  v_available := public.available_account_balance(v_user_id, p_from_account_code);
  if p_amount > v_available then
    raise exception 'Insufficient balance';
  end if;

  perform public.apply_account_delta(v_user_id, p_from_account_code, -p_amount);
  perform public.apply_account_delta(v_user_id, p_to_account_code, p_amount);

  v_stamp := replace(gen_random_uuid()::text, '-', '');
  v_out_id := 'xfer-' || v_stamp;
  v_in_id := 'xfer-' || v_stamp || '-in';

  insert into public.transactions (id, user_id, account_id, name, category, amount, date, status)
  values
    (v_out_id, v_user_id, p_from_account_code, coalesce(nullif(trim(p_memo), ''), 'Transfer'), 'Transfer', -p_amount, current_date, 'approved'),
    (v_in_id, v_user_id, p_to_account_code, 'From ' || p_from_account_code, 'Transfer', p_amount, current_date, 'approved');

  return jsonb_build_object('outgoing_id', v_out_id, 'incoming_id', v_in_id);
end;
$$;

create or replace function public.transfer_between_users(
  p_from_account_code text,
  p_recipient_email text,
  p_amount numeric,
  p_memo text default 'Transfer'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_from_id uuid := auth.uid();
  v_to_id uuid;
  v_currency text;
  v_to_account text;
  v_stamp text;
  v_out_id text;
  v_in_id text;
  v_available numeric;
begin
  perform public.assert_active_caller();
  v_from_id := auth.uid();

  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be positive';
  end if;

  select currency into v_currency
  from public.accounts
  where user_id = v_from_id and code = p_from_account_code;

  if v_currency is null then
    raise exception 'Source account not found';
  end if;

  v_available := public.available_account_balance(v_from_id, p_from_account_code);
  if p_amount > v_available then
    raise exception 'Insufficient balance';
  end if;

  select id into v_to_id
  from public.profiles
  where lower(email) = lower(trim(p_recipient_email))
    and status = 'active'
  limit 1;

  if v_to_id is null then
    raise exception 'Recipient not found';
  end if;
  if v_to_id = v_from_id then
    raise exception 'Cannot transfer to yourself';
  end if;

  select code into v_to_account
  from public.accounts
  where user_id = v_to_id and currency = v_currency
  order by case code when p_from_account_code then 0 else 1 end, code
  limit 1;

  if v_to_account is null then
    raise exception 'Recipient has no matching currency account';
  end if;

  perform public.apply_account_delta(v_from_id, p_from_account_code, -p_amount);
  perform public.apply_account_delta(v_to_id, v_to_account, p_amount);

  v_stamp := replace(gen_random_uuid()::text, '-', '');
  v_out_id := 'xfer-' || v_stamp;
  v_in_id := 'xfer-' || v_stamp || '-in';

  insert into public.transactions (id, user_id, account_id, name, category, amount, date, status)
  values (
    v_out_id,
    v_from_id,
    p_from_account_code,
    coalesce(nullif(trim(p_memo), ''), 'Transfer') || ' · ' || trim(p_recipient_email),
    'Transfer',
    -p_amount,
    current_date,
    'approved'
  );

  insert into public.transactions (id, user_id, account_id, name, category, amount, date, status)
  values (
    v_in_id,
    v_to_id,
    v_to_account,
    'From ' || (select email from public.profiles where id = v_from_id limit 1),
    'Transfer',
    p_amount,
    current_date,
    'approved'
  );

  return jsonb_build_object(
    'outgoing_id', v_out_id,
    'incoming_id', v_in_id,
    'recipient_id', v_to_id,
    'recipient_account', v_to_account
  );
end;
$$;

create or replace function public.request_withdrawal(
  p_account_code text,
  p_amount numeric,
  p_payee_name text,
  p_method text default '',
  p_country text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_currency text;
  v_available numeric;
  v_tx_id text;
  v_request_id uuid;
begin
  perform public.assert_active_caller();
  v_user_id := auth.uid();

  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be positive';
  end if;
  if length(trim(p_payee_name)) < 2 then
    raise exception 'Payee name required';
  end if;

  select currency into v_currency
  from public.accounts
  where user_id = v_user_id and code = p_account_code;

  if v_currency is null then
    raise exception 'Account not found';
  end if;

  v_available := public.available_account_balance(v_user_id, p_account_code);
  if p_amount > v_available then
    raise exception 'Insufficient balance';
  end if;

  v_tx_id := 'wd-' || replace(gen_random_uuid()::text, '-', '');
  v_request_id := gen_random_uuid();

  insert into public.withdrawal_requests (
    id, user_id, account_code, amount, currency, payee_name, method, country, transaction_id, status
  )
  values (
    v_request_id,
    v_user_id,
    p_account_code,
    p_amount,
    v_currency,
    trim(p_payee_name),
    coalesce(p_method, ''),
    coalesce(p_country, ''),
    v_tx_id,
    'pending'
  );

  insert into public.transactions (
    id, user_id, account_id, name, category, amount, date, status, method
  )
  values (
    v_tx_id,
    v_user_id,
    p_account_code,
    'Withdrawal · ' || trim(p_payee_name),
    'Withdrawal',
    -p_amount,
    current_date,
    'pending',
    coalesce(p_method, '')
  );

  return v_request_id;
end;
$$;

create or replace function public.review_withdrawal(
  p_request_id uuid,
  p_decision text,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  w public.withdrawal_requests%rowtype;
begin
  if not public.is_staff() then
    raise exception 'Not authorized';
  end if;
  if p_decision not in ('approved', 'rejected') then
    raise exception 'Invalid decision';
  end if;

  select * into w from public.withdrawal_requests where id = p_request_id for update;
  if not found then
    raise exception 'Withdrawal not found';
  end if;
  if w.status <> 'pending' then
    raise exception 'Withdrawal already reviewed';
  end if;

  if p_decision = 'approved' then
    perform public.apply_account_delta(w.user_id, w.account_code, -w.amount);
    update public.transactions set status = 'approved' where id = w.transaction_id and user_id = w.user_id;
    update public.withdrawal_requests
    set status = 'approved', rejection_reason = null, reviewed_by = auth.uid(), reviewed_at = now()
    where id = p_request_id;
  else
    update public.transactions set status = 'declined' where id = w.transaction_id and user_id = w.user_id;
    update public.withdrawal_requests
    set status = 'rejected', rejection_reason = p_reason, reviewed_by = auth.uid(), reviewed_at = now()
    where id = p_request_id;
  end if;
end;
$$;

grant execute on function public.available_account_balance(uuid, text) to authenticated;
grant execute on function public.transfer_between_own_accounts(text, text, numeric, text) to authenticated;
grant execute on function public.transfer_between_users(text, text, numeric, text) to authenticated;
grant execute on function public.request_withdrawal(text, numeric, text, text, text) to authenticated;
grant execute on function public.review_receipt(uuid, text, text) to authenticated;
grant execute on function public.review_pending_transaction(uuid, text, text, text) to authenticated;
grant execute on function public.review_withdrawal(uuid, text, text) to authenticated;

create or replace function public.admin_adjust_balance(
  p_user_id uuid,
  p_account_code text,
  p_delta numeric,
  p_label text default null
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric;
  v_category text;
  v_name text;
  v_id text;
begin
  if not public.is_staff() then
    raise exception 'Not authorized';
  end if;
  if p_delta = 0 then
    raise exception 'Amount must be non-zero';
  end if;
  if p_account_code not in ('personal', 'savings', 'euro', 'usd') then
    raise exception 'Invalid account';
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id and role = 'customer') then
    raise exception 'Customer profile not found';
  end if;
  v_balance := public.apply_account_delta(p_user_id, p_account_code, p_delta);
  if p_delta > 0 then
    v_category := 'Top up';
    v_name := coalesce(nullif(trim(p_label), ''), 'Funds added by North Rim Inc');
  else
    v_category := 'Withdrawal';
    v_name := coalesce(nullif(trim(p_label), ''), 'Funds removed by North Rim Inc');
  end if;
  v_id := 'admin-' || replace(gen_random_uuid()::text, '-', '');
  insert into public.transactions (id, user_id, account_id, name, category, amount, date, status, method)
  values (v_id, p_user_id, p_account_code, v_name, v_category, p_delta, current_date, 'approved', 'Admin');
  return v_balance;
end;
$$;

grant execute on function public.admin_adjust_balance(uuid, text, numeric, text) to authenticated;

alter table public.receipts enable row level security;
alter table public.withdrawal_requests enable row level security;

drop policy if exists "read own or staff receipts table" on public.receipts;
create policy "read own or staff receipts table" on public.receipts
  for select using (auth.uid() = user_id or public.is_staff());

drop policy if exists "insert own receipts table" on public.receipts;
create policy "insert own receipts table" on public.receipts
  for insert with check (
    auth.uid() = user_id and status = 'pending' and public.is_active_user()
  );

drop policy if exists "read own or staff withdrawals" on public.withdrawal_requests;
create policy "read own or staff withdrawals" on public.withdrawal_requests
  for select using (auth.uid() = user_id or public.is_staff());

drop policy if exists "insert own withdrawal" on public.withdrawal_requests;
create policy "insert own withdrawal" on public.withdrawal_requests
  for insert with check (
    auth.uid() = user_id and status = 'pending' and public.is_active_user()
  );

-- ---------------------------------------------------------------------------
-- Storage. Create the private buckets "receipts" and "kyc" first.
-- ---------------------------------------------------------------------------

drop policy if exists "read own or staff receipts" on storage.objects;
create policy "read own or staff receipts" on storage.objects
  for select using (
    bucket_id = 'receipts'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_staff())
  );

drop policy if exists "upload own receipts" on storage.objects;
create policy "upload own receipts" on storage.objects
  for insert with check (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
    and public.is_active_user()
  );

drop policy if exists "update own receipts" on storage.objects;
create policy "update own receipts" on storage.objects
  for update using (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "read own or staff kyc" on storage.objects;
create policy "read own or staff kyc" on storage.objects
  for select using (
    bucket_id = 'kyc'
    and (auth.uid()::text = (storage.foldername(name))[1] or public.is_staff())
  );

drop policy if exists "upload own kyc" on storage.objects;
create policy "upload own kyc" on storage.objects
  for insert with check (
    bucket_id = 'kyc'
    and auth.uid()::text = (storage.foldername(name))[1]
    and public.is_active_user()
  );

drop policy if exists "update own kyc" on storage.objects;
create policy "update own kyc" on storage.objects
  for update using (
    bucket_id = 'kyc'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
