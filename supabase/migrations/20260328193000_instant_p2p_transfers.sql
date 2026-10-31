-- P2P transfers: debit sender and credit recipient immediately (exact amount).

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
  v_sender_email text;
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

  select email into v_sender_email from public.profiles where id = v_from_id;

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
    'From ' || coalesce(v_sender_email, 'transfer'),
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

grant execute on function public.transfer_between_users(text, text, numeric, text) to authenticated;
