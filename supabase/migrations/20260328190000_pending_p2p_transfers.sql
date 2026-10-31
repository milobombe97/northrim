-- P2P transfers: pending until staff approval (no balance move at submit time).
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
    'pending'
  );

  insert into public.transactions (id, user_id, account_id, name, category, amount, date, status)
  values (
    v_in_id,
    v_to_id,
    v_to_account,
    'From transfer · ' || trim(p_recipient_email),
    'Transfer',
    p_amount,
    current_date,
    'pending'
  );

  return jsonb_build_object(
    'outgoing_id', v_out_id,
    'incoming_id', v_in_id,
    'recipient_id', v_to_id,
    'recipient_account', v_to_account
  );
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
